"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
      theme: "light";
    },
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type Props = {
  onToken: (token: string) => void;
  resetSignal: number;
};

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function Turnstile({ onToken, resetSignal }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!SITE_KEY || !ready || !containerRef.current || !window.turnstile || widgetRef.current) {
      return;
    }
    widgetRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      callback: onToken,
      "expired-callback": () => onToken(""),
      "error-callback": () => onToken(""),
      theme: "light",
    });

    return () => {
      if (widgetRef.current) window.turnstile?.remove(widgetRef.current);
      widgetRef.current = null;
    };
  }, [onToken, ready]);

  useEffect(() => {
    if (resetSignal > 0 && widgetRef.current) {
      window.turnstile?.reset(widgetRef.current);
      onToken("");
    }
  }, [onToken, resetSignal]);

  if (!SITE_KEY) return null;

  return (
    <div className="mt-4" aria-label="Spam protection">
      <Script
        id="cloudflare-turnstile"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
      />
      <div ref={containerRef} />
    </div>
  );
}


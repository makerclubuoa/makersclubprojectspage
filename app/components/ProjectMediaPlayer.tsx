"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  embedUrl,
  formatClock,
  providerLabel,
  type ProjectMedia,
} from "@/lib/media";

// Every mounted player parks a pause callback here so starting one preview
// stops whichever card was already playing — a grid of cards all talking over
// each other is the failure mode this exists to prevent.
const pausers = new Set<() => void>();

// Passing over a card on the way somewhere else shouldn't fire off a network
// request. Only a deliberate rest on the card starts the preview.
const HOVER_DELAY_MS = 350;

const STRIP =
  "absolute inset-x-0 bottom-0 z-[3] flex items-center gap-2 px-2.5 py-2 bg-gradient-to-t from-black/85 via-black/60 to-transparent pt-6 pointer-events-auto";

const PLAY_BTN =
  "shrink-0 grid place-items-center w-7 h-7 rounded-full border-2 border-black bg-white text-black text-[10px] leading-none shadow-[2px_2px_0px_0px_#000] transition-[transform,background-color] duration-150 hover:bg-accent hover:text-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none";

const RANGE =
  "flex-1 min-w-0 h-1 appearance-none bg-white/35 rounded-full cursor-pointer outline-none " +
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[11px] [&::-webkit-slider-thumb]:h-[11px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:cursor-pointer " +
  "[&::-moz-range-thumb]:w-[11px] [&::-moz-range-thumb]:h-[11px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-black [&::-moz-range-thumb]:cursor-pointer";

const TIME =
  "shrink-0 text-[10px] font-bold tracking-[0.04em] text-white tabular-nums";

const LABEL =
  "flex-1 min-w-0 text-[10px] font-bold tracking-[0.06em] uppercase text-white/90 truncate";

/** The card is a link — keep player interaction from navigating. */
function swallow(e: React.SyntheticEvent) {
  e.preventDefault();
  e.stopPropagation();
}

/**
 * The preview player that sits over a project card's cover art.
 *
 * Hovering the card starts playback from the submitter's chosen preview point;
 * the button is there because browsers block unprompted audio until the visitor
 * has interacted with the page, so hover alone can't be the only way in.
 */
export default function ProjectMediaPlayer(props: {
  media: ProjectMedia;
  poster?: string | null;
  hovered?: boolean;
}) {
  // Linked video plays through the provider's iframe; uploaded audio gets the
  // full scrubber. They share nothing but the strip's look, hence two paths.
  return props.media.provider ? (
    <EmbedPreview {...props} />
  ) : (
    <FilePreview {...props} />
  );
}

/* ── Uploaded audio ─────────────────────────────────── */

function FilePreview({
  media,
  hovered = false,
}: {
  media: ProjectMedia;
  poster?: string | null;
  hovered?: boolean;
}) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Hover-started previews stop when the pointer leaves; a preview the visitor
  // deliberately pressed play on keeps going.
  const startedByHover = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(media.duration ?? 0);

  const reset = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.pause();
    if (el.readyState > 0) {
      try {
        el.currentTime = 0;
      } catch {
        /* seeking before the browser has a timeline — harmless */
      }
    }
    setCurrent(0);
  }, []);

  const pause = useCallback(() => {
    ref.current?.pause();
  }, []);

  useEffect(() => {
    pausers.add(pause);
    return () => {
      pausers.delete(pause);
    };
  }, [pause]);

  const start = useCallback(
    (viaHover: boolean) => {
      const el = ref.current;
      if (!el) return;
      pausers.forEach((p) => {
        if (p !== pause) p();
      });
      startedByHover.current = viaHover;
      if (el.readyState > 0 && el.ended) {
        try {
          el.currentTime = 0;
        } catch {
          /* ignore */
        }
      }
      // Autoplay rejection is expected before the visitor's first interaction;
      // the play button stays available, so there's nothing to recover from.
      void el.play().catch(() => {});
    },
    [pause],
  );

  useEffect(() => {
    if (hovered) {
      hoverTimer.current = setTimeout(() => start(true), HOVER_DELAY_MS);
      return () => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
      };
    }
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (startedByHover.current) reset();
    return undefined;
  }, [hovered, start, reset]);

  function togglePlay(e: React.MouseEvent) {
    swallow(e);
    if (playing) pause();
    else start(false);
  }

  function scrub(e: React.ChangeEvent<HTMLInputElement>) {
    const el = ref.current;
    const next = Number(e.target.value);
    setCurrent(next);
    if (el && el.readyState > 0) {
      try {
        el.currentTime = next;
      } catch {
        /* ignore */
      }
    }
    // Scrubbing is a deliberate act — don't let a mouse-out undo it.
    startedByHover.current = false;
  }

  return (
    <div className="absolute inset-0 z-[2] pointer-events-none">
      {/* preload="none" means a grid of cards costs zero media bytes until
          somebody actually asks to hear something. */}
      <audio
        ref={ref}
        src={media.url}
        preload="none"
        className="hidden"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          reset();
        }}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setDuration(d);
        }}
      />

      <div className={STRIP} onClick={swallow}>
        <button
          type="button"
          className={PLAY_BTN}
          onClick={togglePlay}
          aria-label={playing ? "Pause preview" : "Play preview"}
        >
          {playing ? "❚❚" : "▶"}
        </button>

        <input
          type="range"
          className={RANGE}
          min={0}
          max={duration || 30}
          step={0.1}
          value={Math.min(current, duration || Infinity)}
          onChange={scrub}
          onClick={swallow}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Scrub preview"
        />

        <span className={TIME}>
          {formatClock(current)}
          {duration > 0 ? ` / ${formatClock(duration)}` : ""}
        </span>

        <span className="shrink-0 text-[11px] text-white/85 leading-none" aria-hidden>
          ♪
        </span>
      </div>
    </div>
  );
}

/* ── Linked video (YouTube / Vimeo) ─────────────────── */

function EmbedPreview({
  media,
  hovered = false,
}: {
  media: ProjectMedia;
  poster?: string | null;
  hovered?: boolean;
}) {
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // `muted` on hover because that's the only autoplay browsers permit; a
  // deliberate press of play counts as a gesture, so it can have sound.
  const [mode, setMode] = useState<"idle" | "hover" | "playing">("idle");

  const stop = useCallback(() => setMode("idle"), []);

  useEffect(() => {
    pausers.add(stop);
    return () => {
      pausers.delete(stop);
    };
  }, [stop]);

  useEffect(() => {
    if (hovered) {
      hoverTimer.current = setTimeout(() => {
        setMode((m) => (m === "playing" ? m : "hover"));
      }, HOVER_DELAY_MS);
      return () => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
      };
    }
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    // Only a hover-started preview is torn down on mouse-out.
    setMode((m) => (m === "hover" ? "idle" : m));
    return undefined;
  }, [hovered]);

  function togglePlay(e: React.MouseEvent) {
    swallow(e);
    if (mode === "playing") {
      setMode("idle");
      return;
    }
    pausers.forEach((p) => {
      if (p !== stop) p();
    });
    setMode("playing");
  }

  const src =
    mode === "idle"
      ? null
      : embedUrl(media, { autoplay: true, muted: mode === "hover" });

  return (
    <div className="absolute inset-0 z-[2] pointer-events-none">
      {src && (
        <iframe
          src={src}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
          title={media.title || "Video preview"}
        />
      )}

      <div className={STRIP} onClick={swallow}>
        <button
          type="button"
          className={PLAY_BTN}
          onClick={togglePlay}
          aria-label={mode === "playing" ? "Stop video" : "Play video"}
        >
          {mode === "playing" ? "❚❚" : "▶"}
        </button>

        <span className={LABEL}>
          {media.provider ? providerLabel(media.provider) : "Video"}
          {mode === "hover" ? " · muted" : ""}
        </span>
      </div>
    </div>
  );
}

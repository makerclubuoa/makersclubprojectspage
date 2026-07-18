"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/app/components/Nav";
import Screentone from "@/app/components/global/Screentone";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/components/AuthProvider";
import {
  pageWrap,
  holt,
  form,
  formInner,
  formFig,
  field,
  fieldLabel,
  fieldReq,
  fieldInput,
  btnGradient,
  btnArr,
} from "@/lib/ui";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [user, loading, router]);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError("");

    // Open signup: Supabase creates the user on first sign-in (shouldCreateUser
    // defaults true); the post-login ensure-ghost sync mirrors them into Ghost.
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setSending(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  if (loading) return null;

  return (
    <div className={pageWrap}>
      <Nav />
      <main className="min-h-dvh flex items-center justify-center px-5 py-[100px]">
        <div className={`${form} max-w-[440px] w-full overflow-hidden`}>
          <Screentone />
          <div className={`${formInner} relative z-[1]`}>
            <span className={formFig}>Members area</span>
            <h1 className={`${holt} text-3xl text-pop-violet mt-1 mb-4`}>
              Sign In
            </h1>

            {sent ? (
              <div className="border-2 border-black rounded-[6px] py-10 px-6 text-center bg-paper-2">
                <div className="text-[36px] text-pop-magenta mb-4">✉</div>
                <h2 className={`${holt} text-2xl text-pop-magenta mt-0 mb-3`}>
                  Check your inbox!
                </h2>
                <p className="text-ink-2 font-semibold text-sm max-w-[44ch] mx-auto leading-[1.6]">
                  We sent a magic link to <strong className="text-ink">{email}</strong>. Click it to
                  finish signing in.
                </p>
              </div>
            ) : (
              <>
                <p className="font-semibold mb-7 text-sm leading-[1.65]">
                  Sign in to like projects and submit your own to the archive.
                  Maker Club members only.
                </p>

                <form onSubmit={handleMagicLink}>
                  <div className={field}>
                    <label className={fieldLabel}>
                      Email <span className={fieldReq}>*</span>
                    </label>
                    <input
                      className={fieldInput}
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  {error && (
                    <p className="text-pop-red font-semibold text-xs mb-3 tracking-[0.04em]">
                      {error}
                    </p>
                  )}
                  <button
                    className={`${btnGradient} w-full justify-center flex`}
                    type="submit"
                    disabled={sending}
                  >
                    {sending ? "Checking…" : "Send magic link"}{" "}
                    <span className={btnArr}>→</span>
                  </button>
                </form>

                <p className="text-[11px] font-medium text-ink-2 mt-5 leading-[1.5] tracking-[0.04em]">
                  No password needed. We&rsquo;ll send a one-click sign-in link
                  to your inbox.{" "}
                  <a href="https://makeuoa.nz" className="text-ink font-semibold underline">
                    Not a member yet?
                  </a>
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/components/AuthProvider";
import Screentone from "@/app/components/global/Screentone";
import Turnstile from "@/app/components/membership/Turnstile";
import doodle from "@/public/doodle-soldering-iron.png";
import { currentMembershipYear } from "@/lib/membership";
import { supabase } from "@/lib/supabase";
import {
  btnArr,
  btnGradient,
  container,
  field,
  fieldError,
  fieldInput,
  fieldLabel,
  fieldReq,
  fieldRow,
  fieldTextarea,
  form,
  formActions,
  formFig,
  formInner,
  pageBand,
  pageBandDoodle,
  pageBandSub,
  pageBandTitle,
  pageWrap,
  secHead,
  submitMain,
} from "@/lib/ui";

type FormState = {
  full_name: string;
  email: string;
  confirm_email: string;
  upi: string;
  student_id: string;
  study_years: string;
  faculty: string;
  interests_to_gain: string;
  skills_to_share: string;
  consent: boolean;
  company: string;
  uoa_member: "" | "yes" | "no";
};

const TURNSTILE_ENABLED = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

const INITIAL: FormState = {
  full_name: "",
  email: "",
  confirm_email: "",
  upi: "",
  student_id: "",
  study_years: "",
  faculty: "",
  interests_to_gain: "",
  skills_to_share: "",
  consent: false,
  company: "",
  uoa_member: "",
};

export default function JoinPage() {
  const { user, loading } = useAuth();
  const membershipYear = currentMembershipYear();
  const [formState, setFormState] = useState(INITIAL);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [duplicateEmail, setDuplicateEmail] = useState(false);
  const [sent, setSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const acceptTurnstileToken = useCallback((token: string) => setTurnstileToken(token), []);

  useEffect(() => {
    const requestedEmail = new URLSearchParams(window.location.search).get("email")?.trim();
    if (requestedEmail) {
      setFormState(current => ({ ...current, email: requestedEmail }));
    }
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFormState(current => ({ ...current, [key]: value }));
    setSubmitError("");
    setDuplicateEmail(false);
  }

  function updateUoaMembership(value: FormState["uoa_member"]) {
    setFormState(current => value === "no"
      ? {
          ...current,
          uoa_member: value,
          upi: "NONE",
          student_id: "NONE",
          study_years: "",
          faculty: "NONE",
        }
      : {
          ...current,
          uoa_member: value,
          upi: current.upi === "NONE" ? "" : current.upi,
          student_id: current.student_id === "NONE" ? "" : current.student_id,
          study_years: current.uoa_member === "no" ? "" : current.study_years,
          faculty: current.faculty === "NONE" ? "" : current.faculty,
        });
    setSubmitError("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (formState.email.trim().toLowerCase() !== formState.confirm_email.trim().toLowerCase()) {
      setSubmitError("The email addresses do not match.");
      return;
    }
    if (TURNSTILE_ENABLED && !turnstileToken) {
      setSubmitError("Please complete the verification before submitting.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/membership/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formState,
          study_years: formState.uoa_member === "no" ? null : Number(formState.study_years),
          started_at: startedAt,
          turnstile_token: turnstileToken,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          setDuplicateEmail(true);
          setSubmitError("That email is already registered. Sign in instead.");
          return;
        }
        throw new Error(data.error ?? "Signup failed.");
      }
      const normalizedEmail = formState.email.trim().toLowerCase();
      setRegisteredEmail(normalizedEmail);

      const { error: confirmationError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          shouldCreateUser: false,
        },
      });
      setConfirmationSent(!confirmationError);
      setSent(true);
      setFormState(INITIAL);
      setStartedAt(Date.now());
      setTurnstileToken("");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Signup failed.");
      setTurnstileReset(current => current + 1);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={pageWrap}>
      <div className="pt-20">
        <header className={pageBand}>
          <Screentone />
          <Image src={doodle} alt="" className={`${pageBandDoodle} h-56 -bottom-16`} />
          <h1 className={`${pageBandTitle} text-pop-pink`}>Join Maker Club</h1>
          <p className={pageBandSub}>
            New here? Create your membership and website account. Already registered?{" "}
            <Link href="/login?next=/dashboard" className="font-bold underline text-white">
              Sign in
            </Link>.
          </p>
        </header>

        <main className={submitMain}>
          <div className={container}>
            <div className="max-w-[760px] mx-auto">
              {!loading && user ? (
                <div className="bg-white outline-solid outline-3 outline-black shadow-[6px_6px_0px_0px_#000] p-8 text-center">
                  <span className="text-4xl" aria-hidden>✓</span>
                  <h2 className={`${secHead} text-pop-violet mt-3 mb-3`}>You already have an account</h2>
                  <p className="font-medium leading-[1.7] mb-0">
                    You&rsquo;re signed in as {user.email}. Registration is only for new members.
                  </p>
                  <Link href="/dashboard" className={`${btnGradient} mt-6`}>
                    Go to your dashboard <span className={btnArr}>→</span>
                  </Link>
                </div>
              ) : loading ? null : sent ? (
                <div className="bg-white outline-solid outline-3 outline-black shadow-[6px_6px_0px_0px_#000] p-8 text-center">
                  <span className="text-4xl" aria-hidden>★</span>
                  <h2 className={`${secHead} text-pop-pink mt-3 mb-3`}>You&rsquo;re in!</h2>
                  <p className="font-medium leading-[1.7] mb-0">
                    {confirmationSent
                      ? "Check your inbox and use the magic link to confirm your email and sign in."
                      : "Your registration was saved, but the confirmation email could not be sent."}
                  </p>
                  <p className="font-medium text-sm text-ink-2 leading-[1.6] mt-3 mb-0">
                    {confirmationSent
                      ? "Your Ghost membership and newsletter access will activate after confirmation."
                      : "Use the sign-in page to send the magic link again."}
                  </p>
                  <Link
                    href={`/login?next=/dashboard&email=${encodeURIComponent(registeredEmail)}`}
                    className={`${btnGradient} mt-6`}
                  >
                    Sign in to your account <span className={btnArr}>→</span>
                  </Link>
                </div>
              ) : (
                <form className={form} onSubmit={submit}>
                  <div className={formInner}>
                    <span className={formFig}>{membershipYear} membership</span>
                    <div className="flex items-start justify-between gap-4 mb-5 mt-1 flex-wrap">
                      <h2 className={`${secHead} text-pop-blue m-0`}>Create your account</h2>
                      <p className="m-0 text-xs font-semibold text-ink-2">
                        Already registered?{" "}
                        <Link href="/login?next=/dashboard" className="text-ink underline">
                          Sign in
                        </Link>
                      </p>
                    </div>

                    <div className={field}>
                      <label className={fieldLabel} htmlFor="join-name">
                        Full name <span className={fieldReq}>*</span>
                      </label>
                      <input
                        id="join-name"
                        className={fieldInput}
                        value={formState.full_name}
                        onChange={event => update("full_name", event.target.value)}
                        autoComplete="name"
                        required
                      />
                    </div>

                    <div className={field}>
                      <label className={fieldLabel} htmlFor="join-email">
                        Email address <span className={fieldReq}>*</span>
                      </label>
                      <input
                        id="join-email"
                        className={fieldInput}
                        type="email"
                        value={formState.email}
                        onChange={event => update("email", event.target.value)}
                        autoComplete="email"
                        required
                      />
                      <p className="m-0 text-[11px] text-ink-2">
                        Use your @aucklanduni.ac.nz address to receive the official Engage join link.
                      </p>
                    </div>

                    <div className={field}>
                      <label className={fieldLabel} htmlFor="join-confirm-email">
                        Confirm email address <span className={fieldReq}>*</span>
                      </label>
                      <input
                        id="join-confirm-email"
                        className={fieldInput}
                        type="email"
                        value={formState.confirm_email}
                        onChange={event => update("confirm_email", event.target.value)}
                        autoComplete="email"
                        required
                      />
                    </div>

                    <div className={field}>
                      <label className={fieldLabel} htmlFor="join-uoa-member">
                        Are you currently studying at the University of Auckland?
                        <span className={fieldReq}> *</span>
                      </label>
                      <select
                        id="join-uoa-member"
                        className={fieldInput}
                        value={formState.uoa_member}
                        onChange={event => updateUoaMembership(event.target.value as FormState["uoa_member"])}
                        required
                      >
                        <option value="">Choose one</option>
                        <option value="yes">Yes, I&rsquo;m a UoA student</option>
                        <option value="no">No, but I still want to join</option>
                      </select>
                      {formState.uoa_member === "no" && (
                        <p className="m-0 text-[11px] text-ink-2">
                          You&rsquo;re absolutely welcome. We&rsquo;ll skip the university-only questions.
                        </p>
                      )}
                    </div>

                    {formState.uoa_member === "yes" && (
                      <>
                    <div className={fieldRow}>
                      <div className={field}>
                        <label className={fieldLabel} htmlFor="join-upi">
                          UPI <span className={fieldReq}>*</span>
                        </label>
                        <input
                          id="join-upi"
                          className={fieldInput}
                          placeholder="e.g. abcd123 or NONE"
                          value={formState.upi}
                          onChange={event => update("upi", event.target.value)}
                          autoCapitalize="none"
                          required
                        />
                      </div>
                      <div className={field}>
                        <label className={fieldLabel} htmlFor="join-student-id">
                          Student ID <span className={fieldReq}>*</span>
                        </label>
                        <input
                          id="join-student-id"
                          className={fieldInput}
                          placeholder="e.g. 123456789 or NONE"
                          value={formState.student_id}
                          onChange={event => update("student_id", event.target.value)}
                          inputMode="numeric"
                          required
                        />
                      </div>
                    </div>

                    <div className={fieldRow}>
                      <div className={field}>
                        <label className={fieldLabel} htmlFor="join-years">
                          Expected years remaining at UoA <span className={fieldReq}>*</span>
                        </label>
                        <input
                          id="join-years"
                          className={fieldInput}
                          type="number"
                          min="1"
                          max="20"
                          placeholder="Enter 1 for non-UoA"
                          value={formState.study_years}
                          onChange={event => update("study_years", event.target.value)}
                          required
                        />
                      </div>
                      <div className={field}>
                        <label className={fieldLabel} htmlFor="join-faculty">
                          Faculty <span className={fieldReq}>*</span>
                        </label>
                        <input
                          id="join-faculty"
                          className={fieldInput}
                          placeholder="e.g. Engineering or NONE"
                          value={formState.faculty}
                          onChange={event => update("faculty", event.target.value)}
                          required
                        />
                      </div>
                    </div>

                      </>
                    )}

                    <div className={field}>
                      <label className={fieldLabel} htmlFor="join-interests">
                        What events or skills would you like to see?
                        <span className="font-normal normal-case tracking-normal">optional</span>
                      </label>
                      <textarea
                        id="join-interests"
                        className={fieldTextarea}
                        placeholder="Workshops, tools, crafts, software, project ideas…"
                        value={formState.interests_to_gain}
                        onChange={event => update("interests_to_gain", event.target.value)}
                        maxLength={2000}
                      />
                    </div>

                    <div className={field}>
                      <label className={fieldLabel} htmlFor="join-skills">
                        Any mad making skills you&rsquo;d be down to share?
                        <span className="font-normal normal-case tracking-normal">optional</span>
                      </label>
                      <textarea
                        id="join-skills"
                        className={fieldTextarea}
                        placeholder="Soldering, sewing, CAD, cooking, music…"
                        value={formState.skills_to_share}
                        onChange={event => update("skills_to_share", event.target.value)}
                        maxLength={2000}
                      />
                    </div>

                    <div className="absolute left-[-10000px] top-auto w-px h-px overflow-hidden" aria-hidden="true">
                      <label htmlFor="join-company">Company</label>
                      <input
                        id="join-company"
                        tabIndex={-1}
                        autoComplete="off"
                        value={formState.company}
                        onChange={event => update("company", event.target.value)}
                      />
                    </div>

                    <label className="flex items-start gap-3 border-2 border-black rounded-[6px] bg-paper-2 p-3.5 text-[12.5px] font-semibold leading-[1.55] cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-1 accent-black"
                        checked={formState.consent}
                        onChange={event => update("consent", event.target.checked)}
                        required
                      />
                      <span>
                        I consent to Maker Club storing these details for membership administration,
                        subscribing this email to club updates, and, where applicable, using my
                        University details for club administration. <span className={fieldReq}>*</span>
                      </span>
                    </label>

                    <Turnstile
                      onToken={acceptTurnstileToken}
                      resetSignal={turnstileReset}
                    />

                    {submitError && (
                      <p className={`${fieldError} mt-4`} role="alert">
                        <span aria-hidden>⚠</span> {submitError}{" "}
                        {duplicateEmail && (
                          <Link
                            href={`/login?next=/dashboard&email=${encodeURIComponent(formState.email.trim().toLowerCase())}`}
                            className="font-black underline"
                          >
                            Go to sign in
                          </Link>
                        )}
                      </p>
                    )}

                    <div className={formActions}>
                      <span className="text-[11px] font-semibold text-ink-2">
                        One form. Free membership. No payment details.
                      </span>
                      <button className={btnGradient} type="submit" disabled={submitting}>
                        {submitting ? "Registering…" : "Join Maker Club"}
                        {!submitting && <span className={btnArr}>→</span>}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

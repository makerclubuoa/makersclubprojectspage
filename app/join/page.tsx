"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Screentone from "@/app/components/global/Screentone";
import Turnstile from "@/app/components/membership/Turnstile";
import doodle from "@/public/doodle-soldering-iron.png";
import { currentMembershipYear } from "@/lib/membership";
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
  upi: string;
  student_id: string;
  study_years: string;
  faculty: string;
  graduating: "" | "yes" | "no";
  skills_to_share: string;
  consent: boolean;
  company: string;
  uoa_member: "" | "yes" | "no";
};

const TURNSTILE_ENABLED = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

const INITIAL: FormState = {
  full_name: "",
  email: "",
  upi: "",
  student_id: "",
  study_years: "",
  faculty: "",
  graduating: "",
  skills_to_share: "",
  consent: false,
  company: "",
  uoa_member: "",
};

export default function JoinPage() {
  const membershipYear = currentMembershipYear();
  const [formState, setFormState] = useState(INITIAL);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [sent, setSent] = useState(false);
  const [engageQueued, setEngageQueued] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const acceptTurnstileToken = useCallback((token: string) => setTurnstileToken(token), []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFormState(current => ({ ...current, [key]: value }));
    setSubmitError("");
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
          graduating: "",
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
          graduating_this_year:
            formState.graduating === "" ? null : formState.graduating === "yes",
          started_at: startedAt,
          turnstile_token: turnstileToken,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Signup failed.");
      setEngageQueued(data.engage_eligible === true);
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
            Membership is free. Makers of every background and ability are welcome.
          </p>
        </header>

        <main className={submitMain}>
          <div className={container}>
            <div className="grid grid-cols-[0.8fr_1.2fr] gap-12 items-start max-[900px]:grid-cols-1">
              <aside className="bg-white outline-solid outline-3 outline-black shadow-[6px_6px_0px_0px_#000] p-6 md:p-8">
                <h2 className={`${secHead} text-pop-violet mb-4`}>One signup, all sorted</h2>
                <p className="text-sm font-medium leading-[1.7] m-0">
                  This registers your Maker Club membership, subscribes you to club updates,
                  and gives the committee the information needed for annual reporting.
                </p>
                <ul className="mt-5 mb-0 pl-5 text-[13px] font-semibold leading-[1.8]">
                  <li>Free Maker Club membership</li>
                  <li>Event and workshop updates</li>
                  <li>UoA members queued for the official Engage roster</li>
                  <li>No second signup form</li>
                </ul>
                <p className="mt-5 mb-0 text-[11px] text-ink-2 leading-[1.55]">
                  Your UPI and student ID are kept private and are not displayed on the website.
                </p>
              </aside>

              {sent ? (
                <div className="bg-white outline-solid outline-3 outline-black shadow-[6px_6px_0px_0px_#000] p-8">
                  <span className="text-4xl" aria-hidden>★</span>
                  <h2 className={`${secHead} text-pop-pink mt-3 mb-3`}>You&rsquo;re in!</h2>
                  <p className="font-medium leading-[1.7] mb-0">
                    Your Maker Club membership details are registered. Keep an eye on
                    your inbox for club updates{engageQueued ? " and your official Engage invitation" : ""}.
                  </p>
                  <button className={`${btnGradient} mt-6`} onClick={() => setSent(false)}>
                    Register another person <span className={btnArr}>→</span>
                  </button>
                </div>
              ) : (
                <form className={form} onSubmit={submit}>
                  <div className={formInner}>
                    <span className={formFig}>{membershipYear} membership</span>
                    <h2 className={`${secHead} text-pop-blue mb-5 mt-1`}>Your details</h2>

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
                        Use your @aucklanduni.ac.nz address to receive an Engage invitation.
                      </p>
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

                    <div className={field}>
                      <label className={fieldLabel} htmlFor="join-graduating">
                        Are you graduating this year?
                      </label>
                      <select
                        id="join-graduating"
                        className={fieldInput}
                        value={formState.graduating}
                        onChange={event => update("graduating", event.target.value as FormState["graduating"])}
                      >
                        <option value="">Prefer not to say</option>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                      </>
                    )}

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
                        UoA details for the official Engage roster. <span className={fieldReq}>*</span>
                      </span>
                    </label>

                    <Turnstile
                      onToken={acceptTurnstileToken}
                      resetSignal={turnstileReset}
                    />

                    {submitError && (
                      <p className={`${fieldError} mt-4`} role="alert">
                        <span aria-hidden>⚠</span> {submitError}
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

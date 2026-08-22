export const MEMBERSHIP_CONSENT_VERSION = "2026-08-22";

export type EngageStatus = "not_eligible" | "queued" | "invited" | "joined";
export type MembershipSyncStatus = "pending" | "synced" | "failed";

export interface MembershipProfile {
  id: string;
  display_name: string | null;
  membership_year: number | null;
  email: string;
  membership_joined_at: string | null;
  membership_updated_at: string | null;
  membership_consent_version: string | null;
  membership_consented_at: string | null;
  upi: string | null;
  student_id: string | null;
  study_years_remaining: number | null;
  study_years_as_of_year: number | null;
  faculty: string | null;
  graduating_this_year: boolean | null;
  skills_to_share: string | null;
  ghost_member_id: string | null;
  membership_sync_status: MembershipSyncStatus | null;
  membership_sync_error: string | null;
  engage_status: Exclude<EngageStatus, "not_eligible"> | null;
  engage_status_year: number | null;
  engage_invited_at: string | null;
  engage_eligible_until_year: number | null;
}

export type MembershipSignupInput = {
  full_name: string;
  email: string;
  upi: string;
  student_id: string;
  study_years: number | null;
  faculty: string;
  graduating_this_year: boolean | null;
  skills_to_share: string;
  consent: true;
  company?: string;
  started_at?: number;
  turnstile_token?: string;
};

type ValidationResult =
  | { ok: true; value: MembershipSignupInput }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UPI_RE = /^[a-z]{2,5}\d{3}$/i;
const STUDENT_ID_RE = /^\d{7,10}$/;
const NONE_VALUES = new Set(["none", "n/a", "na", "non-uoa", "non uoa"]);

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isNone(value: string): boolean {
  return NONE_VALUES.has(value.toLowerCase());
}

export function isEngageEligible(email: string): boolean {
  return email.toLowerCase().endsWith("@aucklanduni.ac.nz");
}

export function validateMembershipSignup(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Invalid submission." };
  }
  const input = raw as Record<string, unknown>;
  const full_name = clean(input.full_name, 160);
  const email = clean(input.email, 320).toLowerCase();
  const upi = clean(input.upi, 40).toLowerCase();
  const student_id = clean(input.student_id, 40);
  const faculty = clean(input.faculty, 120);
  const skills_to_share = clean(input.skills_to_share, 2000);
  const study_years = input.study_years === null ? null : Number(input.study_years);
  const graduating = input.graduating_this_year;

  if (!full_name) return { ok: false, error: "Enter your full name." };
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (!upi || (!isNone(upi) && !UPI_RE.test(upi))) {
    return {
      ok: false,
      error: "Enter a valid UPI, or NONE if you are not a UoA student.",
    };
  }
  if (!student_id || (!isNone(student_id) && !STUDENT_ID_RE.test(student_id))) {
    return {
      ok: false,
      error: "Enter a valid student ID, or NONE if you are not a UoA student.",
    };
  }
  const nonUoa = isNone(upi) && isNone(student_id);
  if (
    (!nonUoa && (!Number.isInteger(study_years) || study_years == null))
    || (study_years != null && (study_years < 1 || study_years > 20))
  ) {
    return { ok: false, error: "Study duration must be between 1 and 20 years." };
  }
  if (!faculty) return { ok: false, error: "Enter your faculty, or NONE." };
  if (graduating !== null && typeof graduating !== "boolean") {
    return { ok: false, error: "Choose whether you are graduating this year." };
  }
  if (input.consent !== true) {
    return { ok: false, error: "Consent is required to join Maker Club." };
  }

  return {
    ok: true,
    value: {
      full_name,
      email,
      upi: isNone(upi) ? "NONE" : upi,
      student_id: isNone(student_id) ? "NONE" : student_id,
      study_years,
      faculty: isNone(faculty) ? "NONE" : faculty,
      graduating_this_year: graduating as boolean | null,
      skills_to_share,
      consent: true,
      company: clean(input.company, 200),
      started_at: Number(input.started_at) || undefined,
      turnstile_token: clean(input.turnstile_token, 2048) || undefined,
    },
  };
}

export function currentMembershipYear(now = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-NZ", {
      timeZone: "Pacific/Auckland",
      year: "numeric",
    }).format(now),
  );
}

export function membershipYearLabel(year: number): string {
  return `${year} Signup Form`;
}

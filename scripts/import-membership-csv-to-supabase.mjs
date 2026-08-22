/**
 * Enriches Supabase profiles from the annual Google Form export.
 *
 * Dry run (no network writes):
 *   npm run seed:memberships
 *
 * Apply after the membership profile migrations have been run:
 *   npm run seed:memberships -- --apply
 *
 * Optional:
 *   --check --file="scripts/responses.csv" --year=2026 --limit=10
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  try {
    const text = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
      if (match) process.env[match[1].trim()] ??= match[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    // Shell-provided environment variables are also supported.
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const source = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += character;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function findColumn(headers, ...needles) {
  const normalized = headers.map(header => header.trim().toLowerCase());
  return normalized.findIndex(header => needles.some(needle => header.includes(needle)));
}

function value(row, column) {
  return column < 0 ? "" : (row[column] ?? "").trim();
}

function integer(valueToParse, minimum, maximum) {
  const parsed = Number.parseInt(valueToParse, 10);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : null;
}

function formTimestamp(valueToParse) {
  const match = valueToParse.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (!match) return null;
  const [, day, month, year, hour = "0", minute = "0", second = "0"] = match;
  const date = new Date(Date.UTC(+year, +month - 1, +day, +hour - 12, +minute, +second));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function listAuthUsers(supabase) {
  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Could not list Auth users: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < 1000) return users;
  }
}

async function ensureProfile(supabase, candidate, profilesByEmail, usersByEmail) {
  const existingProfile = profilesByEmail.get(candidate.email);
  if (existingProfile) return existingProfile;

  let user = usersByEmail.get(candidate.email);
  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: candidate.email,
      email_confirm: false,
      user_metadata: { display_name: candidate.fullName },
    });
    if (error || !data.user) throw new Error(error?.message ?? "Auth user was not created");
    user = data.user;
    usersByEmail.set(candidate.email, user);
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, email: candidate.email, display_name: candidate.fullName }, { onConflict: "id" })
    .select("id,email,membership_joined_at,membership_email_confirmed_at,ghost_member_id,membership_sync_status,engage_status,engage_status_year,engage_invited_at")
    .single();
  if (error) throw new Error(`Profile creation failed: ${error.message}`);
  profilesByEmail.set(candidate.email, profile);
  return profile;
}

loadEnv();

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const checkOnly = args.includes("--check");
const fileArg = args.find(argument => argument.startsWith("--file="));
const yearArg = args.find(argument => argument.startsWith("--year="));
const limitArg = args.find(argument => argument.startsWith("--limit="));
const membershipYear = integer(yearArg?.slice(7) ?? "2026", 2020, 2100);
const limit = integer(limitArg?.slice(8) ?? "100000", 1, 100000) ?? 100000;
if (!membershipYear) throw new Error("--year must be between 2020 and 2100");

const csvPath = resolve(
  process.cwd(),
  fileArg?.slice(7) ?? "scripts/2026 Maker Club Membership Form (Responses) - Form Responses 1.csv",
);
const table = parseCsv(readFileSync(csvPath, "utf8"));
if (table.length < 2) throw new Error("CSV has no response rows");

const headers = table[0];
const columns = {
  timestamp: findColumn(headers, "timestamp"),
  name: findColumn(headers, "full name", "name"),
  email: findColumn(headers, "email address", "email"),
  upi: findColumn(headers, "upi"),
  studentId: findColumn(headers, "student id"),
  years: findColumn(headers, "how many years", "expect to be studying"),
  faculty: findColumn(headers, "faculty"),
  interests: findColumn(headers, "events you want to see", "skills you want to gain"),
  skills: findColumn(headers, "mad making skills", "down to share", "skills to share"),
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const upiPattern = /^[a-z]{2,5}\d{3}$/i;
const candidatesByEmail = new Map();
const skipped = [];

for (let index = 1; index < table.length; index += 1) {
  const row = table[index];
  if (row.every(cell => !cell.trim())) continue;
  const upiRaw = value(row, columns.upi);
  const explicitEmail = value(row, columns.email).toLowerCase();
  const derivedEmail = upiPattern.test(upiRaw) ? `${upiRaw.toLowerCase()}@aucklanduni.ac.nz` : "";
  const email = explicitEmail || derivedEmail;
  const fullName = value(row, columns.name);
  if (!fullName || !emailPattern.test(email)) {
    skipped.push(`row ${index + 1}: missing name or valid email`);
    continue;
  }

  const nonUoa = !upiPattern.test(upiRaw);
  const studyYears = nonUoa ? null : integer(value(row, columns.years), 1, 20);
  const expectedGraduationYear = studyYears == null ? null : membershipYear + studyYears - 1;
  const submittedAt = formTimestamp(value(row, columns.timestamp));
  const candidate = {
    email,
    fullName,
    upi: nonUoa ? null : upiRaw.toLowerCase(),
    studentId: nonUoa ? null : value(row, columns.studentId) || null,
    studyYears,
    faculty: nonUoa ? null : value(row, columns.faculty) || null,
    expectedGraduationYear,
    interestsToGain: value(row, columns.interests) || null,
    skillsToShare: value(row, columns.skills) || null,
    submittedAt,
  };
  const previous = candidatesByEmail.get(email);
  if (!previous || (candidate.submittedAt ?? "") >= (previous.submittedAt ?? "")) {
    candidatesByEmail.set(email, candidate);
  }
}

const candidates = [...candidatesByEmail.values()].slice(0, limit);
const campusCount = candidates.filter(candidate => candidate.email.endsWith("@aucklanduni.ac.nz")).length;
console.log(`Parsed ${table.length - 1} rows: ${candidatesByEmail.size} unique valid emails, ${skipped.length} skipped.`);
console.log(`${campusCount} campus members; ${candidates.length - campusCount} non-campus members.`);
if (limit < candidatesByEmail.size) console.log(`Limited to the first ${candidates.length} candidates.`);

if (!apply && !checkOnly) {
  console.log("Dry run only. Re-run with --apply after the profile migrations are installed.");
  process.exit(0);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing Supabase URL or service-role key");
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

if (checkOnly) {
  const requiredColumns = [
    "membership_year", "membership_joined_at", "membership_email_confirmed_at", "upi",
    "student_id", "study_years_remaining", "study_years_as_of_year", "faculty",
    "expected_graduation_year", "interests_to_gain", "skills_to_share", "engage_status",
    "engage_status_year", "engage_eligible_until_year",
  ];
  const checks = await Promise.all(requiredColumns.map(async column => {
    const { error } = await supabase.from("profiles").select(`id,${column}`).limit(1);
    return error ? column : null;
  }));
  const missing = checks.filter(Boolean);
  if (missing.length) {
    throw new Error(`Supabase is missing membership columns: ${missing.join(", ")}`);
  }
  console.log("Supabase membership profile schema is ready for import.");
  process.exit(0);
}

const [{ data: profiles, error: profileError }, users] = await Promise.all([
  supabase
    .from("profiles")
    .select("id,email,membership_joined_at,membership_email_confirmed_at,ghost_member_id,membership_sync_status,engage_status,engage_status_year,engage_invited_at")
    .limit(10000),
  listAuthUsers(supabase),
]);
if (profileError) throw new Error(`Could not read profiles: ${profileError.message}`);

const profilesByEmail = new Map((profiles ?? []).filter(profile => profile.email).map(profile => [profile.email.toLowerCase(), profile]));
const usersByEmail = new Map(users.filter(user => user.email).map(user => [user.email.toLowerCase(), user]));
let created = 0;
let updated = 0;
let failed = 0;

for (const candidate of candidates) {
  try {
    const wasExisting = profilesByEmail.has(candidate.email);
    const profile = await ensureProfile(supabase, candidate, profilesByEmail, usersByEmail);
    const eligible = candidate.email.endsWith("@aucklanduni.ac.nz");
    const eligibleUntil = eligible
      ? candidate.expectedGraduationYear ?? (candidate.studyYears == null ? null : membershipYear + candidate.studyYears - 1)
      : null;
    const sameYearStatus = profile.engage_status_year === membershipYear ? profile.engage_status : null;
    const submittedAt = candidate.submittedAt ?? new Date().toISOString();
    const { error } = await supabase
      .from("profiles")
      .update({
        email: candidate.email,
        display_name: candidate.fullName,
        membership_joined_at: profile.membership_joined_at ?? submittedAt,
        membership_updated_at: submittedAt,
        membership_year: membershipYear,
        membership_consent_version: `legacy-google-form-${membershipYear}`,
        membership_consented_at: submittedAt,
        upi: candidate.upi,
        student_id: candidate.studentId,
        study_years_remaining: candidate.studyYears,
        study_years_as_of_year: candidate.studyYears == null ? null : membershipYear,
        faculty: candidate.faculty,
        expected_graduation_year: candidate.expectedGraduationYear,
        interests_to_gain: candidate.interestsToGain,
        skills_to_share: candidate.skillsToShare,
        membership_sync_status: profile.membership_sync_status ?? "pending",
        engage_status: eligible ? (sameYearStatus ?? "queued") : null,
        engage_status_year: eligible ? membershipYear : null,
        engage_invited_at: eligible && sameYearStatus && sameYearStatus !== "queued"
          ? profile.engage_invited_at
          : null,
        engage_eligible_until_year: eligibleUntil,
      })
      .eq("id", profile.id);
    if (error) throw new Error(error.message);
    if (wasExisting) updated += 1;
    else created += 1;
  } catch (error) {
    failed += 1;
    console.error(`Failed ${candidate.email}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

console.log(`Done: ${created} profiles created, ${updated} enriched, ${failed} failed.`);
if (failed) process.exitCode = 1;

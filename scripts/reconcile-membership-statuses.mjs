/**
 * Reconciles existing Supabase profiles with Ghost members.
 *
 * Audit only:
 *   npm run reconcile:memberships
 *
 * Apply Ghost matches:
 *   npm run reconcile:memberships -- --apply
 */

import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

try {
  const text = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (match) process.env[match[1].trim()] ??= match[2].trim().replace(/^["']|["']$/g, "");
  }
} catch {
  // Shell-provided environment variables are also supported.
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ghostUrl = process.env.NEXT_PUBLIC_GHOST_URL?.replace(/\/$/, "");
const ghostAdminKey = process.env.GHOST_ADMIN_API_KEY;
if (!supabaseUrl || !serviceRoleKey || !ghostUrl || !ghostAdminKey) {
  throw new Error("Missing Supabase or Ghost Admin environment variables");
}

const args = process.argv.slice(2);
const apply = args.includes("--apply");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function base64Url(input) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function ghostToken() {
  const [id, secret] = ghostAdminKey.split(":");
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT", kid: id }));
  const payload = base64Url(JSON.stringify({ iat: now, exp: now + 300, aud: "/admin/" }));
  const unsigned = `${header}.${payload}`;
  const signature = createHmac("sha256", Buffer.from(secret, "hex")).update(unsigned).digest();
  return `${unsigned}.${base64Url(signature)}`;
}

async function fetchGhostMembers() {
  // Ghost caps member responses at 100. A stable creation-time order prevents
  // newly added members from shifting records between pages during the audit.
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const byId = new Map();
    let expectedTotal = null;
    for (let page = 1; ; page += 1) {
      const query = new URLSearchParams({
        limit: "100",
        page: String(page),
        order: "created_at asc",
      });
      const response = await fetch(`${ghostUrl}/ghost/api/admin/members/?${query}`, {
        headers: {
          Authorization: `Ghost ${ghostToken()}`,
          "Accept-Version": "v5.0",
        },
      });
      if (!response.ok) throw new Error(`Ghost members ${response.status}: ${await response.text()}`);
      const body = await response.json();
      for (const member of body.members ?? []) byId.set(member.id, member);
      const pagination = body.meta?.pagination;
      expectedTotal = pagination?.total ?? expectedTotal;
      if (!pagination || page >= pagination.pages) break;
    }
    if (expectedTotal == null || byId.size === expectedTotal) return [...byId.values()];
    if (attempt === 3) {
      throw new Error(`Ghost member list changed during audit (${byId.size}/${expectedTotal}); retry later`);
    }
  }
  return [];
}

async function fetchProfiles() {
  const profiles = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,display_name,membership_year,membership_email_confirmed_at,membership_sync_status,ghost_member_id")
      .order("id")
      .range(offset, offset + 999);
    if (error) throw new Error(`Profiles: ${error.message}`);
    profiles.push(...(data ?? []));
    if ((data?.length ?? 0) < 1000) return profiles;
  }
}

function chunks(values, size = 100) {
  const result = [];
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size));
  return result;
}

function countBy(values, read) {
  const counts = {};
  for (const value of values) {
    const key = read(value) ?? "unset";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function normalizedName(value) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function likelyNameCandidates(profileName, members) {
  const profileTokens = normalizedName(profileName).split(" ").filter(Boolean);
  if (!profileTokens.length) return [];
  const profileFirst = profileTokens[0];
  const profileLast = profileTokens.at(-1);
  return members
    .map(member => {
      const memberTokens = normalizedName(member.name).split(" ").filter(Boolean);
      const shared = profileTokens.filter(token => memberTokens.includes(token)).length;
      const sameFirst = profileFirst === memberTokens[0];
      const sameLast = profileTokens.length > 1 && profileLast === memberTokens.at(-1);
      return { member, score: shared * 2 + (sameFirst ? 1 : 0) + (sameLast ? 3 : 0) };
    })
    .filter(candidate => candidate.score >= (profileTokens.length === 1 ? 3 : 2))
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map(candidate => candidate.member);
}

const [profiles, ghostMembers] = await Promise.all([fetchProfiles(), fetchGhostMembers()]);
const ghostByEmail = new Map(ghostMembers
  .filter(member => member.email)
  .map(member => [member.email.trim().toLowerCase(), member]));
const matched = profiles.filter(profile => profile.email && ghostByEmail.has(profile.email.trim().toLowerCase()));
const unmatched = profiles.filter(profile => !profile.email || !ghostByEmail.has(profile.email.trim().toLowerCase()));
const ghostByName = new Map();
const ghostByEmailLocalPart = new Map();
for (const member of ghostMembers) {
  const name = normalizedName(member.name);
  if (name) {
    const matches = ghostByName.get(name) ?? [];
    matches.push(member);
    ghostByName.set(name, matches);
  }
  const localPart = member.email?.trim().toLowerCase().split("@")[0];
  if (localPart) {
    const matches = ghostByEmailLocalPart.get(localPart) ?? [];
    matches.push(member);
    ghostByEmailLocalPart.set(localPart, matches);
  }
}

console.log(`Supabase profiles: ${profiles.length}`);
console.log(`Ghost members: ${ghostMembers.length}`);
console.log(`Matched by normalized email: ${matched.length}`);
console.log(`Profiles not found in Ghost: ${unmatched.length}`);
console.log("Current Ghost sync statuses:", countBy(profiles, profile => profile.membership_sync_status));
console.log(`Profiles with membership data awaiting confirmation: ${profiles.filter(profile => profile.membership_year && !profile.membership_email_confirmed_at).length}`);
if (unmatched.length) {
  console.log("Profiles not matched by email:");
  for (const profile of unmatched) {
    const localPart = profile.email?.trim().toLowerCase().split("@")[0];
    const localPartCandidates = localPart ? ghostByEmailLocalPart.get(localPart) ?? [] : [];
    const exactCandidates = ghostByName.get(normalizedName(profile.display_name)) ?? [];
    const candidates = localPartCandidates.length
      ? localPartCandidates
      : exactCandidates.length
      ? exactCandidates
      : likelyNameCandidates(profile.display_name, ghostMembers);
    const candidateText = candidates.length
      ? `; possible Ghost candidate(s): ${candidates.map(member => `${member.name ?? "(no name)"} <${member.email}>`).join(", ")}`
      : "";
    console.log(`  - [${profile.membership_sync_status ?? "unset"}] ${profile.display_name ?? "(no name)"} <${profile.email ?? "no email"}>${candidateText}`);
  }
}

if (!apply) {
  console.log("Audit only; no records changed. Add --apply to reconcile matched profiles.");
  process.exit(0);
}
const matchedIds = matched.map(profile => profile.id);
for (const ids of chunks(matchedIds)) {
  const { error } = await supabase
    .from("profiles")
    .update({ membership_sync_status: "synced", membership_sync_error: null })
    .in("id", ids);
  if (error) throw new Error(`Ghost status update: ${error.message}`);
}

// These profiles predate the new confirmation-gated signup flow and already
// exist in Ghost. Grandfather only the profiles present during this one-time
// reconciliation; future registrations remain pending until their magic link.
const confirmationTime = new Date().toISOString();
const unconfirmedMatchedIds = matched
  .filter(profile => profile.membership_year && !profile.membership_email_confirmed_at)
  .map(profile => profile.id);
for (const ids of chunks(unconfirmedMatchedIds)) {
  const { error } = await supabase
    .from("profiles")
    .update({ membership_email_confirmed_at: confirmationTime })
    .in("id", ids)
    .is("membership_email_confirmed_at", null);
  if (error) throw new Error(`Legacy confirmation update: ${error.message}`);
}

console.log(`Updated ${matchedIds.length} Ghost sync statuses.`);
console.log(`Left ${unmatched.length} profiles unchanged because Ghost had no matching email.`);
console.log(`Grandfathered ${unconfirmedMatchedIds.length} existing membership confirmations.`);

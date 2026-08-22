"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  currentMembershipYear,
  isEngageEligible,
  type EngageStatus,
  type MembershipProfile,
} from "@/lib/membership";
import {
  btnGhost,
  btnGradient,
  dashStatus,
  emptyState,
  fieldInput,
  secHead,
} from "@/lib/ui";

type Snapshot = { profiles: MembershipProfile[] };
type StatusFilter = "all" | EngageStatus | "sync_failed";

const SMALL_BTN =
  "inline-flex items-center justify-center rounded-full border-2 border-black bg-white px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.06em] shadow-[2px_2px_0px_0px_#000] disabled:opacity-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";

function effectiveEngageStatus(profile: MembershipProfile, year: number): EngageStatus {
  if (
    !isEngageEligible(profile.email)
    || (profile.engage_eligible_until_year != null && profile.engage_eligible_until_year < year)
  ) return "not_eligible";
  if (profile.engage_status_year !== year) return "queued";
  return profile.engage_status ?? "queued";
}

function csvCell(value: unknown): string {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index];
    if (quoted) {
      if (character === '"' && normalized[index + 1] === '"') {
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

function csvColumn(headers: string[], ...needles: string[]): number {
  const normalized = headers.map(header => header.trim().toLowerCase());
  return normalized.findIndex(header => needles.some(needle => header.includes(needle)));
}

export default function MembershipAdminPanel() {
  const membershipYear = currentMembershipYear();
  const [snapshot, setSnapshot] = useState<Snapshot>({ profiles: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastCopiedIds, setLastCopiedIds] = useState<string[]>([]);

  const authFetch = useCallback(async (init?: RequestInit) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Admin session expired.");
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${session.access_token}`);
    if (init?.body) headers.set("Content-Type", "application/json");
    return fetch("/api/admin/memberships", { ...init, headers });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authFetch();
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Membership data could not be loaded.");
      setSnapshot(data as Snapshot);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Membership data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return snapshot.profiles.filter(profile => {
      const status = effectiveEngageStatus(profile, membershipYear);
      if (statusFilter === "sync_failed" && profile.membership_sync_status !== "failed") return false;
      if (statusFilter !== "all" && statusFilter !== "sync_failed" && status !== statusFilter) return false;
      return !query || [profile.display_name ?? "", profile.email, profile.upi ?? "", profile.faculty ?? ""]
        .some(value => value.toLowerCase().includes(query));
    });
  }, [membershipYear, search, snapshot.profiles, statusFilter]);
  const counts = useMemo(() => ({
    all: snapshot.profiles.length,
    queued: snapshot.profiles.filter(profile => effectiveEngageStatus(profile, membershipYear) === "queued").length,
    invited: snapshot.profiles.filter(profile => effectiveEngageStatus(profile, membershipYear) === "invited").length,
    joined: snapshot.profiles.filter(profile => effectiveEngageStatus(profile, membershipYear) === "joined").length,
    not_eligible: snapshot.profiles.filter(profile => effectiveEngageStatus(profile, membershipYear) === "not_eligible").length,
    sync_failed: snapshot.profiles.filter(profile => profile.membership_sync_status === "failed").length,
  }), [membershipYear, snapshot.profiles]);

  async function action(body: Record<string, unknown>, success: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await authFetch({ method: "POST", body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Action failed.");
      setNotice(success);
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function importGoogleFormCsv(file: File) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const table = parseCsv(await file.text());
      if (table.length < 2) throw new Error("The CSV has no response rows.");
      const headers = table[0];
      const nameColumn = csvColumn(headers, "full name", "name");
      const emailColumn = csvColumn(headers, "email address", "email");
      const upiColumn = csvColumn(headers, "upi");
      const studentIdColumn = csvColumn(headers, "student id");
      const yearsColumn = csvColumn(headers, "how many years", "expect to be studying", "study years");
      const facultyColumn = csvColumn(headers, "faculty");
      const graduatingColumn = csvColumn(headers, "graduate", "graduating");
      const skillsColumn = csvColumn(headers, "mad making skills", "down to share", "skills to share");
      if (nameColumn < 0 || (emailColumn < 0 && upiColumn < 0)) {
        throw new Error("Could not find the name and email/UPI columns in this CSV.");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Admin session expired.");
      let imported = 0;
      const failures: string[] = [];
      for (let index = 1; index < table.length; index += 1) {
        const row = table[index];
        if (row.every(cell => !cell.trim())) continue;
        const upi = (upiColumn >= 0 ? row[upiColumn] : "")?.trim() || "NONE";
        const explicitEmail = (emailColumn >= 0 ? row[emailColumn] : "")?.trim().toLowerCase();
        const derivedEmail = /^[a-z]{2,5}\d{3}$/i.test(upi)
          ? `${upi.toLowerCase()}@aucklanduni.ac.nz`
          : "";
        const email = explicitEmail || derivedEmail;
        const fullName = row[nameColumn]?.trim();
        if (!email || !fullName) {
          failures.push(`Row ${index + 1}: missing name or usable email`);
          continue;
        }
        const yearsRaw = yearsColumn >= 0 ? Number.parseInt(row[yearsColumn] || "", 10) : Number.NaN;
        const graduatingRaw = graduatingColumn >= 0 ? row[graduatingColumn]?.trim().toLowerCase() : "";
        const response = await fetch("/api/membership/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            membership_year: membershipYear,
            full_name: fullName,
            email,
            upi,
            student_id: (studentIdColumn >= 0 ? row[studentIdColumn] : "")?.trim() || "NONE",
            study_years: Number.isInteger(yearsRaw) && yearsRaw > 0 ? Math.min(yearsRaw, 20) : null,
            faculty: (facultyColumn >= 0 ? row[facultyColumn] : "")?.trim() || "NONE",
            graduating_this_year: graduatingRaw ? graduatingRaw.startsWith("y") : null,
            skills_to_share: (skillsColumn >= 0 ? row[skillsColumn] : "")?.trim() || "",
            consent: true,
          }),
        });
        const result = await response.json();
        if (response.ok) imported += 1;
        else failures.push(`Row ${index + 1} (${email}): ${result.error ?? "failed"}`);
      }
      setNotice(
        `${imported} response${imported === 1 ? "" : "s"} imported`
          + (failures.length ? `; ${failures.length} skipped or failed.` : "."),
      );
      if (failures.length) setError(failures.slice(0, 8).join(" · "));
      await load();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "CSV import failed.");
    } finally {
      setBusy(false);
    }
  }

  async function copyQueued() {
    const queued = snapshot.profiles
      .filter(profile => effectiveEngageStatus(profile, membershipYear) === "queued")
      .slice(0, 500);
    if (!queued.length) {
      setNotice(`There are no queued Engage invitations for ${membershipYear}.`);
      return;
    }
    await navigator.clipboard.writeText(queued.map(profile => profile.email).join("\n"));
    const ids = queued.map(profile => profile.id);
    setSelectedIds(ids);
    setLastCopiedIds(ids);
    setNotice(`${ids.length} campus email${ids.length === 1 ? "" : "s"} copied for Engage.`);
  }

  async function markStatus(
    status: "queued" | "invited" | "joined",
    profileIds = selectedIds,
  ) {
    if (!profileIds.length) return;
    await action(
      { action: "set_engage_status", profile_ids: profileIds, year: membershipYear, status },
      `${profileIds.length} member${profileIds.length === 1 ? "" : "s"} marked ${status}.`,
    );
    setSelectedIds([]);
    if (status !== "queued") setLastCopiedIds([]);
  }

  function exportCsv() {
    const headers = [
      "Full Name", "Email", "UPI", "Student ID", "Expected Years Remaining", "Known Through Year",
      "Faculty", "Graduating This Year", "Skills To Share", "Last Signup Year", "Account Sync",
      `${membershipYear} Engage Status`, "Joined At", "Updated At",
    ];
    const rows = visible.map(profile => [
      profile.display_name ?? "",
      profile.email,
      profile.upi ?? "",
      profile.student_id ?? "",
      profile.study_years_remaining ?? "",
      profile.engage_eligible_until_year ?? "Unlimited / unknown",
      profile.faculty ?? "",
      profile.graduating_this_year == null ? "" : profile.graduating_this_year ? "Yes" : "No",
      profile.skills_to_share ?? "",
      profile.membership_year ?? "Existing member",
      profile.membership_sync_status ?? "Existing member",
      effectiveEngageStatus(profile, membershipYear).replaceAll("_", " "),
      profile.membership_joined_at ?? "",
      profile.membership_updated_at ?? "",
    ]);
    const csv = [headers, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `maker-club-members-${membershipYear}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className={emptyState}>Loading members…</div>;

  return (
    <div className="flex flex-col gap-7">
      {(error || notice) && (
        <div className={`border-2 border-black bg-white rounded-[6px] px-4 py-3 font-bold text-sm shadow-[3px_3px_0px_0px_#000] ${error ? "text-pop-red" : "text-ink"}`}>
          {error || notice}
        </div>
      )}

      <section className="bg-white outline-solid outline-3 outline-black shadow-[6px_6px_0px_0px_#000] p-5 md:p-7">
        <h2 className={`${secHead} text-pop-violet mb-1`}>{membershipYear} Engage queue</h2>
        <p className="m-0 text-xs font-semibold text-ink-2">
          Campus-email profiles queue automatically each January until their known final study year.
          Existing profiles with no known end year stay eligible indefinitely. Profiles are never deleted.
        </p>
      </section>

      <section>
        <div className="flex justify-between gap-4 items-end flex-wrap mb-4">
          <div>
            <h2 className={`${secHead} text-white mb-1`}>Members</h2>
            <p className="m-0 text-xs font-semibold">
              Ghost owns newsletter membership; this view contains the latest private signup details.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <label className={`${btnGhost} cursor-pointer ${busy ? "opacity-50 pointer-events-none" : ""}`}>
              Import Google Form CSV
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                disabled={busy}
                onChange={event => {
                  const file = event.target.files?.[0];
                  if (file) void importGoogleFormCsv(file);
                  event.target.value = "";
                }}
              />
            </label>
            <button className={btnGhost} onClick={() => void copyQueued()}>Copy queued emails</button>
            {lastCopiedIds.length > 0 && (
              <button className={btnGradient} disabled={busy} onClick={() => void markStatus("invited", lastCopiedIds)}>
                Mark copied invited
              </button>
            )}
            <button className={btnGhost} onClick={exportCsv}>Export CSV</button>
          </div>
        </div>

        <input
          className={`${fieldInput} mb-3`}
          placeholder="Search name, email, UPI, or faculty…"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
        <div className="flex gap-2 mb-4 flex-wrap">
          {(["all", "queued", "invited", "joined", "not_eligible", "sync_failed"] as StatusFilter[]).map(status => (
            <button
              key={status}
              className={`${SMALL_BTN} ${statusFilter === status ? "bg-black text-white" : ""}`}
              onClick={() => setStatusFilter(status)}
            >
              {status.replaceAll("_", " ")} ({counts[status]})
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className={emptyState}>No members match this view.</div>
        ) : (
          <div className="bg-white outline-solid outline-3 outline-black shadow-[6px_6px_0px_0px_#000] overflow-x-auto">
            <table className="w-full min-w-[1060px] border-collapse text-left text-xs">
              <thead className="bg-paper-2 border-b-2 border-black">
                <tr>
                  <th className="p-3 w-10"><span className="sr-only">Select</span></th>
                  {["Member", "UPI / ID", "Faculty", "Study", "Account", "Engage", "Last signup"].map(label => (
                    <th key={label} className="p-3 text-[10px] uppercase tracking-[0.08em]">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map(profile => {
                  const engageStatus = effectiveEngageStatus(profile, membershipYear);
                  const selected = selectedIds.includes(profile.id);
                  return (
                    <tr key={profile.id} className="border-b border-black/10 last:border-0 align-top">
                      <td className="p-3">
                        {engageStatus !== "not_eligible" && (
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={event => setSelectedIds(current => event.target.checked
                              ? [...new Set([...current, profile.id])]
                              : current.filter(id => id !== profile.id))}
                            aria-label={`Select ${profile.display_name ?? profile.email}`}
                          />
                        )}
                      </td>
                      <td className="p-3">
                        <strong className="block text-sm">{profile.display_name ?? "Member"}</strong>
                        <span className="text-ink-2">{profile.email}</span>
                      </td>
                      <td className="p-3 font-semibold">
                        {profile.upi ?? "—"}<br /><span className="text-ink-2">{profile.student_id ?? "—"}</span>
                      </td>
                      <td className="p-3 font-semibold">{profile.faculty ?? "—"}</td>
                      <td className="p-3">
                        {profile.study_years_remaining == null
                          ? "Unknown"
                          : `${profile.study_years_remaining} yr${profile.study_years_remaining === 1 ? "" : "s"} left`}
                        <br />
                        <span className="text-ink-2">
                          Eligible through: {engageStatus === "not_eligible"
                            ? "not applicable"
                            : profile.engage_eligible_until_year ?? "no known end"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`${dashStatus} ${profile.membership_sync_status === "synced" ? "bg-pop-blue text-white" : profile.membership_sync_status === "failed" ? "bg-pop-red text-white" : "bg-paper-2"}`}>
                          {profile.membership_sync_status ?? "existing"}
                        </span>
                        {profile.membership_sync_status === "failed" && (
                          <button
                            className="block mt-2 text-[10px] font-bold uppercase underline text-pop-red"
                            disabled={busy}
                            onClick={() => void action(
                              { action: "retry_member_sync", profile_id: profile.id },
                              `${profile.display_name ?? profile.email}'s Ghost membership synced.`,
                            )}
                          >
                            Retry
                          </button>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`${dashStatus} ${engageStatus === "queued" ? "bg-paper-2" : engageStatus === "not_eligible" ? "bg-paper-3" : "bg-pop-violet text-white"}`}>
                          {engageStatus.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="p-3 text-ink-2 whitespace-nowrap">
                        {profile.membership_year ?? "Before tracking"}<br />
                        {profile.membership_updated_at
                          ? new Date(profile.membership_updated_at).toLocaleDateString("en-NZ")
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {selectedIds.length > 0 && (
              <div className="sticky left-0 flex items-center gap-2 flex-wrap border-t-2 border-black bg-paper-2 p-3">
                <strong className="text-xs mr-auto">{selectedIds.length} selected</strong>
                <button className={SMALL_BTN} disabled={busy} onClick={() => void markStatus("queued")}>Mark queued</button>
                <button className={SMALL_BTN} disabled={busy} onClick={() => void markStatus("invited")}>Mark invited</button>
                <button className={SMALL_BTN} disabled={busy} onClick={() => void markStatus("joined")}>Mark joined</button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

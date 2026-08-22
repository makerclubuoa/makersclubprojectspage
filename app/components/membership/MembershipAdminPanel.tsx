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
type SortKey = "member" | "identity" | "faculty" | "study" | "account" | "engage" | "last_signup";
type SortDirection = "asc" | "desc";

const SORT_COLUMNS: { key: SortKey; label: string }[] = [
  { key: "member", label: "Member" },
  { key: "identity", label: "UPI / ID" },
  { key: "faculty", label: "Faculty" },
  { key: "study", label: "Study" },
  { key: "account", label: "Account" },
  { key: "engage", label: "Engage" },
  { key: "last_signup", label: "Last signup" },
];

const SMALL_BTN =
  "inline-flex items-center justify-center rounded-full border-2 border-black px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.06em] shadow-[2px_2px_0px_0px_#000] transition-colors disabled:opacity-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";

function effectiveEngageStatus(profile: MembershipProfile, year: number): EngageStatus {
  if (profile.membership_year != null && !profile.membership_email_confirmed_at) {
    return "pending_confirmation";
  }
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

function sortValue(
  profile: MembershipProfile,
  key: SortKey,
  membershipYear: number,
): string | number | null {
  if (key === "member") return (profile.display_name || profile.email).toLowerCase();
  if (key === "identity") return (profile.upi || profile.student_id)?.toLowerCase() ?? null;
  if (key === "faculty") return profile.faculty?.toLowerCase() ?? null;
  if (key === "study") return profile.expected_graduation_year ?? profile.study_years_remaining;
  if (key === "account") return profile.membership_sync_status ?? "existing";
  if (key === "engage") return effectiveEngageStatus(profile, membershipYear);
  return profile.membership_updated_at ? Date.parse(profile.membership_updated_at) : null;
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortKey, setSortKey] = useState<SortKey>("last_signup");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
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
    const filtered = snapshot.profiles.filter(profile => {
      const status = effectiveEngageStatus(profile, membershipYear);
      if (statusFilter === "sync_failed" && profile.membership_sync_status !== "failed") return false;
      if (statusFilter !== "all" && statusFilter !== "sync_failed" && status !== statusFilter) return false;
      return !query || [profile.display_name ?? "", profile.email, profile.upi ?? "", profile.faculty ?? ""]
        .some(value => value.toLowerCase().includes(query));
    });
    return [...filtered].sort((leftProfile, rightProfile) => {
      const left = sortValue(leftProfile, sortKey, membershipYear);
      const right = sortValue(rightProfile, sortKey, membershipYear);
      if (left == null && right == null) return 0;
      if (left == null) return 1;
      if (right == null) return -1;
      const comparison = typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left).localeCompare(String(right), "en-NZ", { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [membershipYear, search, snapshot.profiles, sortDirection, sortKey, statusFilter]);
  const counts = useMemo(() => ({
    all: snapshot.profiles.length,
    pending_confirmation: snapshot.profiles.filter(profile => effectiveEngageStatus(profile, membershipYear) === "pending_confirmation").length,
    queued: snapshot.profiles.filter(profile => effectiveEngageStatus(profile, membershipYear) === "queued").length,
    invited: snapshot.profiles.filter(profile => effectiveEngageStatus(profile, membershipYear) === "invited").length,
    joined: snapshot.profiles.filter(profile => effectiveEngageStatus(profile, membershipYear) === "joined").length,
    not_eligible: snapshot.profiles.filter(profile => effectiveEngageStatus(profile, membershipYear) === "not_eligible").length,
    sync_failed: snapshot.profiles.filter(profile => profile.membership_sync_status === "failed").length,
  }), [membershipYear, snapshot.profiles]);
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const paginatedProfiles = visible.slice(pageStart, pageStart + pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize, sortDirection, sortKey]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

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

  function changeSort(nextKey: SortKey) {
    if (nextKey === sortKey) {
      setSortDirection(current => current === "asc" ? "desc" : "asc");
      return;
    }
    setSortKey(nextKey);
    setSortDirection(nextKey === "last_signup" ? "desc" : "asc");
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
      "Faculty", "Expected Graduation Year", "Events / Skills Wanted",
      "Skills To Share", "Last Signup Year", "Account Sync",
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
      profile.expected_graduation_year ?? "",
      profile.interests_to_gain ?? "",
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
          {(["all", "pending_confirmation", "queued", "invited", "joined", "not_eligible", "sync_failed"] as StatusFilter[]).map(status => (
            <button
              key={status}
              className={`${SMALL_BTN} ${statusFilter === status
                ? "bg-pop-violet text-white"
                : "bg-white text-ink hover:bg-paper-2"}`}
              onClick={() => setStatusFilter(status)}
            >
              {status.replaceAll("_", " ")} ({counts[status]})
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className={emptyState}>No members match this view.</div>
        ) : (
          <div className="bg-white outline-solid outline-3 outline-black shadow-[6px_6px_0px_0px_#000]">
            <div className="flex items-center justify-between gap-3 flex-wrap border-b-2 border-black bg-paper-2 px-3 py-2.5">
              <p className="m-0 text-xs font-bold">
                Showing {pageStart + 1}–{Math.min(pageStart + pageSize, visible.length)} of {visible.length}
              </p>
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.07em]">
                Rows per page
                <select
                  className="rounded-[5px] border-2 border-black bg-white px-2 py-1 text-xs font-bold text-ink"
                  value={pageSize}
                  onChange={event => setPageSize(Number(event.target.value))}
                >
                  {[25, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full min-w-[1060px] border-collapse text-left text-xs">
              <thead className="bg-paper-2 border-b-2 border-black">
                <tr>
                  <th className="p-3 w-10"><span className="sr-only">Select</span></th>
                  {SORT_COLUMNS.map(column => (
                    <th
                      key={column.key}
                      className="p-0 text-[10px] uppercase tracking-[0.08em]"
                      aria-sort={sortKey === column.key
                        ? sortDirection === "asc" ? "ascending" : "descending"
                        : "none"}
                    >
                      <button
                        type="button"
                        className="flex w-full items-center gap-1.5 p-3 text-left font-bold hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-pop-violet"
                        onClick={() => changeSort(column.key)}
                      >
                        {column.label}
                        <span className={sortKey === column.key ? "text-pop-violet" : "text-ink-2/60"} aria-hidden>
                          {sortKey === column.key ? sortDirection === "asc" ? "↑" : "↓" : "↕"}
                        </span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedProfiles.map(profile => {
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
                        {profile.expected_graduation_year != null && (
                          <><br /><span className="text-ink-2">Graduates: {profile.expected_graduation_year}</span></>
                        )}
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
            </div>
            {selectedIds.length > 0 && (
              <div className="sticky left-0 flex items-center gap-2 flex-wrap border-t-2 border-black bg-paper-2 p-3">
                <strong className="text-xs mr-auto">{selectedIds.length} selected</strong>
                <button className={SMALL_BTN} disabled={busy} onClick={() => void markStatus("queued")}>Mark queued</button>
                <button className={SMALL_BTN} disabled={busy} onClick={() => void markStatus("invited")}>Mark invited</button>
                <button className={SMALL_BTN} disabled={busy} onClick={() => void markStatus("joined")}>Mark joined</button>
              </div>
            )}
            <div className="flex items-center justify-center gap-3 border-t-2 border-black bg-paper-2 p-3">
              <button
                className={`${SMALL_BTN} bg-white text-ink disabled:shadow-none`}
                disabled={currentPage === 1}
                onClick={() => setPage(current => Math.max(1, current - 1))}
              >
                Previous
              </button>
              <span className="min-w-24 text-center text-xs font-bold">
                Page {currentPage} of {pageCount}
              </span>
              <button
                className={`${SMALL_BTN} bg-white text-ink disabled:shadow-none`}
                disabled={currentPage === pageCount}
                onClick={() => setPage(current => Math.min(pageCount, current + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

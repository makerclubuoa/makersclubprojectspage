"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Screentone from "@/app/components/global/Screentone";
import AccessibleModal from "@/app/components/AccessibleModal";
import penNib from "@/public/doodle-pen-nib.png";
import Pagination from "@/app/components/Pagination";
import { useAuth } from "@/app/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { resolvePublicName, type Project } from "@/lib/projects";
import { currentStudyYearsRemaining } from "@/lib/membership";
import {
  container,
  holt,
  pageWrap,
  pageBand,
  pageBandTitle,
  pageBandSub,
  pageBandDoodle,
  submitMain,
  modalLabel,
  modalTitle,
  modalWarn,
  modalActions,
  btn,
  btnGradient,
  btnArr,
  form,
  formInner,
  formFig,
  formActions,
  formActionsSmall,
  field,
  fieldLabel,
  fieldInput,
  emptyState,
  emptyStateMono,
  dashTable,
  dashRow,
  dashRowMain,
  dashRowTitle,
  dashRowMeta,
  dashStatus,
  dashStatusLive,
  dashStatusDraft,
  dashStatusRejected,
  dashStatusLiked,
  dashRowEdit,
  dashRowDelete,
} from "@/lib/ui";

export const dynamic = "force-dynamic";

function statusLabel(status: string | null, featured: boolean | null) {
  const s = status?.toUpperCase();
  if (!status)
    return { text: featured ? "Live · Featured" : "Live", cls: dashStatusLive };
  if (s === "DRAFT") return { text: "Pending review", cls: dashStatusDraft };
  if (s === "REJECTED") return { text: "Rejected", cls: dashStatusRejected };
  return { text: status, cls: "border-rule" };
}

export default function DashboardPage() {
  const { user, session, profile, loading } = useAuth();
  const router = useRouter();

  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [likedProjects, setLikedProjects] = useState<Project[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [unlikingId, setUnlikingId] = useState<string | null>(null);
  const [myPage, setMyPage] = useState(1);
  const [likedPage, setLikedPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Profile settings
  const [publicName, setPublicName] = useState("");
  const [namePreference, setNamePreference] = useState<"name" | "public_name">(
    "name",
  );
  const [creditConsented, setCreditConsented] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [studyYears, setStudyYears] = useState("");
  const [expectedGraduationYear, setExpectedGraduationYear] = useState<number | null>(null);
  const [studySaving, setStudySaving] = useState(false);
  const [studySaved, setStudySaved] = useState(false);
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(true);
  const [newsletterSaving, setNewsletterSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountConfirmation, setDeleteAccountConfirmation] = useState("");
  const [accountDeleting, setAccountDeleting] = useState(false);
  const [pendingPreference, setPendingPreference] = useState<
    "name" | "public_name" | null
  >(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setPageSize(mq.matches ? 5 : 12);
    const handler = (e: MediaQueryListEvent) => setPageSize(e.matches ? 5 : 12);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    setMyPage(1);
    setLikedPage(1);
  }, [pageSize]);

  useEffect(() => {
    if (!profile) return;
    setPublicName(profile.public_name ?? "");
    setNamePreference(
      (profile.name_preference as "name" | "public_name") ?? "name",
    );
    setCreditConsented(profile.credit_consented ?? false);
    const currentYears = currentStudyYearsRemaining(profile);
    setStudyYears(currentYears == null ? "none" : String(currentYears));
    setExpectedGraduationYear(profile.expected_graduation_year);
  }, [profile]);

  useEffect(() => {
    if (!session) return;
    setNewsletterLoading(true);
    fetch("/api/profile/newsletter", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Newsletter preference could not be loaded.");
        setNewsletterSubscribed(data.subscribed === true);
      })
      .catch(error => setDashboardError(
        error instanceof Error ? error.message : "Newsletter preference could not be loaded.",
      ))
      .finally(() => setNewsletterLoading(false));
  }, [session]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/dashboard");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      setDataLoading(true);
      setDashboardError(null);
      const [legacyResult, memberResult, likesResult] = await Promise.all([
          supabase
            .from("Projects")
            .select("*")
            .eq("submitted_by", user!.id)
            .is("maker_ids", null)
            .order("date", { ascending: false }),
          supabase
            .from("Projects")
            .select("*")
            .contains("maker_ids", [user!.id])
            .order("date", { ascending: false }),
          supabase
            .from("user_likes")
            .select("project_id")
            .eq("user_id", user!.id),
      ]);
      const loadError = legacyResult.error ?? memberResult.error ?? likesResult.error;
      if (loadError) {
        setDashboardError(`Dashboard could not be loaded: ${loadError.message}`);
        setDataLoading(false);
        return;
      }
      const legacy = legacyResult.data;
      const memberOf = memberResult.data;
      const likeRows = likesResult.data;

      setMyProjects([...new Map(
        [...(legacy ?? []), ...(memberOf ?? [])].map((project: Project) => [project.id, project]),
      ).values()]);

      if (likeRows && likeRows.length > 0) {
        const ids = likeRows.map((r: { project_id: string }) => r.project_id);
        const { data: liked, error: likedError } = await supabase
          .from("Projects")
          .select("*")
          .in("id", ids);
        if (likedError) setDashboardError(`Liked projects could not be loaded: ${likedError.message}`);
        else setLikedProjects((liked ?? []) as Project[]);
      } else {
        setLikedProjects([]);
      }

      setDataLoading(false);
    }
    load();
  }, [user]);

  function requestNamePreference(pref: "name" | "public_name") {
    if (pref === namePreference) return;
    setPendingPreference(pref);
    setShowNameModal(true);
  }

  function confirmNamePreference() {
    if (pendingPreference) setNamePreference(pendingPreference);
    setPendingPreference(null);
    setShowNameModal(false);
  }

  async function saveProfile() {
    if (!user) return;
    setUsernameError(null);
    setDashboardError(null);
    const trimmed = publicName.trim();
    if (trimmed) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("public_name", trimmed)
        .neq("id", user.id)
        .maybeSingle();
      if (existing) {
        setUsernameError("That username is already taken.");
        return;
      }
    }
    setProfileSaving(true);
    setProfileSaved(false);
    const { error } = await supabase
      .from("profiles")
      .update({
        public_name: trimmed || null,
        name_preference: namePreference,
        credit_consented: creditConsented,
      })
      .eq("id", user.id);
    setProfileSaving(false);
    if (error) {
      setDashboardError(`Profile was not saved: ${error.message}`);
      return;
    }
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  }

  async function updateNewsletterSubscription(subscribed: boolean) {
    if (!session || newsletterSaving) return;
    const previous = newsletterSubscribed;
    setNewsletterSubscribed(subscribed);
    setNewsletterSaving(true);
    setDashboardError(null);
    try {
      const response = await fetch("/api/profile/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ subscribed }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Newsletter preference could not be saved.");
      setNewsletterSubscribed(data.subscribed === true);
    } catch (error) {
      setNewsletterSubscribed(previous);
      setDashboardError(
        error instanceof Error ? error.message : "Newsletter preference could not be saved.",
      );
    } finally {
      setNewsletterSaving(false);
    }
  }

  async function saveStudyDetails() {
    if (!session || studySaving) return;
    setStudySaving(true);
    setStudySaved(false);
    setDashboardError(null);
    try {
      const study_years_remaining = studyYears === "none" ? null : Number(studyYears);
      const response = await fetch("/api/profile/study", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ study_years_remaining }),
      });
      const data = await response.json() as { expected_graduation_year?: number | null; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Study details could not be saved.");
      setExpectedGraduationYear(data.expected_graduation_year ?? null);
      setStudySaved(true);
      setTimeout(() => setStudySaved(false), 3000);
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : "Study details could not be saved.");
    } finally {
      setStudySaving(false);
    }
  }

  async function handleDelete(id: string) {
    const p = myProjects.find((p) => p.id === id);
    if (!p) return;
    if (!confirm(`Remove “${p.title}” for every maker? This cannot be undone.`)) return;
    setDeletingId(id);
    setDashboardError(null);
    const { data: { session } } = await supabase.auth.getSession();
    const response = session
      ? await fetch(`/api/projects/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.access_token}` } })
      : null;
    if (response?.ok) {
      setMyProjects((prev) => prev.filter((p) => p.id !== id));
      setMyPage(1);
    }
    else setDashboardError("The project could not be removed. Please try again.");
    setDeletingId(null);
  }

  function closeDeleteAccountModal() {
    if (accountDeleting) return;
    setShowDeleteAccountModal(false);
    setDeleteAccountConfirmation("");
  }

  async function deleteAccount() {
    if (!session || deleteAccountConfirmation !== "DELETE" || accountDeleting) return;
    setAccountDeleting(true);
    setDashboardError(null);
    try {
      const response = await fetch("/api/profile/account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ confirmation: deleteAccountConfirmation }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Account deletion failed.");
      await supabase.auth.signOut({ scope: "local" });
      window.location.assign("/join?account=deleted");
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : "Account deletion failed.");
      setAccountDeleting(false);
      setShowDeleteAccountModal(false);
    }
  }

  async function handleUnlike(projectId: string) {
    setUnlikingId(projectId);
    setDashboardError(null);
    const { error } = await supabase.rpc("toggle_like", { p_project_id: projectId });
    if (error) setDashboardError(`Could not unlike project: ${error.message}`);
    else {
      setLikedProjects((prev) => prev.filter((p) => p.id !== projectId));
      setLikedPage(1);
    }
    setUnlikingId(null);
  }

  if (loading || !user) return null;

  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "";

  return (
    <div className={pageWrap}>
      <div className="pt-20">

      <header className={pageBand}>
        <Screentone />
        <Image src={penNib} alt="" className={`${pageBandDoodle} -rotate-6 -bottom-4`} />
        <h1 className={`${pageBandTitle} text-pop-violet`}>
          Hey, {displayName}!
        </h1>
        <p className={pageBandSub}>Your submissions and liked projects.</p>
      </header>

      {/* Name preference modal */}
      {showNameModal && (
        <AccessibleModal onClose={() => setShowNameModal(false)} labelledBy="name-preference-title">
            <p className={modalLabel}>Confirm change</p>
            <p className={modalTitle} id="name-preference-title">
              Switch to showing your{" "}
              <em className="not-italic text-ink-2">
                {pendingPreference === "public_name" ? "username" : "real name"}
              </em>
              ?
            </p>
            <p className="text-[13px] text-ink-2 m-0 mb-1">
              Project detail pages will show you as{" "}
              <strong>
                {pendingPreference === "public_name"
                  ? publicName.trim() || profile?.display_name
                  : profile?.display_name}
              </strong>{" "}
              going forward.
            </p>
            <p className={modalWarn}>
              Remember to hit Save after closing this.
            </p>
            <div className={modalActions}>
              <button className={btn} onClick={() => setShowNameModal(false)}>
                Cancel
              </button>
              <button className={btnGradient} onClick={confirmNamePreference}>
                Confirm
              </button>
            </div>
        </AccessibleModal>
      )}

      {showDeleteAccountModal && (
        <AccessibleModal onClose={closeDeleteAccountModal} labelledBy="delete-account-title">
          <p className={modalLabel}>Permanent account deletion</p>
          <p className={modalTitle} id="delete-account-title">
            Delete your Maker Club account?
          </p>
          <div className="space-y-3 text-[13px] leading-relaxed text-ink-2">
            <p className="m-0">
              This removes your login, profile, Ghost membership, comments, likes and private
              membership details. Projects made only by you and their uploaded files will also
              be permanently deleted.
            </p>
            <p className={`${modalWarn} m-0`}>
              Shared projects will not be deleted. Ownership will move to a remaining co-maker.
            </p>
          </div>
          <label className={`${fieldLabel} mt-5`} htmlFor="delete-account-confirmation">
            Type DELETE to confirm
          </label>
          <input
            id="delete-account-confirmation"
            className={fieldInput}
            type="text"
            autoComplete="off"
            value={deleteAccountConfirmation}
            onChange={event => setDeleteAccountConfirmation(event.target.value)}
            disabled={accountDeleting}
          />
          <div className={modalActions}>
            <button className={btn} onClick={closeDeleteAccountModal} disabled={accountDeleting}>
              Keep my account
            </button>
            <button
              className="inline-flex items-center justify-center rounded-full border-2 border-black bg-pop-red px-5 py-2 text-xs font-bold text-white shadow-[2px_2px_0px_0px_#000] disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => void deleteAccount()}
              disabled={deleteAccountConfirmation !== "DELETE" || accountDeleting}
            >
              {accountDeleting ? "Deleting…" : "Delete account permanently"}
            </button>
          </div>
        </AccessibleModal>
      )}

      <main className={submitMain}>
        <div className={container}>
          {dashboardError && (
            <div className="mb-5 border-2 border-black bg-white px-4 py-3 text-xs font-bold text-pop-red shadow-[2px_2px_0px_0px_#000]" role="alert">
              {dashboardError}
            </div>
          )}
          {/* Profile settings */}
          <h2 className={`${holt} text-3xl md:text-4xl text-white mt-0 mb-6`}>
            Profile
          </h2>

          <div className={`${form} mb-14`}>
            <div className={formInner}>
              <span className={formFig}>Profile settings</span>

              <div className={field}>
                <label className={fieldLabel} htmlFor="profile-legal-name">
                  Legal name
                  <span className="font-normal normal-case tracking-normal text-muted">
                    read-only
                  </span>
                </label>
                <input
                  id="profile-legal-name"
                  className={`${fieldInput} opacity-50`}
                  type="text"
                  value={profile?.display_name ?? ""}
                  disabled
                />
              </div>

              <div className={field}>
                <label className={fieldLabel} htmlFor="profile-public-name">
                  Public username
                  <span className="font-normal normal-case tracking-normal">
                    optional, alias shown instead of your name
                  </span>
                </label>
                <input
                  id="profile-public-name"
                  className={fieldInput}
                  type="text"
                  placeholder="e.g. maker_ib, tinkerer42, or leave blank"
                  value={publicName}
                  aria-invalid={!!usernameError}
                  aria-describedby={usernameError ? "profile-public-name-error" : undefined}
                  onChange={(e) => {
                    setPublicName(e.target.value);
                    setUsernameError(null);
                    if (
                      namePreference === "public_name" &&
                      !e.target.value.trim()
                    )
                      setNamePreference("name");
                  }}
                />
                {usernameError && (
                  <span id="profile-public-name-error" className="text-[11px] font-semibold text-pop-red mt-1" role="alert">
                    {usernameError}
                  </span>
                )}
              </div>

              <fieldset className={`${field} border-0 p-0 m-0 mb-4`}>
                <legend className={fieldLabel}>Show me as</legend>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <button
                    type="button"
                    className={`px-3.5 py-1 rounded-full border-2 border-black text-xs font-semibold tracking-[0.06em] cursor-pointer ${namePreference === "name" ? "bg-black text-white shadow-[2px_2px_0px_0px_#000]" : "bg-white text-ink hover:bg-paper-2"}`}
                    onClick={() => requestNamePreference("name")}
                    aria-pressed={namePreference === "name"}
                  >
                    My name ·{" "}
                    <em className="not-italic opacity-70">
                      {profile?.display_name}
                    </em>
                  </button>
                  <button
                    type="button"
                    className={`px-3.5 py-1 rounded-full border-2 border-black text-xs font-semibold tracking-[0.06em] ${namePreference === "public_name" ? "bg-black text-white shadow-[2px_2px_0px_0px_#000]" : "bg-white text-ink"} ${publicName.trim() ? "cursor-pointer opacity-100 hover:bg-paper-2" : "cursor-not-allowed opacity-40"}`}
                    onClick={() =>
                      publicName.trim() && requestNamePreference("public_name")
                    }
                    aria-pressed={namePreference === "public_name"}
                    disabled={!publicName.trim()}
                  >
                    My username ·{" "}
                    <em className="not-italic opacity-70">
                      {publicName.trim() || "—"}
                    </em>
                  </button>
                </div>
                {!publicName.trim() && (
                  <span className="text-[11px] font-medium text-ink-2 mt-1.5">
                    Set a username above to enable this option.
                  </span>
                )}
              </fieldset>

              <div className={`${field} mb-0`}>
                <label className="flex flex-col gap-1.5 normal-case tracking-normal text-[13px] text-ink">
                  <span className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={creditConsented}
                      onChange={(e) => setCreditConsented(e.target.checked)}
                      className="w-auto m-0 accent-pop-magenta"
                    />
                    <span className="font-semibold">Show my name on projects</span>
                  </span>
                  <span className="text-[11px] font-medium text-ink-2 pl-6">
                    Controls whether your{" "}
                    {namePreference === "public_name" && publicName.trim()
                      ? "username"
                      : "name"}{" "}
                    appears publicly on projects you submit or are added to as a
                    co-maker. Leave unchecked to stay anonymous.
                  </span>
                </label>
              </div>

              <div className={`${field} mt-4 mb-0`}>
                <label className="flex flex-col gap-1.5 normal-case tracking-normal text-[13px] text-ink">
                  <span className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={newsletterSubscribed}
                      disabled={newsletterLoading || newsletterSaving}
                      onChange={event => void updateNewsletterSubscription(event.target.checked)}
                      className="w-auto m-0 accent-pop-magenta"
                    />
                    <span className="font-semibold">
                      {newsletterLoading ? "Loading email preference…" : "Email me Maker Club updates"}
                    </span>
                  </span>
                  <span className="text-[11px] font-medium text-ink-2 pl-6">
                    This changes your Ghost newsletter subscription. Unsubscribing keeps your
                    Maker Club profile, projects and membership.
                  </span>
                </label>
              </div>

              {profile?.membership_year && (
                <div className={`${field} mt-6 mb-0 border-t-2 border-black/15 pt-5`}>
                  <label className={fieldLabel} htmlFor="profile-study-years">
                    Years left in university
                  </label>
                  <select
                    id="profile-study-years"
                    className={fieldInput}
                    value={studyYears}
                    onChange={event => setStudyYears(event.target.value)}
                  >
                    <option value="none">Not currently studying at UoA</option>
                    <option value="0">Finished / graduated</option>
                    {Array.from({ length: 20 }, (_, index) => index + 1).map(year => (
                      <option key={year} value={year}>{year} {year === 1 ? "year" : "years"}</option>
                    ))}
                  </select>
                  <span className="text-[11px] font-medium text-ink-2 mt-1.5">
                    {expectedGraduationYear == null
                      ? "This is stored as not currently studying."
                      : `Expected graduation: ${expectedGraduationYear}.`}
                  </span>
                  <button
                    type="button"
                    className={`${btnGradient} mt-3`}
                    onClick={() => void saveStudyDetails()}
                    disabled={studySaving}
                  >
                    {studySaving ? "Savingâ€¦" : studySaved ? "âœ“ Saved" : "Save study details"}
                    <span className={btnArr}>â†’</span>
                  </button>
                </div>
              )}

              <div className={formActions}>
                <span className={formActionsSmall}>
                  Currently showing as:{" "}
                  <strong>
                    {resolvePublicName({
                      display_name: profile?.display_name,
                      public_name: profile?.public_name,
                      name_preference: profile?.name_preference,
                    })}
                  </strong>
                </span>
                <button
                  type="button"
                  className={btnGradient}
                  onClick={saveProfile}
                  disabled={profileSaving}
                >
                  {profileSaving
                    ? "Saving…"
                    : profileSaved
                      ? "✓ Saved"
                      : "Save profile"}{" "}
                  <span className={btnArr}>→</span>
                </button>
              </div>

              <div className="mt-7 border-t-2 border-black/15 pt-5">
                <div className="flex items-center justify-between gap-4 max-sm:items-start max-sm:flex-col">
                  <div>
                    <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-pop-red">
                      Delete account
                    </p>
                    <p className="mt-1 mb-0 max-w-xl text-[11px] font-medium leading-relaxed text-ink-2">
                      Permanently remove your profile and personal data. Shared projects are kept
                      and transferred to another co-maker.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-full border-2 border-black bg-white px-4 py-1.5 text-xs font-bold text-pop-red shadow-[2px_2px_0px_0px_#000] hover:bg-pop-red hover:text-white"
                    onClick={() => setShowDeleteAccountModal(true)}
                  >
                    Delete account
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* My Projects */}
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <h2 className={`${holt} text-3xl md:text-4xl text-white m-0`}>
              My Projects
            </h2>
            <Link
              href="/submit"
              className="inline-flex items-center gap-1.5 rounded-full font-semibold border-2 border-black bg-accent text-white shadow-[2px_2px_0px_0px_#000] hover:opacity-90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none px-4 py-1 text-xs transition-[transform,box-shadow,opacity] duration-100"
            >
              + New
            </Link>
          </div>

          {dataLoading ? (
            <div className={emptyState}>
              <span className={emptyStateMono}>Loading…</span>
            </div>
          ) : myProjects.length === 0 ? (
            <div className={emptyState}>
              <div className={emptyStateMono}>No submissions yet</div>
              <p className="mt-2">
                <Link href="/submit" className="underline">
                  Submit your first project →
                </Link>
              </p>
            </div>
          ) : (
            (() => {
              const myTotalPages = Math.ceil(myProjects.length / pageSize);
              const myPaginated = myProjects.slice(
                (myPage - 1) * pageSize,
                myPage * pageSize,
              );
              return (
                <>
                  <div className={dashTable}>
                    {myPaginated.map((p) => {
                      const { text, cls } = statusLabel(p.status, p.Featured);
                      return (
                        <div key={p.id} className={dashRow}>
                          <div className={dashRowMain}>
                            <Link
                              href={p.status === "APPROVED" ? `/projects/${p.id}` : `/projects/${p.id}/edit`}
                              className={dashRowTitle}
                            >
                              {p.title}
                            </Link>
                            <span className={dashRowMeta}>
                              {p.category}
                              {p.date && (
                                <>
                                  {" "}
                                  ·{" "}
                                  {new Date(p.date).toLocaleDateString(
                                    "en-NZ",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )}
                                </>
                              )}
                            </span>
                          </div>
                          <span className={`${dashStatus} ${cls}`}>{text}</span>
                          <Link
                            href={`/projects/${p.id}/edit`}
                            className={dashRowEdit}
                          >
                            Edit
                          </Link>
                          <button
                            className={dashRowDelete}
                            onClick={() => handleDelete(p.id)}
                            disabled={deletingId === p.id}
                            title="Remove project for everyone"
                          >
                            {deletingId === p.id ? "…" : "✕ Remove"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <Pagination
                    page={myPage}
                    totalPages={myTotalPages}
                    onChange={setMyPage}
                  />
                </>
              );
            })()
          )}

          {/* Liked Projects */}
          <h2 className={`${holt} text-3xl md:text-4xl text-white mt-16 mb-6`}>
            Liked
          </h2>

          {dataLoading ? (
            <div className={emptyState}>
              <span className={emptyStateMono}>Loading…</span>
            </div>
          ) : likedProjects.length === 0 ? (
            <div className={emptyState}>
              <div className={emptyStateMono}>Nothing liked yet</div>
              <p className="mt-2">
                <Link href="/projects" className="underline">
                  Browse projects →
                </Link>
              </p>
            </div>
          ) : (
            (() => {
              const likedTotalPages = Math.ceil(
                likedProjects.length / pageSize,
              );
              const likedPaginated = likedProjects.slice(
                (likedPage - 1) * pageSize,
                likedPage * pageSize,
              );
              return (
                <>
                  <div className={`${dashTable} mb-4`}>
                    {likedPaginated.map((p) => (
                      <div key={p.id} className={dashRow}>
                        <div className={dashRowMain}>
                          <Link
                            href={`/projects/${p.id}`}
                            className={dashRowTitle}
                          >
                            {p.title}
                          </Link>
                          <span className={dashRowMeta}>
                            {p.category}
                            {p.makers && p.makers.length > 0 && (
                              <> · {p.makers.join(", ")}</>
                            )}
                          </span>
                        </div>
                        <span className={`${dashStatus} ${dashStatusLiked}`}>
                          ♥ {p.likes ?? 0}
                        </span>
                        <button
                          className={dashRowDelete}
                          onClick={() => handleUnlike(p.id)}
                          disabled={unlikingId === p.id}
                          title="Unlike"
                        >
                          {unlikingId === p.id ? "…" : "♡ Unlike"}
                        </button>
                      </div>
                    ))}
                  </div>
                  <Pagination
                    page={likedPage}
                    totalPages={likedTotalPages}
                    onChange={setLikedPage}
                  />
                </>
              );
            })()
          )}
        </div>
      </main>
      </div>
    </div>
  );
}

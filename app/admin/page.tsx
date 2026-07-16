"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Screentone from "@/app/components/global/Screentone";
import pliers from "@/public/doodle-pliers.png";
import { useAuth } from "@/app/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import type { Project } from "@/lib/projects";
import Pagination from "@/app/components/Pagination";
import {
  container,
  pageWrap,
  pageBand,
  pageBandTitle,
  pageBandSub,
  pageBandDoodle,
  fieldInput,
  submitMain,
  emptyState,
  emptyStateMono,
  dashTable,
  dashRow,
  dashRowMain,
  dashRowTitle,
  dashRowMeta,
  dashStatus,
  dashStatusDraft,
  dashStatusRejected,
  dashStatusLive,
  dashRowEdit,
  dashRowDelete,
  modalBackdrop,
  modal,
  modalLabel,
  modalTitle,
  modalWarn,
  modalActions,
  btnGhost,
  btnGradient,
  btnDanger,
} from "@/lib/ui";

const ADMIN_EMAIL = "makerclubuoa@gmail.com";

// Small comic pill used for the status filters.
const FILTER_BTN =
  "inline-flex items-center gap-2 rounded-full font-semibold border-2 border-black px-3.5 py-1 text-[11px] uppercase tracking-[0.04em] transition-[background-color,color,box-shadow,transform] duration-150 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";
const FILTER_BTN_ON = "bg-accent text-white shadow-[2px_2px_0px_0px_#000]";
const FILTER_BTN_OFF = "bg-white text-ink hover:bg-paper-2";
// Row action link (like a dash-row edit link but with a pinned colour, no hover shift).
const DASH_ACTION =
  "text-[10.5px] font-bold tracking-[0.08em] uppercase shrink-0 px-2 py-1 transition-colors duration-150";

type Filter = "all" | "pending" | "live" | "featured" | "rejected";

function statusLabel(status: string | null, featured: boolean | null) {
  if (status === "DRAFT") return { text: "Pending", cls: dashStatusDraft };
  if (status === "REJECTED")
    return { text: "Rejected", cls: dashStatusRejected };
  if (status === "APPROVED")
    return { text: featured ? "Live · Featured" : "Live", cls: dashStatusLive };
  return { text: status ?? "—", cls: "border-rule" };
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [actingId, setActingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState<{
    id: string;
    title: string;
    label: string;
    action: () => Promise<void>;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setPageSize(mq.matches ? 5 : 12);
    const handler = (e: MediaQueryListEvent) => setPageSize(e.matches ? 5 : 12);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.email !== ADMIN_EMAIL) {
      router.replace("/");
      return;
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return;
    async function load() {
      setDataLoading(true);
      const { data } = await supabase
        .from("Projects")
        .select("*")
        .order("date", { ascending: false });
      setProjects((data ?? []) as Project[]);
      setDataLoading(false);
    }
    load();
  }, [user]);

  function sendNotify(
    projectId: string,
    change: "approved" | "rejected" | "featured",
  ) {
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "status-change", projectId, change }),
    });
  }

  async function adminUpdate(id: string, payload: Record<string, unknown>) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const res = await fetch("/api/admin/update-project", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token ?? ""}`,
      },
      body: JSON.stringify({ id, ...payload }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? "Unknown error");
    }
  }

  async function toggleFeatured(id: string, featured: boolean) {
    setActingId(id);
    setActionError(null);
    try {
      await adminUpdate(id, { Featured: featured });
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, Featured: featured } : p)),
      );
      if (featured) sendNotify(id, "featured");
    } catch (e) {
      setActionError((e as Error).message);
    }
    setActingId(null);
  }

  async function setStatus(
    id: string,
    status: string,
    change?: "approved" | "rejected",
  ) {
    setActingId(id);
    setActionError(null);
    try {
      await adminUpdate(id, { status });
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status } : p)),
      );
      if (change) sendNotify(id, change);
    } catch (e) {
      setActionError((e as Error).message);
    }
    setActingId(null);
  }

  async function handleDelete(id: string, title: string) {
    setActingId(id);
    setActionError(null);
    try {
      await adminUpdate(id, { _delete: true });
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setActionError((e as Error).message);
    }
    setActingId(null);
  }

  async function confirmPending() {
    if (!pending) return;
    setPending(null);
    await pending.action();
  }

  if (loading || !user) return null;

  const isLive = (p: Project) => p.status === "APPROVED";

  const counts: Record<Filter, number> = {
    all: projects.length,
    pending: projects.filter((p) => p.status === "DRAFT").length,
    live: projects.filter(isLive).length,
    featured: projects.filter((p) => p.Featured === true).length,
    rejected: projects.filter((p) => p.status === "REJECTED").length,
  };

  const filtered =
    filter === "all"
      ? projects
      : filter === "pending"
        ? projects.filter((p) => p.status === "DRAFT")
        : filter === "live"
          ? projects.filter(isLive)
          : filter === "featured"
            ? projects.filter((p) => p.Featured === true)
            : projects.filter((p) => p.status === "REJECTED");

  const q = search.trim().toLowerCase();
  const visible = q
    ? filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.makers ?? []).some((m) => m.toLowerCase().includes(q)),
      )
    : filtered;

  const totalPages = Math.ceil(visible.length / pageSize);
  const paginated = visible.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className={pageWrap}>
      <div className="pt-20">

      <header className={pageBand}>
        <Screentone />
        <Image src={pliers} alt="" className={pageBandDoodle} />
        <p className={`${pageBandTitle} text-pop-red`}>Admin</p>
        <p className={pageBandSub}>
          Approve, feature, reject, or delete any project.
        </p>
      </header>

      <main className={submitMain}>
        <div className={container}>
          {actionError && (
            <div className="mb-4 px-3.5 py-2.5 bg-white border-2 border-black rounded-[6px] shadow-[2px_2px_0px_0px_#000] text-pop-red text-xs font-bold tracking-[0.04em]">
              Error: {actionError}
            </div>
          )}

          <input
            type="text"
            placeholder="Search by project or maker name…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={`${fieldInput} mb-4 shadow-[2px_2px_0px_0px_#000]`}
          />

          <div className="flex gap-2 mb-8 flex-wrap">
            {(
              ["all", "pending", "live", "featured", "rejected"] as Filter[]
            ).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setPage(1);
                }}
                className={`${FILTER_BTN} ${filter === f ? FILTER_BTN_ON : FILTER_BTN_OFF}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
              </button>
            ))}
          </div>

          {dataLoading ? (
            <div className={emptyState}>
              <span className={emptyStateMono}>Loading…</span>
            </div>
          ) : visible.length === 0 ? (
            <div className={emptyState}>
              <span className={emptyStateMono}>Nothing here</span>
            </div>
          ) : (
            <>
              <div className={dashTable}>
                {paginated.map((p) => {
                  const live = isLive(p);
                  const featured = p.Featured === true;
                  const isRejected = p.status === "REJECTED";
                  const isDraftOrRejected = p.status === "DRAFT" || isRejected;
                  const { text, cls } = statusLabel(p.status, p.Featured);
                  const busy = actingId === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`${dashRow} flex-wrap gap-x-0 gap-y-1.5`}
                    >
                      <div className={dashRowMain}>
                        <Link
                          href={`/projects/${p.id}`}
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
                              {new Date(p.date).toLocaleDateString("en-NZ", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </>
                          )}
                          {p.makers && p.makers.length > 0 && (
                            <> · {p.makers.join(", ")}</>
                          )}
                        </span>
                      </div>

                      <span className={`${dashStatus} ${cls}`}>{text}</span>

                      <Link
                        href={`/projects/${p.id}/edit?from=admin`}
                        className={dashRowEdit}
                      >
                        Edit
                      </Link>

                      {isDraftOrRejected && (
                        <button
                          className={`${DASH_ACTION} text-pop-blue`}
                          onClick={() =>
                            setPending({
                              id: p.id,
                              title: p.title,
                              label: "Approve",
                              action: () =>
                                setStatus(p.id, "APPROVED", "approved"),
                            })
                          }
                          disabled={busy}
                        >
                          {busy ? "…" : "✓ Approve"}
                        </button>
                      )}

                      {live && !featured && (
                        <button
                          className={`${DASH_ACTION} text-pop-violet`}
                          onClick={() =>
                            setPending({
                              id: p.id,
                              title: p.title,
                              label: "Feature",
                              action: () => toggleFeatured(p.id, true),
                            })
                          }
                          disabled={busy}
                        >
                          {busy ? "…" : "★ Feature"}
                        </button>
                      )}

                      {live && featured && (
                        <button
                          className={`${DASH_ACTION} text-pop-blue`}
                          onClick={() =>
                            setPending({
                              id: p.id,
                              title: p.title,
                              label: "Un-feature",
                              action: () => toggleFeatured(p.id, false),
                            })
                          }
                          disabled={busy}
                        >
                          {busy ? "…" : "★ Un-feature"}
                        </button>
                      )}

                      {!isRejected && (
                        <button
                          className={dashRowDelete}
                          onClick={() =>
                            setPending({
                              id: p.id,
                              title: p.title,
                              label: "Reject",
                              action: () =>
                                setStatus(p.id, "REJECTED", "rejected"),
                            })
                          }
                          disabled={busy}
                        >
                          {busy ? "…" : "✕ Reject"}
                        </button>
                      )}

                      <button
                        className={dashRowDelete}
                        onClick={() =>
                          setPending({
                            id: p.id,
                            title: p.title,
                            label: "Delete",
                            action: () => handleDelete(p.id, p.title),
                          })
                        }
                        disabled={busy}
                      >
                        {busy ? "…" : "Delete"}
                      </button>
                    </div>
                  );
                })}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={setPage}
              />
            </>
          )}
        </div>
      </main>

      {pending && (
        <div className={modalBackdrop} onClick={() => setPending(null)}>
          <div className={modal} onClick={(e) => e.stopPropagation()}>
            <p className={modalLabel}>Confirm action</p>
            <p className={modalTitle}>
              {pending.label}{" "}
              <em className="not-italic text-pop-violet">"{pending.title}"</em>?
            </p>
            {pending.label === "Delete" && (
              <p className={modalWarn}>This cannot be undone.</p>
            )}
            <div className={modalActions}>
              <button className={btnGhost} onClick={() => setPending(null)}>
                Cancel
              </button>
              <button
                className={
                  pending.label === "Delete" || pending.label === "Reject"
                    ? btnDanger
                    : btnGradient
                }
                onClick={confirmPending}
              >
                {pending.label}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

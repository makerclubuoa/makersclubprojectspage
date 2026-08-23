"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import AccessibleModal from "@/app/components/AccessibleModal";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/components/AuthProvider";
import {
  secHead,
  secHeadRow,
  secHint,
  modalLabel,
  modalTitle,
  modalActions,
  btnGhost,
  btnGradient,
} from "@/lib/ui";

interface Comment {
  id: string;
  user_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

interface Props {
  projectId: string;
  projectOwnerId: string | null;
  projectMakerIds?: string[] | null;
}

const ADMIN_EMAIL = "makerclubuoa@gmail.com";
const META_BTN =
  "text-[11px] font-semibold text-ink-2 p-0 cursor-pointer tracking-[.04em] hover:text-pop-red";
const CONFIRM = "text-[11px] font-semibold text-ink-2 tracking-[.02em]";
const CONFIRM_BTN =
  "p-0 text-[11px] font-bold text-pop-red underline cursor-pointer";

function fmtCommentDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CommentsSection({
  projectId,
  projectOwnerId,
  projectMakerIds,
}: Props) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [reported, setReported] = useState<Set<string>>(new Set());
  const [confirmReport, setConfirmReport] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch(`/api/comments?project_id=${projectId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.comments) setComments(d.comments);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setShowSignIn(true);
      return;
    }
    if (!body.trim()) return;
    setSubmitting(true);
    setSubmitError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      setSubmitting(false);
      setShowSignIn(true);
      return;
    }

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ project_id: projectId, body: body.trim() }),
    });
    const data = await res.json();
    if (res.ok && data.comment) {
      setComments((prev) => [...prev, data.comment]);
      setBody("");
    } else {
      setSubmitError(data.error ?? "Failed to post comment");
    }
    setSubmitting(false);
  }

  async function handleDelete(commentId: string) {
    if (confirmDelete !== commentId) {
      setConfirmDelete(commentId);
      return;
    }
    setConfirmDelete(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    const res = await fetch(`/api/comments/${commentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setComments((prev) => prev.filter((c) => c.id !== commentId));
    else setModerationError("Could not delete that comment. Please try again.");
  }

  async function handleReport(comment: Comment) {
    if (!user) {
      setShowSignIn(true);
      return;
    }
    if (confirmReport !== comment.id) {
      setConfirmReport(comment.id);
      return;
    }
    setConfirmReport(null);
    setModerationError(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setShowSignIn(true);
      return;
    }
    const response = await fetch("/api/comments/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ comment_id: comment.id }),
    });
    if (response.ok) setReported((prev) => new Set(prev).add(comment.id));
    else setModerationError("Could not send that report. Please try again.");
  }

  return (
    <section
      className="relative bg-white outline-solid outline-3 outline-black shadow-[6px_6px_0px_0px_#000] p-6 md:p-8 mb-10"
      id="comments"
    >
      <div className={`${secHeadRow} mb-5`}>
        <h3 className={`${secHead} text-white`}>Comments</h3>
        <span className={secHint}>
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </span>
      </div>

      <div className="flex flex-col gap-0">
        {moderationError && (
          <p className="text-pop-red text-xs font-semibold" role="alert">{moderationError}</p>
        )}
        {loading && (
          <p className="text-muted text-[13px] m-0 mb-6">Loading...</p>
        )}

        {!loading && comments.length === 0 && (
          <p className="text-muted text-[13px] m-0 mb-6">
            No comments yet. Be the first!
          </p>
        )}

        {comments.map((c) => {
          const canDelete =
            !!user &&
            (c.user_id === user.id ||
              ((projectMakerIds?.length
                ? projectMakerIds
                : projectOwnerId ? [projectOwnerId] : []).includes(user.id)) ||
              user.email === ADMIN_EMAIL);
          return (
            <div
              key={c.id}
              className="border-t-2 border-black/10 py-4 last-of-type:border-b-2 last-of-type:border-black/10 last-of-type:mb-7"
            >
              <div className="flex items-baseline gap-2.5 mb-1.5">
                <span className="text-xs font-bold tracking-[.04em] text-ink">
                  {c.author_name}
                </span>
                <span className="text-[11px] font-medium text-ink-2">
                  {fmtCommentDate(c.created_at)}
                </span>
                <span className="flex-1" />
                {canDelete &&
                  (confirmDelete === c.id ? (
                    <span className={CONFIRM}>
                      Delete?{" "}
                      <button
                        className={CONFIRM_BTN}
                        onClick={() => handleDelete(c.id)}
                      >
                        Yes
                      </button>
                      {" / "}
                      <button
                        className={CONFIRM_BTN}
                        onClick={() => setConfirmDelete(null)}
                      >
                        No
                      </button>
                    </span>
                  ) : (
                    <button
                      className={META_BTN}
                      onClick={() => handleDelete(c.id)}
                    >
                      Delete
                    </button>
                  ))}
                {reported.has(c.id) ? (
                  <span className="text-[11px] text-muted tracking-[.04em]">
                    Reported
                  </span>
                ) : confirmReport === c.id ? (
                  <span className={CONFIRM}>
                    Flag?{" "}
                    <button
                      className={CONFIRM_BTN}
                      onClick={() => handleReport(c)}
                    >
                      Yes
                    </button>
                    {" / "}
                    <button
                      className={CONFIRM_BTN}
                      onClick={() => setConfirmReport(null)}
                    >
                      No
                    </button>
                  </span>
                ) : (
                  <button className={META_BTN} onClick={() => handleReport(c)}>
                    Report
                  </button>
                )}
              </div>
              <p className="text-sm font-medium leading-[1.6] text-ink-2 m-0 whitespace-pre-wrap break-words">
                {c.body}
              </p>
            </div>
          );
        })}

        <form className="mt-2" onSubmit={handleSubmit}>
          <label htmlFor="project-comment-body" className="sr-only">
            Comment
          </label>
          <textarea
            id="project-comment-body"
            ref={textareaRef}
            className="w-full bg-white border-2 border-black rounded-[6px] text-ink text-[14px] max-[640px]:text-base leading-[1.5] px-3.5 py-3 resize-y min-h-[80px] outline-none transition-shadow duration-150 focus:shadow-[2px_2px_0px_0px_#000] read-only:cursor-pointer read-only:opacity-70 placeholder:text-muted"
            placeholder={
              user ? "Leave a comment…" : "Sign in to leave a comment"
            }
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={1000}
            rows={3}
            onClick={() => {
              if (!user) setShowSignIn(true);
            }}
            readOnly={!user}
          />
          <div className="flex items-center gap-3 mt-2">
            {submitError && (
              <span className="text-xs text-pop-red">{submitError}</span>
            )}
            <span style={{ flex: 1 }} />
            <span className="text-[11px] font-semibold text-ink-2">
              {body.length}/1000
            </span>
            {user ? (
              <button
                type="submit"
                className={btnGradient}
                disabled={submitting || !body.trim()}
              >
                {submitting ? "Posting…" : "Post comment"}
              </button>
            ) : (
              <button
                type="button"
                className={btnGradient}
                onClick={() => setShowSignIn(true)}
              >
                Sign in to comment
              </button>
            )}
          </div>
        </form>
      </div>

      {showSignIn && (
        <AccessibleModal onClose={() => setShowSignIn(false)} labelledBy="comment-sign-in-title">
            <p className={modalLabel}>Sign in required</p>
            <p className={modalTitle} id="comment-sign-in-title">
              You need an account to leave a comment.
            </p>
            <div className={modalActions}>
              <button className={btnGhost} onClick={() => setShowSignIn(false)}>
                Cancel
              </button>
              <Link href={`/login?next=${encodeURIComponent(`/projects/${projectId}`)}`} className={btnGradient}>
                Sign in →
              </Link>
            </div>
        </AccessibleModal>
      )}
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  fieldInput,
  fieldTextarea,
  fieldLabel,
  field,
  dashTable,
  dashRow,
  dashRowMain,
  dashRowTitle,
  dashRowMeta,
  dashRowDelete,
  emptyState,
  emptyStateMono,
  btnGradient,
  btnGhost,
  modalBackdrop,
  modal,
  modalLabel,
  modalTitle,
  modalWarn,
  modalActions,
  btnDanger,
  form,
  formInner,
  secHead,
  secHeadRow,
} from "@/lib/ui";

interface TimelineItem {
  id: string;
  name: string;
  date: string;
  description: string;
  created_at: string;
}

export default function TimelineAdminPanel() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState<TimelineItem | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function authHeader() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token ?? ""}` };
  }

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/timeline");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/timeline", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await authHeader()),
      },
      body: JSON.stringify({ name, date, description }),
    });
    if (res.ok) {
      const newItem = await res.json();
      setItems((prev) => [...prev, newItem]);
      setName("");
      setDate("");
      setDescription("");
    } else {
      const body = await res.json();
      setError(body.error ?? "Failed to add item");
    }
    setSaving(false);
  }

  async function handleDelete(item: TimelineItem) {
    setDeleting(item.id);
    setError(null);
    const res = await fetch("/api/admin/timeline", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(await authHeader()),
      },
      body: JSON.stringify({ id: item.id }),
    });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } else {
      const body = await res.json();
      setError(body.error ?? "Failed to delete item");
    }
    setPending(null);
    setDeleting(null);
  }

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <div className="px-3.5 py-2.5 bg-white border-2 border-black rounded-[6px] shadow-[2px_2px_0px_0px_#000] text-pop-red text-xs font-bold tracking-[0.04em]">
          Error: {error}
        </div>
      )}

      <div className={form}>
        <div className={formInner}>
          <div className={`${secHeadRow} mb-5`}>
            <h3 className={`${secHead} text-pop-violet`}>Add Timeline Event</h3>
          </div>
          <form onSubmit={handleAdd}>
            <div className={field}>
              <label className={fieldLabel}>Event Name</label>
              <input
                className={fieldInput}
                placeholder="e.g. Makeathon"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className={field}>
              <label className={fieldLabel}>Date</label>
              <input
                className={fieldInput}
                placeholder="e.g. March 2026"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className={field}>
              <label className={fieldLabel}>Description</label>
              <textarea
                className={fieldTextarea}
                placeholder="Short description of the event…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                className={btnGradient}
                disabled={saving}
              >
                {saving ? "Adding…" : "+ Add Event"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div>
        <div className={`${secHeadRow} mb-4`}>
          <h3 className={`${secHead} text-ink`}>Timeline Events</h3>
          <span className="text-[11px] font-semibold text-ink-2 uppercase tracking-[0.06em]">
            {items.length} event{items.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className={emptyState}>
            <span className={emptyStateMono}>Loading…</span>
          </div>
        ) : items.length === 0 ? (
          <div className={emptyState}>
            <span className={emptyStateMono}>No timeline events yet</span>
          </div>
        ) : (
          <div className={dashTable}>
            {items.map((item) => (
              <div key={item.id} className={`${dashRow} flex-wrap gap-y-1.5`}>
                <div className={dashRowMain}>
                  <span className={dashRowTitle}>{item.name}</span>
                  <span className={dashRowMeta}>
                    {item.date}
                    {item.description && <> · {item.description}</>}
                  </span>
                </div>
                <button
                  className={dashRowDelete}
                  onClick={() => setPending(item)}
                  disabled={deleting === item.id}
                >
                  {deleting === item.id ? "…" : "Delete"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {pending && (
        <div className={modalBackdrop} onClick={() => setPending(null)}>
          <div className={modal} onClick={(e) => e.stopPropagation()}>
            <p className={modalLabel}>Confirm action</p>
            <p className={modalTitle}>
              Delete{" "}
              <em className="not-italic text-pop-violet">"{pending.name}"</em>?
            </p>
            <p className={modalWarn}>This cannot be undone.</p>
            <div className={modalActions}>
              <button className={btnGhost} onClick={() => setPending(null)}>
                Cancel
              </button>
              <button
                className={btnDanger}
                onClick={() => handleDelete(pending)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

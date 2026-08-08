"use client";

import { useState } from "react";
import { secHead } from "@/lib/ui";

const HEADER =
  "w-full flex items-center gap-3 px-4 py-3 bg-paper-2 text-left transition-colors duration-150 hover:bg-paper-3";

const BADGE =
  "shrink-0 px-2.5 py-0.5 rounded-full border-2 border-black text-[10px] font-bold tracking-[0.06em] uppercase";

/**
 * A collapsible optional block on the submit form.
 *
 * Everything past title and one-liner is optional, but laid out flat it reads
 * like a tax return — people bail before reaching the parts they'd have enjoyed
 * filling in. Collapsed sections that advertise what they hold (and show a
 * count once filled) keep the required path short while leaving the depth
 * available to anyone who wants it.
 */
export default function FormSection({
  title,
  colorClass,
  blurb,
  summary,
  defaultOpen = false,
  children,
}: {
  title: string;
  colorClass: string;
  /** Shown under the title when collapsed — sells what the section is for. */
  blurb: string;
  /** e.g. "3 entries". Renders a filled pill when set, "Add" when not. */
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const filled = !!summary;

  return (
    <div className="mt-3.5 border-2 border-black rounded-[6px] overflow-hidden bg-white">
      <button
        type="button"
        className={HEADER}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="flex-1 min-w-0">
          <span className={`${secHead} ${colorClass} block text-lg md:text-xl`}>
            {title}
          </span>
          {!open && (
            <span className="block text-[11.5px] font-medium text-ink-2 mt-1 leading-[1.45]">
              {blurb}
            </span>
          )}
        </span>
        <span
          className={`${BADGE} ${filled ? "bg-pop-magenta text-white shadow-[2px_2px_0px_0px_#000]" : "bg-white text-ink-2"}`}
        >
          {summary ?? "Optional"}
        </span>
        <span
          className="shrink-0 text-[13px] font-bold text-ink leading-none w-4 text-center"
          aria-hidden
        >
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open && <div className="p-4 border-t-2 border-black">{children}</div>}
    </div>
  );
}

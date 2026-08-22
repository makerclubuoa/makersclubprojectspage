"use client";

import { useEffect, useId, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  AUDIO_MAX_BYTES,
  MAX_MEDIA_ITEMS,
  MEDIA_ACCEPT,
  MEDIA_BUCKET,
  embedUrl,
  formatBytes,
  formatClock,
  mediaExtension,
  mediaFileError,
  parseVideoUrl,
  providerLabel,
  readMediaDuration,
  videoThumbnail,
  type MediaKind,
  type ProjectMedia,
  type VideoProvider,
} from "@/lib/media";
import {
  dynAdd,
  dynRow,
  dynRowRemove,
  fieldInput,
  fieldLabel,
  galleryUpload,
} from "@/lib/ui";

/** A media item being edited: an uploaded audio file, or a linked video. */
export type DraftMedia = {
  /** Stable React key — files have no natural id. */
  key: string;
  kind: MediaKind;
  /** Set for newly picked audio files; null once the item lives in storage. */
  file: File | null;
  /** Object URL while local, public Supabase URL once uploaded, or a video link. */
  url: string;
  title: string;
  duration: number;
  mime: string;
  preview: boolean;
  provider?: VideoProvider;
  videoId?: string;
};

let draftSeq = 0;
const nextKey = () => `media-${Date.now()}-${draftSeq++}`;

/** Rehydrates the edit form from what's already stored on the project. */
export function draftFromStored(m: ProjectMedia): DraftMedia {
  return {
    key: nextKey(),
    kind: m.kind,
    file: null,
    url: m.url,
    title: m.title ?? "",
    duration: m.duration ?? 0,
    mime: m.mime ?? "",
    preview: m.preview ?? false,
    provider: m.provider,
    videoId: m.videoId,
  };
}

/**
 * Uploads any newly picked audio and returns the list to store on the project.
 * Existing items and video links pass through untouched, so saving an edit
 * doesn't re-upload media that hasn't changed.
 */
export async function uploadMediaDrafts(
  projectId: string,
  drafts: DraftMedia[],
): Promise<{ media: ProjectMedia[] | null; error: string | null; uploadedPaths: string[] }> {
  const out: ProjectMedia[] = [];
  const uploadedPaths: string[] = [];

  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i];
    let url = d.url;

    if (d.file) {
      const path = `${projectId}/media/${Date.now()}-${i}.${mediaExtension(d.file)}`;
      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, d.file, {
          upsert: true,
          contentType: d.file.type || undefined,
        });
      if (error) {
        if (uploadedPaths.length > 0) {
          await supabase.storage.from(MEDIA_BUCKET).remove(uploadedPaths);
        }
        const label = d.title.trim() || d.file.name;
        return { media: null, error: `“${label}” failed to upload: ${error.message}`, uploadedPaths: [] };
      }
      uploadedPaths.push(path);
      url = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
    }

    out.push({
      kind: d.kind,
      url,
      title: d.title.trim() || undefined,
      duration: d.duration > 0 ? Math.round(d.duration) : undefined,
      mime: d.mime || undefined,
      preview: d.preview || undefined,
      provider: d.provider,
      videoId: d.videoId,
    });
  }

  // Guarantee exactly one flagged item so cards never have to guess.
  if (out.length > 0 && !out.some((m) => m.preview)) out[0].preview = true;

  return { media: out.length > 0 ? out : null, error: null, uploadedPaths };
}

/* ── The widget ─────────────────────────────────────── */

export default function MediaUploader({
  items,
  onChange,
}: {
  items: DraftMedia[];
  onChange: (next: DraftMedia[]) => void;
}) {
  const radioName = useId();
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [linkError, setLinkError] = useState("");

  // Object URLs created for picked files are revoked when the page unmounts.
  const objectUrls = useRef<string[]>([]);
  useEffect(
    () => () => objectUrls.current.forEach((u) => URL.revokeObjectURL(u)),
    [],
  );

  const full = items.length >= MAX_MEDIA_ITEMS;

  async function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setBusy(true);

    const picked = Array.from(fileList);
    const room = MAX_MEDIA_ITEMS - items.length;
    const problems: string[] = [];

    if (room <= 0) {
      problems.push(`You've already attached the maximum of ${MAX_MEDIA_ITEMS} items.`);
    } else if (picked.length > room) {
      problems.push(
        `You can attach up to ${MAX_MEDIA_ITEMS} items, only the first ${room} were added.`,
      );
    }

    const accepted: DraftMedia[] = [];
    for (const file of picked.slice(0, Math.max(room, 0))) {
      const problem = mediaFileError(file);
      if (problem) {
        problems.push(problem);
        continue;
      }
      const duration = await readMediaDuration(file);
      const url = URL.createObjectURL(file);
      objectUrls.current.push(url);
      accepted.push({
        key: nextKey(),
        kind: "audio",
        file,
        url,
        // Filename minus extension is a decent first guess at a title.
        title: file.name.replace(/\.[^.]+$/, ""),
        duration,
        mime: file.type,
        preview: items.length === 0 && accepted.length === 0,
      });
    }

    setErrors(problems);
    setBusy(false);
    if (accepted.length > 0) onChange([...items, ...accepted]);
  }

  function addLink() {
    const parsed = parseVideoUrl(linkInput);
    if (!parsed) {
      setLinkError("That doesn't look like a YouTube or Vimeo link.");
      return;
    }
    if (items.some((it) => it.videoId === parsed.videoId)) {
      setLinkError("That video is already attached.");
      return;
    }
    if (full) {
      setLinkError(`You've already attached the maximum of ${MAX_MEDIA_ITEMS} items.`);
      return;
    }
    setLinkError("");
    setLinkInput("");
    onChange([
      ...items,
      {
        key: nextKey(),
        kind: "video",
        file: null,
        url: linkInput.trim(),
        title: "",
        duration: 0,
        mime: "",
        preview: items.length === 0,
        provider: parsed.provider,
        videoId: parsed.videoId,
      },
    ]);
  }

  function update(key: string, patch: Partial<DraftMedia>) {
    onChange(items.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }

  function remove(key: string) {
    const next = items.filter((it) => it.key !== key);
    // Never leave the list without a card preview.
    if (next.length > 0 && !next.some((it) => it.preview)) next[0].preview = true;
    onChange(next);
  }

  function choosePreview(key: string) {
    onChange(items.map((it) => ({ ...it, preview: it.key === key })));
  }

  return (
    <div className="flex flex-col gap-2.5">
      {items.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {items.map((item) => (
            <MediaDraftRow
              key={item.key}
              item={item}
              radioName={radioName}
              showPreviewPicker={items.length > 1}
              onUpdate={(patch) => update(item.key, patch)}
              onRemove={() => remove(item.key)}
              onChoosePreview={() => choosePreview(item.key)}
            />
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <ul className="flex flex-col gap-1 m-0 list-none">
          {errors.map((e, i) => (
            <li key={i} className="text-pop-red text-[11.5px] font-semibold leading-[1.5]">
              {e}
            </li>
          ))}
        </ul>
      )}

      {!full && (
        <>
          <label className={`${galleryUpload} ${busy ? "opacity-60" : ""}`}>
            {busy ? "Reading file…" : "♪ Upload a track"}
            <input
              type="file"
              accept={MEDIA_ACCEPT}
              multiple
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                void addFiles(e.target.files);
                // Let the same file be re-picked after a removal.
                e.target.value = "";
              }}
            />
          </label>
          <p className="text-[11px] text-muted leading-[1.5] m-0 -mt-1">
            MP3, WAV, M4A up to {formatBytes(AUDIO_MAX_BYTES)}.
          </p>

          <div className="flex flex-col gap-1.5 mt-1">
            <label className={fieldLabel} htmlFor={`media-link-${radioName}`}>
              <span>▶ Or paste a video link</span>
            </label>
            <div className="flex gap-2">
              <input
                id={`media-link-${radioName}`}
                className={fieldInput}
                type="url"
                placeholder="https://youtube.com/watch?v=… or vimeo.com/…"
                value={linkInput}
                onChange={(e) => {
                  setLinkInput(e.target.value);
                  setLinkError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLink();
                  }
                }}
              />
              <button
                type="button"
                className={`${dynAdd} shrink-0`}
                onClick={addLink}
                disabled={!linkInput.trim()}
              >
                + Add
              </button>
            </div>
            {linkError && (
              <p className="text-pop-red text-[11.5px] font-semibold m-0">
                {linkError}
              </p>
            )}
            <p className="text-[11px] text-muted leading-[1.5] m-0">
              YouTube and Vimeo carry the bandwidth, so linked video costs the
              club nothing, upload it there, paste the link here.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/* ── One row ────────────────────────────────────────── */

const CHIP =
  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border-2 border-black bg-white text-[10px] font-bold tracking-[0.06em] uppercase";

function MediaDraftRow({
  item,
  radioName,
  showPreviewPicker,
  onUpdate,
  onRemove,
  onChoosePreview,
}: {
  item: DraftMedia;
  radioName: string;
  showPreviewPicker: boolean;
  onUpdate: (patch: Partial<DraftMedia>) => void;
  onRemove: () => void;
  onChoosePreview: () => void;
}) {
  const [duration, setDuration] = useState(item.duration);
  const isVideo = item.kind === "video";

  // Video rows preview through the provider's own player, mounted only when asked.
  const [showEmbed, setShowEmbed] = useState(false);
  const thumb = isVideo
    ? videoThumbnail({
        kind: "video",
        url: item.url,
        provider: item.provider,
        videoId: item.videoId,
      })
    : null;

  return (
    <div className={dynRow}>
      <button
        type="button"
        className={dynRowRemove}
        onClick={onRemove}
        aria-label="Remove this item"
      >
        ✕
      </button>

      <div className="flex flex-col gap-1.5 pr-6">
        <label className={fieldLabel} htmlFor={`media-title-${item.key}`}>
          {isVideo ? "Video title" : "Track title"}
        </label>
        <input
          id={`media-title-${item.key}`}
          className={fieldInput}
          type="text"
          placeholder={isVideo ? "e.g. Demo run" : "e.g. Quokka Theme"}
          value={item.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={`${CHIP} ${isVideo ? "bg-pop-violet" : "bg-pop-blue"} text-white`}
        >
          {isVideo && item.provider
            ? `▶ ${providerLabel(item.provider)}`
            : "♪ Audio"}
        </span>
        {duration > 0 && <span className={CHIP}>{formatClock(duration)}</span>}
        {item.file && <span className={CHIP}>{formatBytes(item.file.size)}</span>}
        {!item.file && !isVideo && (
          <span className={`${CHIP} text-ink-2`}>Already uploaded</span>
        )}
        {isVideo && <span className={`${CHIP} text-ink-2`}>Hosted free</span>}
      </div>

      {isVideo ? (
        <div className="relative w-full max-w-[420px] aspect-video border-2 border-black rounded-[4px] overflow-hidden bg-black">
          {showEmbed ? (
            <iframe
              src={
                embedUrl(
                  {
                    kind: "video",
                    url: item.url,
                    provider: item.provider,
                    videoId: item.videoId,
                  },
                  { autoplay: true },
                ) ?? undefined
              }
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              title={item.title || "Video preview"}
            />
          ) : (
            <button
              type="button"
              className="absolute inset-0 w-full h-full grid place-items-center group"
              onClick={() => setShowEmbed(true)}
              aria-label="Check this is the right video"
            >
              {thumb && (
                // Provider-hosted still — free, and never touches Supabase.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumb}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-70"
                />
              )}
              <span className="relative grid place-items-center w-12 h-12 rounded-full border-2 border-black bg-white text-black text-sm shadow-[2px_2px_0px_0px_#000] transition-transform duration-150 group-hover:scale-110">
                ▶
              </span>
            </button>
          )}
        </div>
      ) : (
        <audio
          src={item.url}
          preload="metadata"
          className="hidden"
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (Number.isFinite(d) && d > 0) {
              setDuration(d);
              if (item.duration !== d) onUpdate({ duration: d });
            }
          }}
        />
      )}

      {showPreviewPicker && (
        <label className="flex items-center gap-2 mt-1 pt-2 border-t-2 border-black/10 text-[11px] font-bold tracking-[0.06em] uppercase text-ink cursor-pointer">
          <input
            type="radio"
            name={radioName}
            className="w-auto accent-pop-magenta"
            checked={item.preview}
            onChange={onChoosePreview}
          />
          Use this one on cards
        </label>
      )}
    </div>
  );
}

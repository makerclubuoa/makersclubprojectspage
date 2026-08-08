// Music and video attached to a project.
//
// One place for the stored shape, the upload limits and the small helpers the
// submit form, the edit form, the project cards and the detail page all share.
// Deliberately free of any Supabase import so it can be pulled into server
// components, client components and plain modules alike.
//
// Audio is uploaded to Supabase Storage; video is linked from YouTube or Vimeo
// rather than hosted. That split is deliberate — see MEDIA_NOTE below.

export type MediaKind = "audio" | "video";
export type VideoProvider = "youtube" | "vimeo";

export interface ProjectMedia {
  kind: MediaKind;
  /** Audio: public Supabase Storage URL. Video: the original YouTube/Vimeo link. */
  url: string;
  /** Submitter-supplied label. Falls back to the project title when rendering. */
  title?: string;
  /** Seconds into the file where previews start. 0 = from the top. */
  preview_start: number;
  /** Captured at upload so scrubbers can render without fetching the file. */
  duration?: number;
  mime?: string;
  /** The item cards preview. Falls back to the first item when nothing is set. */
  preview?: boolean;
  /** Video only — which service hosts it. */
  provider?: VideoProvider;
  /** Video only — the id used to build an embed URL. */
  videoId?: string;
}

export const MEDIA_BUCKET = "Project Media";

/*
 * MEDIA_NOTE — why video isn't uploaded.
 *
 * Supabase's free plan allows 1 GB of storage and 5 GB of egress a month, and
 * exceeding either restricts the whole project: 402s, read-only database, and
 * only one grace period ever. Since the archive's database, auth and comments
 * share that quota, a single widely-shared video could take the site down until
 * the next billing cycle. A minute of 720p is ~19 MB against a 4-minute MP3's
 * ~6 MB, so audio is roughly seven times cheaper per play — cheap enough to
 * host, where video isn't. YouTube and Vimeo carry the video bandwidth for free.
 */
export const AUDIO_MAX_BYTES = 20 * 1024 * 1024;

/** Keeps one project from monopolising the storage quota. */
export const MAX_MEDIA_ITEMS = 6;

/** How long the "hear it / watch it" button plays for before resetting. */
export const AUDITION_SECONDS = 8;

const AUDIO_EXTENSIONS = ["mp3", "wav", "ogg", "oga", "m4a", "aac", "flac"];

export const MEDIA_ACCEPT = "audio/*";

/* ── Formatting ─────────────────────────────────────── */

/** Seconds → `m:ss`, the form every player on the page uses. */
export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

/** Parses `83`, `1:23` or `1:23.5` back into seconds. Null when unparseable. */
export function parseClock(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(":");
  if (parts.length > 2) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isFinite(n) || n < 0)) return null;
  return parts.length === 2 ? nums[0] * 60 + nums[1] : nums[0];
}

export function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 10 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`;
}

/* ── Selection ──────────────────────────────────────── */

/** The item a card previews: whichever is flagged, else the first attached. */
export function pickPreviewMedia(
  media: ProjectMedia[] | null | undefined,
): ProjectMedia | null {
  if (!media || media.length === 0) return null;
  return media.find((m) => m.preview) ?? media[0];
}

/**
 * Appends a media fragment so the browser issues a ranged request from the
 * preview point rather than pulling the file from byte zero — the difference
 * between streaming a few seconds and streaming the whole track on every play.
 */
export function mediaSrcAt(url: string, start: number): string {
  const from = Math.floor(start || 0);
  return from > 0 ? `${url}#t=${from}` : url;
}

/* ── Video links ────────────────────────────────────── */

/** Recognises the YouTube and Vimeo URL shapes people actually paste. */
export function parseVideoUrl(
  input: string,
): { provider: VideoProvider; videoId: string } | null {
  const raw = input.trim();
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  if (host === "youtu.be") {
    const id = segments[0];
    return id ? { provider: "youtube", videoId: id } : null;
  }

  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const v = url.searchParams.get("v");
    if (v) return { provider: "youtube", videoId: v };
    // /embed/ID, /shorts/ID, /live/ID
    if (["embed", "shorts", "live", "v"].includes(segments[0]) && segments[1]) {
      return { provider: "youtube", videoId: segments[1] };
    }
    return null;
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    // vimeo.com/123456789 or player.vimeo.com/video/123456789
    const id = segments.find((s) => /^\d+$/.test(s));
    return id ? { provider: "vimeo", videoId: id } : null;
  }

  return null;
}

/**
 * Embed URL for an iframe. Muted embeds are what browsers allow to autoplay,
 * so hover previews pass `muted`; a deliberate press of play doesn't need to.
 */
export function embedUrl(
  media: ProjectMedia,
  { autoplay = false, muted = false }: { autoplay?: boolean; muted?: boolean } = {},
): string | null {
  if (!media.provider || !media.videoId) return null;
  const start = Math.max(0, Math.floor(media.preview_start || 0));

  if (media.provider === "youtube") {
    const params = new URLSearchParams({
      start: String(start),
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
    });
    if (autoplay) params.set("autoplay", "1");
    if (muted) params.set("mute", "1");
    // -nocookie keeps YouTube from setting tracking cookies on the archive.
    return `https://www.youtube-nocookie.com/embed/${media.videoId}?${params}`;
  }

  const params = new URLSearchParams();
  if (autoplay) params.set("autoplay", "1");
  if (muted) params.set("muted", "1");
  const query = params.toString();
  return `https://player.vimeo.com/video/${media.videoId}${query ? `?${query}` : ""}${
    start > 0 ? `#t=${start}s` : ""
  }`;
}

/** Free, provider-hosted still for a linked video. Null when there isn't one. */
export function videoThumbnail(media: ProjectMedia): string | null {
  if (media.provider === "youtube" && media.videoId) {
    return `https://img.youtube.com/vi/${media.videoId}/hqdefault.jpg`;
  }
  // Vimeo stills need an API round-trip, so callers fall back to the cover.
  return null;
}

export function providerLabel(provider: VideoProvider): string {
  return provider === "youtube" ? "YouTube" : "Vimeo";
}

/* ── Audio uploads ──────────────────────────────────── */

/** Audio-only: video comes in as a link, never a file. */
export function isAudioFile(file: File): boolean {
  if (file.type.startsWith("audio/")) return true;
  // Some browsers hand over an empty type for .m4a — fall back to extension.
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return AUDIO_EXTENSIONS.includes(ext);
}

/** Human-readable reason the file can't be uploaded, or null when it's fine. */
export function mediaFileError(file: File): string | null {
  if (file.type.startsWith("video/")) {
    return `“${file.name}” is a video — paste a YouTube or Vimeo link instead so it doesn't eat the club's storage.`;
  }
  if (!isAudioFile(file)) {
    return `“${file.name}” isn't an audio file.`;
  }
  if (file.size > AUDIO_MAX_BYTES) {
    return `“${file.name}” is ${formatBytes(file.size)} — the limit is ${formatBytes(AUDIO_MAX_BYTES)}. Try exporting it as an MP3.`;
  }
  return null;
}

/**
 * Reads duration out of a picked file by loading only its metadata, so the
 * preview scrubber knows its range before anything is uploaded. Resolves 0 if
 * the browser can't decode it — callers treat that as "unknown length".
 * Browser-only.
 */
export function readMediaDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const el = document.createElement("audio");
    const url = URL.createObjectURL(file);
    let settled = false;
    const done = (value: number) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(value) && value > 0 ? value : 0);
    };
    el.preload = "metadata";
    el.onloadedmetadata = () => done(el.duration);
    el.onerror = () => done(0);
    // Don't leave the promise hanging on a file the decoder silently chokes on.
    setTimeout(() => done(0), 10000);
    el.src = url;
  });
}

/** File extension for the storage path. */
export function mediaExtension(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && ext.length <= 5 && /^[a-z0-9]+$/.test(ext)) return ext;
  return "mp3";
}

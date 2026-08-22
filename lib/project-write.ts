import type { BOMItem, BuildLogEntry, Project, ProjectMedia } from "@/lib/projects";
import { MAX_MEDIA_ITEMS } from "@/lib/media";
import { supabaseAdmin } from "@/lib/supabase-server";

const PROJECT_FIELDS = [
  "title", "category", "blurb", "description", "tools", "makers", "maker_ids",
  "anon_count", "github", "website", "image", "start_date", "build_time",
  "gallery_images", "media", "build_log", "bom", "retro_wins", "retro_fixes",
] as const;

type WritableProject = Record<(typeof PROJECT_FIELDS)[number], unknown>;

function optionalString(value: unknown, max: number): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string") throw new Error("Expected text");
  const trimmed = value.trim();
  if (trimmed.length > max) throw new Error(`Text exceeds ${max} characters`);
  return trimmed || null;
}

function stringArray(value: unknown, maxItems: number, maxLength = 120): string[] | null {
  if (value == null) return null;
  if (!Array.isArray(value) || value.length > maxItems) throw new Error("Invalid list");
  const out = value.map((item) => {
    if (typeof item !== "string") throw new Error("Invalid list item");
    const trimmed = item.trim();
    if (!trimmed || trimmed.length > maxLength) throw new Error("Invalid list item");
    return trimmed;
  });
  return [...new Set(out)];
}

function httpUrl(value: unknown): string | null {
  const raw = optionalString(value, 2048);
  if (!raw) return null;
  let parsed: URL;
  try { parsed = new URL(raw); } catch { throw new Error("Invalid URL"); }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Only HTTP and HTTPS links are allowed");
  }
  return parsed.toString();
}

function plainObjects(value: unknown, maxItems: number): Record<string, unknown>[] | null {
  if (value == null) return null;
  if (!Array.isArray(value) || value.length > maxItems) throw new Error("Invalid structured list");
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("Invalid structured item");
    }
  }
  return value as Record<string, unknown>[];
}

function buildLogList(value: unknown): BuildLogEntry[] | null {
  const rows = plainObjects(value, 100);
  if (!rows) return null;
  return rows.map((row) => {
    const title = optionalString(row.title, 160);
    if (!title) throw new Error("Build log titles are required");
    return {
      date: optionalString(row.date, 20) ?? "",
      title,
      body: optionalString(row.body, 5000) ?? "",
      milestone: row.milestone === true || undefined,
      tag: optionalString(row.tag, 80) ?? undefined,
      week_label: optionalString(row.week_label, 80) ?? undefined,
      image: httpUrl(row.image) ?? undefined,
    };
  });
}

function bomList(value: unknown): BOMItem[] | null {
  const rows = plainObjects(value, 200);
  if (!rows) return null;
  return rows.map((row) => {
    const item = optionalString(row.item, 200);
    if (!item) throw new Error("Bill of materials item names are required");
    const qty = Number(row.qty);
    const unitCost = Number(row.unit_cost);
    if (!Number.isFinite(qty) || qty <= 0 || qty > 1_000_000) throw new Error("Invalid item quantity");
    if (!Number.isFinite(unitCost) || unitCost < 0 || unitCost > 1_000_000_000) throw new Error("Invalid item cost");
    return {
      item,
      desc: optionalString(row.desc, 1000) ?? undefined,
      qty,
      unit_cost: unitCost,
      // “Source” is the supplier/place (for example “Jaycar”), not
      // necessarily a link. The form intentionally accepts ordinary text.
      src: optionalString(row.src, 500) ?? undefined,
    };
  });
}

function mediaList(value: unknown): ProjectMedia[] | null {
  const rows = plainObjects(value, MAX_MEDIA_ITEMS);
  if (!rows) return null;
  return rows.map((row) => {
    if (row.kind !== "audio" && row.kind !== "video") throw new Error("Invalid media kind");
    const url = httpUrl(row.url);
    if (!url) throw new Error("Media URL is required");
    const title = optionalString(row.title, 160) ?? undefined;
    const duration = typeof row.duration === "number" && Number.isFinite(row.duration)
      ? Math.max(0, row.duration)
      : undefined;
    const preview = row.preview === true;
    if (row.kind === "video") {
      if (row.provider !== "youtube" && row.provider !== "vimeo") throw new Error("Invalid video provider");
      const videoId = optionalString(row.videoId, 128);
      if (!videoId) throw new Error("Video ID is required");
      return { kind: "video", url, title, duration, preview, provider: row.provider, videoId };
    }
    return { kind: "audio", url, title, duration, preview, mime: optionalString(row.mime, 120) ?? undefined };
  });
}

export function validatedProjectWrite(input: unknown): Partial<WritableProject> {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid project payload");
  const raw = input as Record<string, unknown>;
  const title = optionalString(raw.title, 120);
  const blurb = optionalString(raw.blurb, 140);
  if (!title || !blurb) throw new Error("Title and one-line description are required");

  const anon = raw.anon_count == null ? 0 : Number(raw.anon_count);
  if (!Number.isInteger(anon) || anon < 0 || anon > 100) throw new Error("Invalid anonymous maker count");

  return {
    title,
    category: optionalString(raw.category, 80),
    blurb,
    description: optionalString(raw.description, 20000),
    tools: stringArray(raw.tools, 50),
    makers: stringArray(raw.makers, 100),
    maker_ids: stringArray(raw.maker_ids, 100, 80),
    anon_count: anon,
    github: httpUrl(raw.github),
    website: httpUrl(raw.website),
    image: httpUrl(raw.image),
    start_date: optionalString(raw.start_date, 20),
    build_time: optionalString(raw.build_time, 120),
    gallery_images: raw.gallery_images == null ? null : stringArray(raw.gallery_images, 40, 2048)?.map((url) => httpUrl(url)),
    media: mediaList(raw.media),
    build_log: buildLogList(raw.build_log),
    bom: bomList(raw.bom),
    retro_wins: stringArray(raw.retro_wins, 100, 1000),
    retro_fixes: stringArray(raw.retro_fixes, 100, 1000),
  };
}

function storedUrls(project: Partial<Project>): Set<string> {
  const urls = new Set<string>();
  if (project.image) urls.add(project.image);
  for (const url of project.gallery_images ?? []) if (url) urls.add(url);
  for (const entry of project.build_log ?? []) if (entry.image) urls.add(entry.image);
  for (const media of project.media ?? []) if (media.kind === "audio" && media.url) urls.add(media.url);
  return urls;
}

function objectFromPublicUrl(raw: string): { bucket: string; path: string } | null {
  try {
    const parts = decodeURIComponent(new URL(raw).pathname).split("/object/public/");
    if (parts.length !== 2) return null;
    const slash = parts[1].indexOf("/");
    if (slash < 1) return null;
    return { bucket: parts[1].slice(0, slash), path: parts[1].slice(slash + 1) };
  } catch { return null; }
}

export async function removeStoredUrls(urls: Iterable<string>, projectId?: string): Promise<void> {
  const grouped = new Map<string, string[]>();
  for (const url of urls) {
    const object = objectFromPublicUrl(url);
    if (!object || !["Project Images", "Project Media"].includes(object.bucket)) continue;
    if (projectId && !object.path.startsWith(`${projectId}/`)) continue;
    grouped.set(object.bucket, [...(grouped.get(object.bucket) ?? []), object.path]);
  }
  await Promise.all([...grouped].map(([bucket, paths]) =>
    paths.length ? supabaseAdmin.storage.from(bucket).remove([...new Set(paths)]) : Promise.resolve(),
  ));
}

export async function removeProjectAssets(project: Partial<Project>, projectId?: string): Promise<void> {
  await removeStoredUrls(storedUrls(project), projectId);
}

export function removedAssetUrls(before: Partial<Project>, after: Partial<Project>): string[] {
  const oldUrls = storedUrls(before);
  const nextUrls = storedUrls(after);
  return [...oldUrls].filter((url) => !nextUrls.has(url));
}

export function newlyAddedAssetUrls(before: Partial<Project>, after: Partial<Project>): string[] {
  const oldUrls = storedUrls(before);
  return [...storedUrls(after)].filter((url) => !oldUrls.has(url));
}

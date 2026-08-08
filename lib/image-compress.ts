// Client-side image downscaling, applied to every photo on its way into
// Supabase Storage.
//
// Phone cameras hand over 3–5 MB JPEGs that we then display in a grid cell a
// few hundred pixels wide. Storing them at full size costs quota twice: once in
// the 1 GB bucket, and again in egress every time somebody loads the page. This
// re-encodes to WebP at display-appropriate dimensions before upload, which
// typically lands a 4 MB photo somewhere around 150–350 KB.
//
// Browser-only — it needs canvas.

export type ImageRole = "cover" | "inline";

const TARGETS: Record<ImageRole, { maxEdge: number; quality: number }> = {
  // Covers render largest: the detail-page polaroid and the wide bento cards.
  // 1600px still covers a 2x display at those sizes with room to spare.
  cover: { maxEdge: 1600, quality: 0.82 },
  // Gallery thumbs and build-log shots never render wider than a grid cell,
  // so they can be cut down harder.
  inline: { maxEdge: 1200, quality: 0.75 },
};

/** Formats that must pass through untouched: vector, or animation we'd flatten. */
const PASS_THROUGH = ["image/svg+xml", "image/gif"];

export type CompressedImage = {
  /** Upload this — the re-encoded blob, or the original when it was already smaller. */
  blob: Blob;
  /** Extension matching `blob`, for building the storage path. */
  ext: string;
  contentType: string;
};

function originalOf(file: File): CompressedImage {
  const ext = file.name.split(".").pop()?.toLowerCase();
  return {
    blob: file,
    ext: ext && /^[a-z0-9]+$/.test(ext) ? ext : "jpg",
    contentType: file.type || "image/jpeg",
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    // `from-image` applies EXIF rotation, so portrait phone shots don't land sideways.
    return createImageBitmap(file, { imageOrientation: "from-image" });
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("decode failed"));
      img.src = url;
    });
  } finally {
    // Revoking after load is safe; the bitmap is already in memory.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/**
 * Downscales and re-encodes `file` for its display role.
 *
 * Never returns something larger than what it was given, and falls back to the
 * original on any decode/encode failure — a photo that won't compress should
 * still upload rather than blocking the submission.
 */
export async function compressForUpload(
  file: File,
  role: ImageRole,
): Promise<CompressedImage> {
  if (!file.type.startsWith("image/") || PASS_THROUGH.includes(file.type)) {
    return originalOf(file);
  }

  const { maxEdge, quality } = TARGETS[role];

  try {
    const source = await decode(file);
    const width = "width" in source ? source.width : 0;
    const height = "height" in source ? source.height : 0;
    if (!width || !height) return originalOf(file);

    const scale = Math.min(1, maxEdge / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return originalOf(file);
    ctx.drawImage(source as CanvasImageSource, 0, 0, targetW, targetH);
    if ("close" in source) source.close();

    const blob = await canvasToBlob(canvas, "image/webp", quality);
    // A tiny already-optimised image can come out bigger after re-encoding.
    if (!blob || blob.size >= file.size) return originalOf(file);

    return { blob, ext: "webp", contentType: "image/webp" };
  } catch {
    return originalOf(file);
  }
}

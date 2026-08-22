import { tapeMappings } from "@/app/components/global/Photo";
import { adminBrowsePosts, AdminPost } from "@/lib/ghost-admin";

type TapeKey = keyof typeof tapeMappings;

function getRandomTape(): TapeKey {
  const keys = Object.keys(tapeMappings) as TapeKey[];
  return keys[Math.floor(Math.random() * keys.length)];
}

export interface PhotosType {
  src: string;
  alt?: string;
  tape: TapeKey;
}

export async function getPhotos(): Promise<PhotosType[]> {
  try {
    const photos: AdminPost | undefined = (
      await adminBrowsePosts("filter=title:'Photos'&formats=lexical&limit=1")
    )[0];
    if (!photos?.lexical) return [];

    const parsed = JSON.parse(photos.lexical) as {
      root?: { children?: Array<{ src?: unknown; alt?: unknown }> };
    };
    const images = parsed.root?.children;
    if (!Array.isArray(images)) return [];

    const res: PhotosType[] = [];
    for (const image of images) {
      if (typeof image.src === "string" && image.src) {
        res.push({
          src: image.src,
          alt: typeof image.alt === "string" ? image.alt : undefined,
          tape: getRandomTape(),
        });
      }
    }
    return res;
  } catch {
    // Photo decoration should never take an otherwise useful page offline.
    return [];
  }
}

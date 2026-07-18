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
  const photos: AdminPost = (
    await adminBrowsePosts("filter=title:'Photos'&formats=lexical&limit=1")
  )[0];
  //@ts-ignore
  const imagesArr = JSON.parse(photos.lexical).root.children;
  let res: PhotosType[] = [];
  for (const image of imagesArr) {
    if (image.src) {
      res.push({ src: image.src, tape: getRandomTape() });
    }
  }
  return res;
}

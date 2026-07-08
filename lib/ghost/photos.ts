import { tapeMappings } from "@/app/components/global/Photo";
import { api } from "@/lib/ghost-api";
import { PostsOrPages } from "@tryghost/content-api";

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
  const photos: PostsOrPages = (
    await api().posts.browse({
      filter: "title:'Photos'",
      format: "html,lexical",
      limit: 1,
    })
  )[0];
  const imagesArr = JSON.parse(photos.lexical).root.children;
  let res: PhotosType[] = [];
  for (const image of imagesArr) {
    if (image.src) {
      res.push({ src: image.src, tape: getRandomTape() });
    }
  }
  console.log(res);
  return res;
}

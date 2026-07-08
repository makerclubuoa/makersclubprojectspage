import { api } from "@/lib/ghost-api";
import { PostsOrPages } from "@tryghost/content-api";

export interface PhotosType {
  src: string;
  alt?: string;
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
    res.push({ src: image.src });
  }
  console.log(res);
  return res;
}

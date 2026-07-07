import { api } from "@/lib/ghost-api";
import { DOMParser } from "@xmldom/xmldom";
import { propagateServerField } from "next/dist/server/lib/render-server";
export interface MakeathonType {
  title: string;
  date: string;
  description: string[];
  image: string;
}

export async function getMakeathon(): Promise<MakeathonType> {
  const makeathonDetail = (
    await api().posts.browse({
      filter: "title:'Makeathon'",
      formats: "html,lexical",
      limit: 1,
    })
  )[0];
  console.log(makeathonDetail);
  if (!makeathonDetail.html) throw new Error("Roadmap not found.");
  //NOTE: this is needed because xmldom requires one parent root
  const wrappedHtml = `
<!DOCTYPE html>
<html>
  <body>
    ${makeathonDetail.html}
  </body>
</html>
`;

  const doc = new DOMParser().parseFromString(wrappedHtml, "text/html");

  const paragraphElements = doc.getElementsByTagName("p");

  const title = paragraphElements[0].textContent;
  const date = paragraphElements[1].textContent;
  const description: string[] = [];
  for (let i = 2; i < paragraphElements.length; i++) {
    const text = paragraphElements[i].textContent;
    if (text !== null) {
      description.push(text);
    }
  }

  return {
    title: title ?? "Join our Make-A-Thon",
    date: date ?? "No date set.",
    description: description,
    image: makeathonDetail.feature_image,
  };
}

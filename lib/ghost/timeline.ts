import { adminBrowsePosts, AdminPost } from "@/lib/ghost-admin";
import { Document, DOMParser } from "@xmldom/xmldom";

export interface TimelineType {
  name: string;
  date: string;
  description: string;
}

export async function getYearTimeline(): Promise<TimelineType[]> {
  const yearRoadmap: AdminPost = (
    await adminBrowsePosts("filter=tag:roadmap&formats=html&limit=1")
  )[0];
  if (!yearRoadmap.html) throw new Error("Roadmap not found.");
  //NOTE: this is needed because xmldom requires one parent root
  const wrappedHtml = `
<!DOCTYPE html>
<html>
  <body>
    ${yearRoadmap.html}
  </body>
</html>
`;

  const doc = new DOMParser().parseFromString(wrappedHtml, "text/html");

  const paragraphElements = doc.getElementsByTagName("p");

  let counter = 0;
  const timelines: TimelineType[] = [];
  let timeline: TimelineType = { name: "", date: "", description: "" };

  for (const pElement of paragraphElements) {
    let text = pElement.textContent;
    if (text === null) continue;
    if (text.split(" ")[0].toUpperCase().includes("DATE")) {
      timeline.date = text.split(" ").slice(1).join(" ");
      counter++;
    } else if (text.split(" ")[0].toUpperCase().includes("DESC")) {
      timeline.description = text.split(" ").slice(1).join(" ");
      counter++;
    } else if (text.split(" ")[0].toUpperCase().includes("NAME")) {
      timeline.name = text.split(" ").slice(1).join(" ");
      counter++;
    } else {
      counter = 0;
    }
    if (counter === 3) {
      timelines.push({ ...timeline });
      counter = 0;
      timeline = { name: "", date: "", description: "" };
    }
  }

  return timelines;
}

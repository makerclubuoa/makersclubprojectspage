import { api } from "../../../lib/ghost-api";
import { PostOrPage } from "@tryghost/content-api";
import { Document, DOMParser } from "@xmldom/xmldom";

interface TimelineType {
  name: string;
  date: string;
  description: string;
}

export async function getYearTimeline() {
  const yearRoadmap: PostOrPage = (
    await api().posts.browse({
      filter: "tag:roadmap",
      formats: "html,lexical",
      limit: 1,
    })
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
    if (counter === 0 || counter === 3) {
      timelines.push({ ...timeline });
      timeline = { name: "", date: "", description: "" };
    }

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
  }

  return timelines;
}

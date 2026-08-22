import { Suspense } from "react";
import ProjectsSection from "../components/ProjectsSection";
import CTACarousel from "../components/CTACarousel";
import LinkButton from "../components/global/LinkButton";
import { fetchProjects, fetchMakerDisplays } from "@/lib/projects";
import {
  container,
  pageWrap,
  pageBand,
  pageBandTitle,
  pageBandSub,
  pageBandDoodle,
  holt,
} from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await fetchProjects();

  const makerDisplays = await fetchMakerDisplays(projects);

  const allTools = (() => {
    const s = new Set<string>();
    projects.forEach((p) => (p.tools ?? []).forEach((t) => s.add(t)));
    return ["All tools", ...[...s].sort()];
  })();

  const allCategories = [
    "All",
    ...[
      ...new Set(projects.map((p) => p.category).filter(Boolean) as string[]),
    ].sort(),
  ];

  return (
    <div className={pageWrap}>
      <main className="pt-20">
        <div className={pageBand}>
          <h1 className={`${pageBandTitle} text-indigo-300`}>Projects</h1>
          <p className={pageBandSub}>
            {`Things we've made. Hardware, software, textiles, art, food, it all belongs in the archive.`}
          </p>
        </div>

        <Suspense fallback={null}>
          <ProjectsSection
            projects={projects}
            allTools={allTools}
            allCategories={allCategories}
            makerDisplays={makerDisplays}
          />
        </Suspense>

        <div className="border-y-4 bg-white py-16">
          <div
            className={`${container} flex items-center gap-16 max-[900px]:flex-col max-[900px]:gap-10`}
          >
            <div className="flex-[0_0_380px] max-[900px]:flex-none">
              <h2
                className={`${holt} text-2xl md:text-3xl text-pop-pink mt-0 mb-3.5`}
              >
                Got a thing you made?
              </h2>
              <p className="font-semibold max-w-[44ch] text-base leading-[1.6] text-ink mt-0 mb-7">
                Submissions are open all the time. Half-finished, broken, or
                weird is welcome, that&rsquo;s usually where the good stuff is.
              </p>
              <LinkButton link="/submit" bgColour="pop-pink" textColour="white">
                Submit a Project
              </LinkButton>
            </div>
            <CTACarousel
              images={projects
                .filter((p) => p.image)
                .slice(0, 8)
                .map((p) => ({
                  id: p.id,
                  src: p.image!,
                  alt: p.title,
                }))}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

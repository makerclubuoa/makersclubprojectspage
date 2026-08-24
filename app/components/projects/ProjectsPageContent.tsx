"use client";

import { Suspense, useEffect, useState } from "react";
import ProjectsSection from "@/app/components/ProjectsSection";
import CTACarousel from "@/app/components/CTACarousel";
import LinkButton from "@/app/components/global/LinkButton";
import {
  fetchMakerDisplays,
  fetchProjects,
  type Project,
} from "@/lib/projects";
import {
  container,
  pageWrap,
  pageBand,
  pageBandTitle,
  pageBandSub,
  holt,
} from "@/lib/ui";

type MakerDisplays = Record<string, { names: string[]; anonCount: number }>;

export default function ProjectsPageContent({
  initialProjects,
  initialMakerDisplays,
}: {
  initialProjects: Project[];
  initialMakerDisplays: MakerDisplays;
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [makerDisplays, setMakerDisplays] = useState(initialMakerDisplays);

  useEffect(() => {
    let active = true;
    void fetchProjects()
      .then(async (items) => {
        const displays = await fetchMakerDisplays(items);
        if (active) {
          setProjects(items);
          setMakerDisplays(displays);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const allTools = (() => {
    const tools = new Set<string>();
    projects.forEach((project) =>
      (project.tools ?? []).forEach((tool) => tools.add(tool)),
    );
    return ["All tools", ...[...tools].sort()];
  })();
  const allCategories = [
    "All",
    ...[
      ...new Set(
        projects.map((project) => project.category).filter(Boolean) as string[],
      ),
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
                .filter((project) => project.image)
                .slice(0, 8)
                .map((project) => ({
                  id: project.id,
                  src: project.image!,
                  alt: project.title,
                }))}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import Photo from "@/app/components/global/Photo";
import ProjectMediaPlayer from "@/app/components/ProjectMediaPlayer";
import { pickPreviewMedia } from "@/lib/media";
import { type Project } from "@/lib/projects";

/**
 * One featured project on the homepage. Split out of ProjectsPreviewSection so
 * the hover state the media preview needs can live in a client component while
 * the section around it stays server-rendered.
 */
export default function ProjectPreviewCard({
  project,
  tape,
}: {
  project: Project;
  tape: string;
}) {
  const previewMedia = pickPreviewMedia(project.media);
  const [hovered, setHovered] = useState(false);

  return (
    <article
      className="relative w-full md:w-72 md:h-fit flex flex-col justify-start items-start"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={`/projects/${project.id}`}
        className="absolute inset-0 z-[1]"
        aria-label={`View ${project.title}`}
      />
      <div className="relative w-full aspect-square">
        <div className={`absolute z-20 pointer-events-none w-16 h-5 outline-2 outline-black ${tape}`} />
        <div className="absolute inset-0 outline-3 outline-black overflow-hidden">
          {project.image ? (
            <Photo
              src={project.image}
              alt={`Photo of ${project.title}.`}
              // max-w-none: this one fills the card, it isn't a 288px frame.
              typeOverride="w-full h-full max-w-none"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 px-2 text-sm font-semibold text-center text-gray-500">
              {project.title}
            </div>
          )}
          {previewMedia && (
            <ProjectMediaPlayer
              media={previewMedia}
              poster={project.image}
              hovered={hovered}
            />
          )}
        </div>
      </div>
      <h3 className="pt-3 text-lg font-bold text-black">{project.title}</h3>
      {project.blurb && (
        <p className="text-sm font-semibold text-black">{project.blurb}</p>
      )}
    </article>
  );
}

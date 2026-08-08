import { type Project } from "@/lib/projects";
import LinkButton from "../global/LinkButton";
import ProjectPreviewCard from "./ProjectPreviewCard";

const TAPES = [
  "-top-2 -left-3 -rotate-12 bg-pop-red",
  "-top-2 left-2/3 -translate-x-1/2 rotate-6 bg-pop-violet",
  "-top-2 -right-3 rotate-12 bg-pop-blue",
];

export default function ProjectsPreviewSection({
  projects,
}: {
  projects: Project[];
}) {
  const featured = projects.slice(0, 3);

  return (
    <div className="relative overflow-hidden bg-white flex items-center flex-col mx-5">
      {featured.length > 0 && (
        <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-10 px-6 pt-12 w-full max-w-[100rem] ">
          {featured.map((project, i) => (
            <ProjectPreviewCard
              key={project.id}
              project={project}
              tape={TAPES[i % TAPES.length]}
            />
          ))}
        </div>
      )}

      <div className="relative flex flex-col items-center gap-5 px-6 pt-16 pb-24">
        <p className="relative z-10 text-2xl md:text-3xl font-semibold text-center text-black">
          Got something you&rsquo;d like to share? We&rsquo;d love to see it!
        </p>
        <LinkButton link="/submit" bgColour="pop-pink" textColour="white">
          Submit a Project
        </LinkButton>
      </div>
    </div>
  );
}

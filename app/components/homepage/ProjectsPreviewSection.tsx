import Link from "next/link";
import { type Project } from "@/lib/projects";
import Photo from "@/app/components/global/Photo";
import LinkButton from "../global/LinkButton";

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
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="w-full md:w-72 md:h-fit flex flex-col justify-start items-start"
            >
              <div className="relative w-full aspect-square">
                <div
                  className={`absolute z-20 w-16 h-5 outline-2 outline-black ${TAPES[i % TAPES.length]}`}
                />
                <div className="absolute inset-0 outline-3 outline-black overflow-hidden">
                  {project.image ? (
                    <Photo
                      src={project.image}
                      alt={`Photo of ${project.title}.`}
                      typeOverride="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 px-2 text-sm font-semibold text-center text-gray-500">
                      {project.title}
                    </div>
                  )}
                </div>
              </div>
              <p className="pt-3 text-lg font-bold text-black">
                {project.title}
              </p>
              {project.blurb && (
                <p className="text-sm font-semibold text-black">
                  {project.blurb}
                </p>
              )}
            </Link>
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

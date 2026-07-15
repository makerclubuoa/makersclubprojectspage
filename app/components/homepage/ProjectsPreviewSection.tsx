import Link from "next/link";
import { type Project } from "@/lib/projects";

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
    <div className="relative outline-3 outline-black overflow-hidden bg-white">
      <div className="w-[104%] -ml-[2%] -mt-1 -rotate-1 bg-pop-blue border-b-3 border-black px-8 md:px-12 py-6">
        <p className="rotate-1 text-3xl md:text-4xl font-holt text-white [-webkit-text-stroke:6px_black] [letter-spacing:0.05em] [paint-order:stroke_fill]">
          Things We&rsquo;ve Made.
        </p>
      </div>

      {featured.length > 0 && (
        <div className="flex flex-col md:flex-row justify-center items-start gap-10 md:gap-8 px-6 md:px-12 pt-12">
          {featured.map((project, i) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="w-full md:w-64 flex flex-col items-start group"
            >
              <div className="relative w-full aspect-square">
                <div
                  className={`absolute z-20 w-16 h-5 outline-2 outline-black ${TAPES[i % TAPES.length]}`}
                />
                <div className="absolute inset-0 outline-3 outline-black overflow-hidden">
                  {project.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
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
        {/* Decorative maker doodles (pulled from maker-club-art) in the corners. */}
        {/* eslint-disable @next/next/no-img-element */}
        <img
          src="/doodle-pen-nib.png"
          alt=""
          aria-hidden
          className="pointer-events-none select-none absolute -bottom-2 left-1 hidden h-24 w-auto rotate-6 md:block lg:left-6 lg:h-32"
        />
        <img
          src="/doodle-soldering-iron.png"
          alt=""
          aria-hidden
          className="pointer-events-none select-none absolute bottom-0 right-8 hidden h-56 w-auto md:block lg:right-16 lg:h-72"
        />
        <img
          src="/doodle-pliers.png"
          alt=""
          aria-hidden
          className="pointer-events-none select-none absolute -bottom-3 -right-1 hidden h-28 w-auto md:block lg:h-36"
        />
        {/* eslint-enable @next/next/no-img-element */}

        <p className="relative z-10 text-lg md:text-xl font-bold text-center text-black">
          Got something you&rsquo;d like to share? We&rsquo;d love to see it!
        </p>
        <Link
          href="/submit"
          className="relative z-10 rounded-full px-6 py-2 font-semibold border-2 border-black shadow-[2px_2px_0px_0px_#000] bg-pop-pink text-white text-lg md:text-xl"
        >
          Submit a Project
        </Link>
      </div>
    </div>
  );
}

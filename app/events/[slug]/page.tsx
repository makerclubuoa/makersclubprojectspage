import TimelineSection from "@/app/components/homepage/TimelineSection";
import placeholder from "@/public/placeholder.png";
import { getEvent } from "@/lib/ghost/event";
import { getYearTimeline } from "@/lib/ghost/timeline";
import Image from "next/image";
import JoinSection from "@/app/components/homepage/JoinSection";
import Footer from "@/app/components/Footer";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (event.title == "No title provided.") {
    return {
      title: "Post Not Found",
    };
  }
  return {
    title: `${event.title} | Maker Club`,
    icons: { icon: "/logoNew.png" },
    description: event.excerpt,
  };
}

export default async function Event({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);
  const timelines = await getYearTimeline();

  return (
    <div>
      <div className="h-dvh w-full">
        <div className=" min-h-[30rem] h-1/3 xl:h-1/2 w-full flex flex-col justify-center">
          <div className="w-full min-h-[30rem] h-1/3 xl:h-1/2 absolute border-b-4">
            <Image
              src={event.src ?? placeholder}
              alt="Background."
              fill
              sizes="100vh"
              className="blur-[3.5px] brightness-75 object-cover -z-10"
            />
            <Image
              src={event.src ?? placeholder}
              alt="Background."
              fill
              sizes="100vh"
              className="brightness-75 object-cover -z-20"
            />
          </div>
          <div className=" p-16">
            <p className="font-semibold text-white text-shadow-lg">
              {event.date}
            </p>
            <p className="font-semibold text-white text-shadow-lg">
              {event.location}
            </p>
            <p
              className={`font-bold text-4xl md:text-5xl font-holt
          text-shadow-lg [-webkit-text-stroke:6px_black] [paint-order:stroke_fill] text-white`}
            >
              {event.title}
            </p>
            <p className="max-w-[150rem] font-semibold text-white text-shadow-lg text-md lg:text-lg">
              {event.excerpt}
            </p>
          </div>
        </div>
        <div className="w-full flex justify-center">
          <div className="py-10 px-20 md:w-3/4">
            <div
              className="ghost-content"
              dangerouslySetInnerHTML={{ __html: event.html }}
            ></div>
          </div>
        </div>
        <div className="mt-10">
          <div className="flex-col border-y-4 min-h-36 flex jusitfy-center bg-pop-pink py-10 px-5 md:px-10">
            <p
              className="font-bold text-4xl md:text-5xl font-holt
          text-shadow-lg [-webkit-text-stroke:6px_black] [paint-order:stroke_fill] text-white"
            >
              Future Events Timeline
            </p>
          </div>
          <TimelineSection timelines={timelines} />
          <div className="h-[50dvh]">
            <JoinSection />
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}

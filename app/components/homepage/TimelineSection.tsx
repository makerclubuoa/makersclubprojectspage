"use client";
import { TimelineType } from "@/lib/ghost/timeline";
import TimelineItem from "./TimelineItem";
import useScreenSize from "@/app/hooks/useScreenSize";
import Image from "next/image";

interface TimelineSectionProps {
  timelines: TimelineType[];
}

export default function TimelineSection({ timelines }: TimelineSectionProps) {
  const screenSize = useScreenSize();

  return (
    <div
      className={`outline-3 flex flex-col relative pt-5 mt-20 md:mt-40 lg:mt-26 md:pt-10 bg-grad h-full ${screenSize <= 768 ? `h-[120%]` : ""}`}
    >
      <Image
        src={"screentone.svg"}
        height={3000}
        width={3000}
        alt=""
        className="
                opacity-50 absolute -bottom-0 left-1/2 overflow-hidden
          [filter:brightness(0)_saturate(100%)_invert(43%)_sepia(92%)_saturate(3035%)_hue-rotate(320deg)_brightness(102%)_contrast(103%)]
            
        "
      />
      <Image
        src={"screentone.svg"}
        height={3000}
        width={3000}
        alt=""
        className="
                opacity-50 absolute top-0 right-1/2 
          [filter:brightness(0)_saturate(100%)_invert(43%)_sepia(92%)_saturate(3035%)_hue-rotate(320deg)_brightness(102%)_contrast(103%)]
            
        "
      />
      <div
        style={{
          gridTemplateRows: `repeat(${timelines.length}, minmax(0, 1fr))`,
        }}
        className={`${screenSize <= 768 ? `grid grid-cols-1 relative gap-y-10 mx-10 pb-10` : `justify-center pt-5 grid grid-cols-2 min-w-36 gap-x-36 relative z-10 `}`}
      >
        {timelines.map((timeline, index) => {
          return (
            <TimelineItem
              index={index + 1}
              key={timeline.date}
              name={timeline.name}
              date={timeline.date}
              description={timeline.description}
            />
          );
        })}
        <div
          className={`z-5 absolute left-1/2 h-full w-1 rounded-full -translate-x-1/2 bg-black overflow-visible`}
        ></div>
        <div className="z-5 absolute left-1/2 h-full w-2 -translate-x-1/2 overflow-visible flex flex-col items-center ">
          <div className="self-start top-1/3 overflow-visible sticky rounded-full h-2 w-2 outline-3 bg-pop-pink"></div>
        </div>
      </div>
      <div className="z-10 pt-20 pb-10 flex w-full items-center justify-center text-2xl text-white font-holt">
        <p>And many more to come!</p>
      </div>
    </div>
  );
}

import Image, { StaticImageData } from "next/image";
import placeholder from "@/public/placeholder.png";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

export const tapeMappings = {
  popViolet: {
    colour: "pop-violet",
    rotation: "-20deg",
    position: "top-0",
  },
  popPink: {
    colour: "pop-pink",
    rotation: "-20deg",
    position: "top-0",
  },
  popRed: {
    colour: "pop-red",
    rotation: "20deg",
    position: "bottom-0 right-0",
  },
  popOrange: {
    colour: "pop-orange",
    rotation: "30deg",
    position: "right-0",
  },
  popMagenta: {
    colour: "pop-magenta",
    rotation: "30deg",
    position: "bottom-0 right-0",
  },
  popBlue: {
    colour: "pop-blue",
    rotation: "20deg",
    position: "top-0",
  },
} as const;
export interface PhotoProps {
  src: string | StaticImageData;
  alt?: string;
  rotation?: number;
  tape?: keyof typeof tapeMappings;
  link?: string;
  typeOverride?: string;
}

// Width-driven square, not height-driven. The frame's only child is absolutely
// positioned, so it has no in-flow content — which made the old `w-fit` collapse
// to the width of its padding while `h-72` held the height at 288px, rendering
// the photo as a tall sliver. Sizing from the width also means the frame simply
// shrinks on a narrow phone instead of overflowing it.
const FRAME = "relative mx-auto w-full max-w-72 aspect-square";

export default function Photo({
  src,
  alt,
  rotation,
  tape,
  link,
  typeOverride,
}: PhotoProps) {
  const frame = (
    <div
      className={twMerge(FRAME, typeOverride)}
      style={rotation ? { transform: `rotate(${rotation}deg)` } : undefined}
    >
      <div
        className={`absolute -top-1 -left-4 z-10 w-16 h-5 ${tape ? `border-2 bg-${tapeMappings[tape].colour} ${tapeMappings[tape].position}` : ""} `}
        style={{
          transform: `${tape !== undefined ? `rotate(${tapeMappings[tape].rotation})` : ``}`,
        }}
      ></div>
      <div className="absolute inset-0 p-5 outline-3">
        {/* TODO: make this more accessible */}
        <Image
          src={src !== "" ? src : placeholder}
          fill
          sizes="(max-width: 640px) 90vw, 288px"
          className="object-cover"
          alt={alt ?? "Image of a recent event."}
        />
      </div>
    </div>
  );

  // The link wrapper needs its own width, or as a shrink-to-fit flex item it
  // gives the frame's `w-full` nothing to resolve against.
  if (link) {
    return (
      <Link href={link} className="block w-full">
        {frame}
      </Link>
    );
  }

  return frame;
}

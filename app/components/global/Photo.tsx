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
export default function Photo({
  src,
  alt,
  rotation,
  tape,
  link,
  typeOverride,
}: PhotoProps) {
  if (link) {
    return (
      <Link href={link}>
        <div
          className={twMerge("w-fit h-72 aspect-square relative", typeOverride)}
          style={{ transform: `rotate(${rotation}deg)` }}
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
              className="object-cover"
              alt={alt ?? "Image of an event."}
            />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div
      className={twMerge("w-fit h-72 aspect-square relative", typeOverride)}
      style={{ transform: `rotate(${rotation}deg)` }}
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
          src={src}
          fill
          className="object-cover"
          alt={alt ?? "Image of a recent event."}
        />
      </div>
    </div>
  );
}

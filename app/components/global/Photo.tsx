import Image, { StaticImageData } from "next/image";

export const tapeMappings = {
  popViolet: {
    colour: "pop-violet",
    rotation: "-20deg",
    position: "top-0",
  },
  popPink: {
    colour: "pop-pink",
    rotation: "1.5deg",
    position: "top-0 left-1/2",
  },
  popRed: { colour: "pop-red", rotation: "1.5deg", position: "top-0 left-1/2" },
  popOrange: {
    colour: "pop-orange",
    rotation: "1.5deg",
    position: "top-0 left-1/2",
  },
  popMagenta: {
    colour: "pop-magenta",
    rotation: "1.5deg",
    position: "top-0 left-1/2",
  },
  popBlue: {
    colour: "pop-blue",
    rotation: "1.5deg",
    position: "top-0 left-1/2",
  },
} as const;

export interface PhotoProps {
  src: string | StaticImageData;
  alt: string;
  rotation?: number;
  tape?: keyof typeof tapeMappings;
  randomTape?: boolean;
  typeOverride?: string;
}

export default function Photo({
  src,
  alt,
  rotation,
  tape,
  randomTape,
  typeOverride,
}: PhotoProps) {
  return (
    <div
      className={`w-fit h-72 aspect-square relative`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <div
        className={`absolute -top-1 -left-4 z-10 w-16 h-5 ${tape ? `bg-${tapeMappings[tape].colour} ${tapeMappings[tape].position}` : ""} `}
        style={{
          transform: `${tape !== undefined ? `rotate(${tapeMappings[tape].rotation})` : ``}`,
        }}
      ></div>
      <div className="absolute inset-0 p-5 outline-3">
        <Image src={src} fill className="object-cover" alt={alt} />
      </div>
    </div>
  );
}

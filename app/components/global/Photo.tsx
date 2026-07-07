import { StaticImport } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";
import Link from "next/link";

const tapeClasses = {
  violet: "relative bg-pop-violet top-0 right-0 rotation-[25deg]",
  pink: "relative bg-pop-pink top-0 right-0 rotation-[25deg]",
  magenta: "relative bg-pop-magenta top-0 right-0 rotation-[25deg]",
  orange: "relative bg-pop-orange top-0 right-0 rotation-[25deg]",
  blue: "relative bg-pop-blue top-0 right-0 rotation-[25deg]",
  red: "relative bg-pop-red top-0 right-0 rotation-[25deg]",
} as const;

type Tape = keyof typeof tapeClasses;

export interface PhotoProps {
  src: string | StaticImport;
  alt: string;
  rotation?: number;
  link?: string;
  typeOverride?: string;
  tape?: Tape;
}

export default function Photo({
  src,
  alt,
  link,
  rotation,
  typeOverride,
  tape,
}: PhotoProps) {
  if (link !== undefined)
    return (
      <Link href={link} className="block">
        <div
          style={{ transform: `rotate(${rotation ? rotation : 0}deg)` }}
          className={`outline-black outline-3 w-4/5 h-6/8 min-h-64 px-3 relative ${typeOverride ?? typeOverride}`}
        >
          <Image src={src} layout="fill" objectFit="cover" alt={alt} />
        </div>
      </Link>
    );
  return (
    <div
      style={{ transform: `rotate(${rotation ? rotation : 0}deg)` }}
      className={`outline-black outline-3 aspect-square min-h-64 min-w-64 w-1/3 max-w-80 px-3 relative ${typeOverride ?? typeOverride}`}
    >
      <Image src={src} layout="fill" objectFit="cover" alt={alt} />
    </div>
  );
}

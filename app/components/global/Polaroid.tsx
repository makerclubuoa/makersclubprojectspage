"use client";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import Image, { StaticImageData } from "next/image";

interface PolaroidPropsType {
  src: string | StaticImport;
  description?: string;
  onClick(): void | undefined;
}

export default function Polaroid({
  src,
  description,
  onClick,
}: PolaroidPropsType) {
  return (
    <div
      className="min-h-96 w-1/2 md:max-w-96 bg-outline-gray-100 shadow-2xl outline-gray-200 outline-3 flex flex-col items-center pt-7"
      onClick={onClick}
    >
      <div className="outline-gray-200 outline-3 w-4/5 h-6/8 px-3 relative">
        <Image src={src} layout="fill" objectFit="cover" alt="" />
      </div>
      {description !== undefined ? (
        <div className="w-full flex  justify-center items-center pt-2 grow ">
          <p className="text-3xl font-semibold">{description}</p>
        </div>
      ) : null}
    </div>
  );
}

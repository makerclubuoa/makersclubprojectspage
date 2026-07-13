"use client";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import Image, { StaticImageData } from "next/image";

interface PolaroidPropsType {
  src: string | StaticImport;
  description?: string;
  onClick?: () => void;
  typeOverride?: string;
  children?: React.ReactNode;
}

export default function Polaroid({
  src,
  description,
  onClick,
  typeOverride,
  children,
}: PolaroidPropsType) {
  return (
    <div
      className={`min-h-90 md:min-h-96 w-80 md:w-1/2 md:max-w-80 bg-outline-gray-100 bg-white shadow-2xl outline-gray-200 outline-3 flex flex-col items-center pt-7 relative ${typeOverride ? typeOverride : ""}`}
      onClick={onClick}
    >
      <div className="bg-red-200 -z-10">{children}</div>
      <div className="outline-gray-200 outline-3 w-4/5 h-6/8 bg-red-100 min-h-64 px-3 relative">
        <Image src={src} layout="fill" objectFit="cover" alt="" />
      </div>
      {description !== undefined ? (
        <div className="w-full flex justify-center items-center pt-2 grow ">
          <p className="text-2xl font-semibold text-center">{description}</p>
        </div>
      ) : null}
    </div>
  );
}

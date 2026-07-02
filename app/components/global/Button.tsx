"use client";
interface ButtonPropsType {
  textColour?: string;
  bgColour?: string;
  type?: "solid" | "comic";
  onClick(): void;
  typeOverride?: string;
  children: React.ReactNode;
}

export default function Button({
  textColour,
  bgColour,
  type,
  onClick,
  typeOverride,
  children,
}: ButtonPropsType) {
  return (
    <button
      className={`rounded-full px-5 py-0.5 lg:px-7 lg:py-1 font-semibold border-2 border-black ${type !== "solid" ? `shadow-[2px_2px_0px_0px_#000]` : ""} bg-white bg-${bgColour} text-${textColour} text-lg md:text-xl lg:text-2xl ${typeOverride}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

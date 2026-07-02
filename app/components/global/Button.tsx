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
      className={`rounded-full px-3 font-semibold border-2 border-black ${type !== "solid" ? `shadow-[1.5px_1.5px_0px_0px_#000]` : ""} bg-${bgColour} text-${textColour} ${typeOverride}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

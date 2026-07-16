import Link from "next/link";
import { twMerge } from "tailwind-merge";
interface LinkButtonPropsType {
  textColour?: string;
  bgColour?: string;
  type?: "solid" | "comic";
  link: string;
  typeOverride?: string;
  children: React.ReactNode;
}
export default function LinkButton({
  textColour,
  bgColour,
  type,
  link,
  typeOverride,
  children,
}: LinkButtonPropsType) {
  return (
    <Link
      className={twMerge(
        `
          rounded-full
          px-5 py-0.5
          lg:px-7 lg:py-1
          font-semibold
          border-2 border-black
          ${type !== "solid" ? "shadow-[2px_2px_0px_0px_#000]" : ""}
          ${bgColour ? `bg-${bgColour}` : "bg-white"}
          ${textColour ? `text-${textColour}` : "text-black"}
          text-lg md:text-xl lg:text-2xl
        `,
        typeOverride,
      )}
      href={link}
    >
      {children}
    </Link>
  );
}

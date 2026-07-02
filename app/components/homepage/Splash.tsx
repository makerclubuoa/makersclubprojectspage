import Image from "next/image";

export default function Splash() {
  return (
    <div className="h-dvh w-full bg-grad flex flex-col justify-center items-center gap-0 p-0">
      <div className="flex flex-col items-center">
        <Image
          src={"maker-club-logo.svg"}
          alt="Maker Club logo."
          className=""
          width={120}
          height={120}
        />
        <p className="text-white text-4xl font-bold pb-5">Maker Club</p>
        <p className="text-white text-lg font-semibold text-center w-3/4">
          {`We're gathering makers to create ideas together. If you design, crochet, cook, code, or like creating new things, then we're here for you.`}
        </p>
      </div>
    </div>
  );
}

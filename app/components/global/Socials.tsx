import Image from "next/image";
import Link from "next/link";
import instagram from "@/public/instagram.svg";
import discord from "@/public/discord.svg";

export default async function Socials() {
  return (
    <div className="mb-3 flex gap-3 items-center min-h-5 max-h-5 md:min-h-10 md:max-h-10">
      <Link href="https://www.instagram.com/make.uoa/">
        <div className="relative aspect-square min-h-5 md:min-h-8">
          <Image
            src={instagram}
            fill
            className="object-cover"
            alt="Instragram logo linking to Maker Club's page."
          />
        </div>
      </Link>
      <Link href="https://discord.gg/67GaUhQTE2">
        <div className="relative aspect-square min-h-7 md:min-h-10">
          <Image
            src={discord}
            fill
            className="object-contain"
            alt="Discord logo linking to Maker Club's page."
          />
        </div>
      </Link>
    </div>
  );
}

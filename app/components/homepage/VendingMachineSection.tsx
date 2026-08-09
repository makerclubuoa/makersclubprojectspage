import Polaroid from "../global/Polaroid";
import placeholder from "@/public/placeholder.png";
import type { IGetRandomProductRes } from "@/lib/stripe";
import LinkButton from "../global/LinkButton";

export default function VendingMachineSection({
  product,
}: {
  product: IGetRandomProductRes;
}) {
  return (
    <div className="relative outline-3 outline-black py-10 bg-pop-pink md:pb-20">
      <p className="px-5 md:px-10 text-3xl md:text-4xl font-holt text-white pb-0 mb-8 md:mb-10 [-webkit-text-stroke:3px_black] md:[-webkit-text-stroke:6px_black] [letter-spacing:0.05em] [paint-order:stroke_fill]">
        Support Small Creators
      </p>

      {/* One CSS-responsive layout rather than two branches picked by a
          useScreenSize() hook. The hook reports 0 until after mount, so every
          desktop load rendered the mobile arrangement first and then jumped. */}
      <div className="flex flex-col items-center gap-8 px-5 md:flex-row md:items-start md:justify-center md:gap-6">
        {/* Photo leads on mobile, sits to the right on desktop. */}
        <div className="order-first w-full max-w-80 md:order-last md:shrink-0">
          <Polaroid
            src={product.src ?? placeholder}
            onClick={undefined}
            typeOverride="rotate-5"
          />
        </div>

        <div className="w-full md:w-2/3 md:pr-5 lg:pr-15 text-lg lg:text-2xl font-semibold flex flex-col justify-center text-white">
          <p>
            {`We provide a space for Makers to sell things they’ve created via our Vending Machine (located at the University of Auckland Makerspace).`}
            <br />
            <br />
            {`Items here are sold with 100% of proceeds after transaction fees going to the creator, charity, or a university club.`}
            <br />
            <br />
            {`Check out what we have in store below!`}
          </p>
          <div className="pt-4 lg:pt-5 flex flex-col items-stretch gap-2 sm:flex-row sm:items-start">
            <LinkButton link="/vending" typeOverride="text-center">
              See What&apos;s in Stock!
            </LinkButton>
            <LinkButton link="/wares" typeOverride="text-center">
              Apply to Sell
            </LinkButton>
          </div>
        </div>
      </div>
    </div>
  );
}

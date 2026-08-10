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
    <div className="relative outline-3 outline-black py-10 bg-pop-pink md:pb-20 ">
      <p className="pl-10 text-4xl font-holt text-white pb-0 mb-10 [-webkit-text-stroke:6px_black] [letter-spacing:0.05em] [paint-order:stroke_fill]">
        Support Small Creators
      </p>
      <div className="md:hidden w-full flex flex-col items-center">
        <Polaroid
          src={product.src ?? placeholder}
          typeOverride="rotate-5 absolute"
          onClick={undefined}
        ></Polaroid>
        <div className="pt-14 w-2/3 pr-5 lg:pr-20 text-lg lg:text-2xl font-bold flex justify-center flex-col text-white">
          <p>
            {`We provide a space for Makers to sell things they’ve created via our Vending Machine (located at the University of Auckland Makerspace).`}
            <br />
            <br />
            {`Items here are sold with 100% of proceeds after transaction fees going to the creator, charity, or a university club.`}
            <br />
            <br />
            {`Check out what we have in store below!`}
          </p>
          <div className="items-center sm:items-start pt-3 lg:pt-5 flex flex-col sm:flex-row gap-2">
            <LinkButton link="https://vend.makeuoa.nz/">
              See What's in Stock!
            </LinkButton>
            <LinkButton link="/wares">Apply to Sell</LinkButton>
          </div>
        </div>
      </div>
      <div className="hidden md:flex flex-row justify-center relative gap-1 px-5 ">
        <div className="w-2/3 pr-5 lg:pr-15 text-lg lg:text-2xl font-semibold flex justify-center flex-col text-white">
          <p>
            {`We provide a space for Makers to sell things they’ve created via our Vending Machine (located at the University of Auckland Makerspace).`}
            <br />
            <br />
            {`Items here are sold with 100% of proceeds after transaction fees going to the creator, charity, or a university club.`}
            <br />
            <br />
            {`Check out what we have in store below!`}
          </p>
          <div className="mr-5 pt-3 lg:pt-5 flex flex-col md:flex-row gap-2">
            <LinkButton link="https://vend.makeuoa.nz/">
              See What's in Stock!
            </LinkButton>
            <LinkButton link="/wares">Apply to Sell</LinkButton>
          </div>
        </div>
        <Polaroid
          src={product.src ?? placeholder}
          onClick={undefined}
          typeOverride="mr-5 rotate-5 absolute"
        />
      </div>
    </div>
  );
}

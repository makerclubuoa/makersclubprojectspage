"use client";
import Button from "../global/Button";
import Polaroid from "../global/Polaroid";
import art from "@/public/maker-club-art.png";
import Header from "./Header";
import useScreenSize from "@/app/hooks/useScreenSize";
import Image from "next/image";

export default function VendingMachineSection() {
  const screenSize = useScreenSize();
  return (
    <div className="outline-3 outline-black py-10 bg-pop-pink md:pb-20 ">
      <p className="text-4xl font-holt text-white pl-10 pb-0 mb-10 [-webkit-text-stroke:6px_black] [letter-spacing:0.05em] [paint-order:stroke_fill]">
        Support Small Creators
      </p>
      {screenSize <= 768 ? (
        <div className="w-full flex flex-col items-center">
          <Polaroid
            src={art}
            typeOverride="rotate-5 absolute"
            onClick={undefined}
            description="hi"
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
              <Button onClick={() => {}} typeOverride="z-10 relative">
                See What's in Stock!
              </Button>
              <Button onClick={() => {}} typeOverride="z-10 relative">
                Apply to Sell
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-row justify-center relative gap-1 px-5 ">
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
              <Button onClick={() => {}} typeOverride="z-10 relative">
                See What's in Stock!
              </Button>
              <Button onClick={() => {}} typeOverride="z-10 relative">
                Apply to Sell
              </Button>
            </div>
          </div>
          <Polaroid
            src={art}
            onClick={undefined}
            description="hi"
            typeOverride="mr-5 rotate-5 absolute"
          />
        </div>
      )}
    </div>
  );
}

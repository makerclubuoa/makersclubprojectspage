export default function Wares() {
  return (
    <div className="bg-pop-blue">
      <div className="pt-20">
        <div className="flex-col border-y-4 bg-white min-h-36 flex justify-center py-10 px-5 md:px-10">
          <p
            className="font-bold text-4xl md:text-5xl font-holt
          text-shadow-lg [-webkit-text-stroke:3px_black] md:[-webkit-text-stroke:6px_black] [paint-order:stroke_fill] text-blue-300"
          >
            Sell Your Wares!
          </p>
        </div>
      </div>
      <div className="py-10 md:py-20 flex items-center w-full justify-center">
        <div className="border-y-4 md:w-2/3 md:border-4 w-full bg-white">
          <iframe
            title="Apply to sell in the Maker Club vending machine"
            src="https://auckland.au1.qualtrics.com/jfe/form/SV_bwrqibZ1CedTN4O"
            className="block w-full h-[150dvh] md:h-dvh"
          ></iframe>
        </div>
      </div>
    </div>
  );
}

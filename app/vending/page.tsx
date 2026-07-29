import Link from "next/link";
import { getVendableProducts } from "@/lib/vending";
import VendingProducts from "@/app/components/vending/VendingProducts";
import { pageBand, pageBandTitle, pageBandSub } from "@/lib/ui";

export default async function VendingPage() {
  const products = await getVendableProducts().catch(() => []);

  return (
    <div className="bg-pop-pink min-h-dvh">
      <div className="pt-20">
        <div className={pageBand}>
          <p className={`${pageBandTitle} text-pop-pink`}>Vending Machine!</p>
          <p className={`${pageBandSub} max-w-[75ch]`}>
            Welcome to the Maker Club&apos;s vending machine, located at the
            University of Auckland Makerspace. We&apos;re providing a space for
            makers to sell things they&apos;ve created — items here are sold
            with 100% of proceeds after transaction fees going to the creator,
            charity, or a university club.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 pt-10 px-5">
        <a
          href="#items"
          className="rounded-full px-5 py-0.5 lg:px-7 lg:py-1 font-semibold border-2 border-black shadow-[2px_2px_0px_0px_#000] bg-white text-black text-lg md:text-xl lg:text-2xl"
        >
          View Items ↓
        </a>
        <Link
          href="/wares"
          className="rounded-full px-5 py-0.5 lg:px-7 lg:py-1 font-semibold border-2 border-black shadow-[2px_2px_0px_0px_#000] bg-pop-violet text-white text-lg md:text-xl lg:text-2xl"
        >
          Apply to Sell
        </Link>
      </div>

      <div id="items" className="scroll-mt-24 py-14">
        <VendingProducts products={products} />
      </div>
    </div>
  );
}

import Button from "../components/global/Button";
import Header from "../components/homepage/Header";
import MovingText from "../components/homepage/MovingText";
import Splash from "../components/homepage/Splash";

export default function Test() {
  return (
    <>
      <Splash />
      <div className="relative z-10 pb-1.5">
        <MovingText />
      </div>
      <Header
        text="What's New?"
        rotation={-1.5}
        typeOverride="h-15"
        bgColour="pop-pink"
        colour="white"
      />
    </>
  );
}

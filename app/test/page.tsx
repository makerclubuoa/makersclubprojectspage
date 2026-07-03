import Button from "../components/global/Button";
import Header from "../components/homepage/Header";
import Splash from "../components/homepage/Splash";

export default function Test() {
  return (
    <>
      <Splash />
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

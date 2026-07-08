import Photo, { tapeMappings } from "../global/Photo";
import Header from "./Header";
import art from "../../../public/maker-club-art-colour.png";
import PinnedPostSnippet from "../global/PinnedPostSnippet";

export default function WhatsNewSection() {
  return (
    <div className="pb-10">
      <Header
        text="What's New?"
        rotation={-1.5}
        typeOverride="relative -top-10 lg:-top-3 h-20 pl-5 md:pl-10"
        bgColour="pop-pink"
        colour="white"
      />
      <div className="flex justify-center">
        <div className="w-full items-center md:items-stretch  md:w-3/4 px-20 md:px-5 pt-1 md:pt-3 lg:pt-10 flex  flex-col md:flex-row gap-10">
          <Photo src={art} alt="" rotation={2.3} tape="popViolet" />
          <PinnedPostSnippet />
        </div>
      </div>
    </div>
  );
}

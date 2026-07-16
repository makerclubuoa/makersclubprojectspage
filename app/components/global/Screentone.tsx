import Image from "next/image";

export default function Screentone() {
  return (
    <Image
      src="/screentone.svg"
      fill
      alt=""
      className="[filter:brightness(0)_saturate(100%)_invert(43%)_sepia(92%)_saturate(3035%)_hue-rotate(320deg)_brightness(102%)_contrast(103%)]
        opacity-15 absolute scale-150 object-cover"
    />
  );
}

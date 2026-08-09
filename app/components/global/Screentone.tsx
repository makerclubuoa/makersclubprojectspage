import Image from "next/image";

/**
 * Decorative halftone dots filling the nearest positioned ancestor.
 *
 * The image is scaled up past its box, so it has to be clipped — but it clips
 * itself here rather than making callers put `overflow-hidden` on the card.
 * That used to be the login form's job, and it also sliced the "Members area"
 * sticker, which is positioned to overhang the card's top edge on purpose.
 */
export default function Screentone() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <Image
        src="/screentone.svg"
        fill
        alt=""
        className="[filter:brightness(0)_saturate(100%)_invert(43%)_sepia(92%)_saturate(3035%)_hue-rotate(320deg)_brightness(102%)_contrast(103%)]
          opacity-15 absolute scale-150 object-cover"
      />
    </span>
  );
}

interface HeaderPropsType {
  text: string;
  rotation: number;
  bgColour?: string;
  colour?: string;
  typeOverride?: string;
  textTypeOverride?: string;
}
export default function Header({
  text,
  rotation,
  bgColour,
  colour,
  typeOverride,
  textTypeOverride,
}: HeaderPropsType) {
  return (
    // max-md:h-auto is deliberately in the base rather than at each call site:
    // callers pass a hard `h-20`, and a title long enough to wrap on a phone
    // was being cut in half by overflow-y-clip. Variant utilities sort after
    // plain ones, so this wins below md without needing `!`.
    <div
      className={`overflow-x-hidden overflow-y-clip bg-${bgColour} text-${colour} ${typeOverride} max-md:h-auto max-md:min-h-20 max-md:py-4 flex items-center w-full md:w-[110%] content-stretch border-y-4 border-black [letter-spacing:0.1em] xl:p-12`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <p
        className={`font-bold text-2xl sm:text-3xl md:text-4xl font-holt
            text-shadow-lg [-webkit-text-stroke:3px_black] md:[-webkit-text-stroke:6px_black] [paint-order:stroke_fill] ${textTypeOverride} pr-5`}
      >
        {text}
      </p>
    </div>
  );
}

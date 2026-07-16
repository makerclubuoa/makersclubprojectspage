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
    <div
      className={`overflow-x-hidden bg-${bgColour} text-${colour} ${typeOverride} flex items-center w-full md:w-[110%] content-stretch border-y-4 border-black [letter-spacing:0.1em] xl:p-12`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <p
        className={`font-bold text-3xl md:text-4xl font-holt
            text-shadow-lg [-webkit-text-stroke:6px_black] [paint-order:stroke_fill] ${textTypeOverride} pr-5`}
      >
        {text}
      </p>
    </div>
  );
}

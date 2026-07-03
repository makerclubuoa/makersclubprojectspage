interface HeaderPropsType {
  text: string;
  rotation: number;
  bgColour?: string;
  colour?: string;
  typeOverride?: string;
}
export default function Header({
  text,
  rotation,
  bgColour,
  colour,
  typeOverride,
}: HeaderPropsType) {
  return (
    <div
      className={`bg-${bgColour} text-${colour} ${typeOverride} flex items-center w-[110%] overflow-hidden content-stretch outline-solid outline-3 outline-black`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <p
        className="font-bold text-4xl pl-12 font-holt
          [-webkit-text-stroke:1.4px_black]"
      >
        {text}
      </p>
    </div>
  );
}

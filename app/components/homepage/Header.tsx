interface HeaderPropsType {
  text: string;
  rotation: number;
  bgColour?: string;
  colour?: string;
  typeOverride?: string;
}
export default async function Header({
  text,
  rotation,
  bgColour,
  colour,
  typeOverride,
}: HeaderPropsType) {
  return (
    <div
      className={`bg-${bgColour} text-${colour} ${typeOverride} flex items-center font-bold text-2xl pl-3`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {text}
    </div>
  );
}

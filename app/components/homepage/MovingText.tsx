const textElements = [
  "3D PRINTING",
  "SEWING",
  "PAINTING",
  "CROCHET",
  "CODING",
  "DESIGN",
  "CRAFTING",
];

export default async function MovingText() {
  return (
    <div className="bg-pop-violet text-white font-holt flex overflow-hidden gap-0 scrollbar-none outline-black outline-3 z-10">
      <div className="flex justify-around w-max gap-1 shrink-0 animate-linearSpin">
        {textElements.map((element) => {
          return (
            <div
              className="text-2xl p-3 flex-nowrap grow-0 shrink-0 basis-auto"
              key={element}
            >
              {element}
            </div>
          );
        })}
      </div>
      <div className="flex justify-around w-max gap-1 shrink-0 animate-linearSpin">
        {textElements.map((element) => {
          return (
            <div
              className="text-2xl p-3 flex-nowrap grow-0 shrink-0 basis-auto"
              key={element}
            >
              {element}
            </div>
          );
        })}
      </div>
      <div className="flex justify-around w-max gap-1 shrink-0 animate-linearSpin">
        {textElements.map((element) => {
          return (
            <div
              className="text-2xl p-3 flex-nowrap grow-0 shrink-0 basis-auto"
              key={element}
            >
              {element}
            </div>
          );
        })}
      </div>
    </div>
  );
}

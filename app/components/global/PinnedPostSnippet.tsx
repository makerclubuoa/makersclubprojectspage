export default async function PinnedPostSnippet() {
  return (
    <div className="min-h-52 bg-white justify-center outline-black relative w-full outline-3 lg:items-center">
      <div className="absolute w-15 h-5 bg-pop-blue -right-5 -bottom-1 -rotate-[25deg]"></div>
      <div className="absolute w-15 h-5 bg-pop-magenta -top-1 -left-5 -rotate-[18deg]"></div>
      <div className="flex flex-col justify-center h-full px-5">
        <p className="text-md font-medium">date</p>
        <p
          className="[letter-spacing:0.01em] text-white font-bold text-3xl md:text-4xl font-holt
          text-shadow-lg [-webkit-text-stroke:6px_black] [paint-order:stroke_fill] "
        >
          Name
        </p>
        <p className="text-lg font-semibold">desc</p>
      </div>
    </div>
  );
}

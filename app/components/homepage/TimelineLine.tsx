import TimelineDot from "./TimelineDot";
export default async function TimelineLine() {
  return (
    <div class="flex relative items-center w-full">
      <TimelineDot />
      <hr class="flex-grow border-t border-gray-300" />
    </div>
  );
}

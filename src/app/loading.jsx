export default function Loading() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[999999] h-[3px] bg-slate-100 overflow-hidden">
      <div className="h-full w-full bg-gradient-to-r from-[#0A66C2] via-blue-500 to-amber-500 animate-pulse" />
    </div>
  );
}

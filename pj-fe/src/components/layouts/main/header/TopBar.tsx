export default function TopBar() {
  return (
    <div className="hidden border-b border-white/10 bg-[#132744] py-2 text-sm font-bold text-white md:block">
      <div className="mx-auto max-w-[1500px] px-4 md:px-6">
        <div className="flex flex-row items-center justify-between gap-4">
          <div className="flex flex-row items-center gap-2"></div>
          <div className="flex flex-row gap-6 text-xs tracking-wider uppercase"></div>
        </div>
      </div>
    </div>
  );
}

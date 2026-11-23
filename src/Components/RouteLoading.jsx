export default function RouteLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col w-full animate-pulse">
      {/* Top subtle brand progress indicator */}
      <div className="fixed top-0 left-0 right-0 z-[999999] h-[3px] bg-slate-100 overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-[#0A66C2] via-blue-500 to-amber-500 animate-pulse" />
      </div>

      {/* Top Navbar Skeleton Placeholder */}
      <div className="h-16 w-full bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="h-8 w-32 rounded-lg bg-slate-200/80" />
          <div className="hidden md:flex items-center gap-3">
            <div className="h-7 w-20 rounded-lg bg-slate-100" />
            <div className="h-7 w-20 rounded-lg bg-slate-100" />
            <div className="h-7 w-20 rounded-lg bg-slate-100" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-100" />
          <div className="h-9 w-9 rounded-full bg-slate-200/80" />
        </div>
      </div>

      {/* Page Body Skeleton */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between pb-2">
          <div className="h-7 w-48 rounded-lg bg-slate-200/90" />
          <div className="h-9 w-32 rounded-xl bg-slate-200/80" />
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-xs border border-slate-200/80 space-y-4">
          <div className="h-10 w-full sm:w-80 rounded-xl bg-slate-100" />
          <div className="space-y-3 pt-2">
            <div className="h-16 w-full rounded-xl bg-slate-50 border border-slate-100" />
            <div className="h-16 w-full rounded-xl bg-slate-50 border border-slate-100" />
            <div className="h-16 w-full rounded-xl bg-slate-50 border border-slate-100" />
          </div>
        </div>
      </main>
    </div>
  );
}

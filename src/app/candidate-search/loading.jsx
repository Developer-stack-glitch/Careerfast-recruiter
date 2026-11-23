export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col w-full animate-pulse">
      {/* Top Navbar Skeleton Placeholder */}
      <div className="h-16 w-full bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between">
        <div className="h-8 w-32 rounded-lg bg-slate-200/80" />
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-100" />
          <div className="h-9 w-9 rounded-full bg-slate-200/80" />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="h-8 w-48 bg-slate-200/80 rounded-lg" />
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-6 shadow-xs">
          {/* Tabs skeleton */}
          <div className="flex gap-4 border-b border-slate-100 pb-3">
            <div className="h-8 w-28 bg-blue-50/80 rounded-lg" />
            <div className="h-8 w-28 bg-slate-100 rounded-lg" />
            <div className="h-8 w-28 bg-slate-100 rounded-lg" />
          </div>

          {/* Form fields skeleton */}
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-slate-200/70 rounded" />
              <div className="h-11 w-full bg-slate-100 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 w-28 bg-slate-200/70 rounded" />
                <div className="h-11 w-full bg-slate-100 rounded-xl" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-28 bg-slate-200/70 rounded" />
                <div className="h-11 w-full bg-slate-100 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

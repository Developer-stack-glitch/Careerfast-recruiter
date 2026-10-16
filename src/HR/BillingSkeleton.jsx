import React from 'react';

export const PlansSkeletonGrid = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {[...Array(4)].map((_, i) => (
                <div
                    key={i}
                    className="relative bg-white rounded-3xl border border-gray-200/90 p-6 flex flex-col justify-between space-y-6 shadow-xs animate-pulse"
                >
                    {/* Badge placeholder on the second/third card */}
                    {i === 1 && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-100 text-transparent h-6 w-28 rounded-full" />
                    )}

                    <div>
                        <div className="mb-4 space-y-3">
                            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100/50" />
                            <div className="h-5 w-32 bg-slate-200 rounded-md" />
                            <div className="space-y-1.5 pt-1">
                                <div className="h-3 w-full bg-slate-100 rounded" />
                                <div className="h-3 w-4/5 bg-slate-100 rounded" />
                            </div>
                        </div>

                        <div className="mb-5 flex items-baseline gap-2">
                            <div className="h-8 w-24 bg-slate-200 rounded-lg" />
                            <div className="h-3 w-14 bg-slate-100 rounded" />
                        </div>

                        {/* Feature check lines */}
                        <div className="space-y-2.5 border-t border-gray-100 pt-4">
                            {[85, 70, 78, 65, 80, 60].map((width, fIdx) => (
                                <div key={fIdx} className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-slate-200 shrink-0" />
                                    <div
                                        className="h-3 bg-slate-100 rounded"
                                        style={{ width: `${width}%` }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-full h-10 bg-slate-100 rounded-xl" />
                </div>
            ))}
        </div>
    );
};

const BillingSkeleton = () => {
    return (
        <div className="p-6 md:p-10 mx-auto font-sans max-w-7xl">
            {/* Header Skeleton */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100/80 flex items-center justify-center shrink-0 animate-pulse">
                        <div className="w-6 h-6 rounded bg-blue-200/70" />
                    </div>
                    <div className="space-y-1.5">
                        <div className="h-6 w-64 bg-slate-200 rounded-lg animate-pulse" />
                        <div className="h-4 w-96 max-w-full bg-slate-100 rounded animate-pulse" />
                    </div>
                </div>
                <div className="w-28 h-7 bg-emerald-50 border border-emerald-100 rounded-full animate-pulse self-start sm:self-auto shrink-0" />
            </div>

            {/* Dynamic Status Banner Skeleton */}
            <div className="mb-8 relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/10 border-[1.5px] border-white/25 rounded-2xl flex items-center justify-center shrink-0 shadow-inner animate-pulse">
                            <div className="w-8 h-8 rounded-lg bg-white/20" />
                        </div>
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-2">
                                <div className="h-7 w-44 bg-white/30 rounded-lg animate-pulse" />
                                <div className="h-5 w-16 bg-white/25 rounded-full animate-pulse" />
                            </div>
                            <div className="h-4 w-72 max-w-full bg-white/20 rounded animate-pulse" />
                            <div className="flex flex-wrap gap-2.5 pt-1">
                                <div className="h-6 w-32 bg-white/15 rounded-lg border border-white/15 animate-pulse" />
                                <div className="h-6 w-36 bg-white/15 rounded-lg border border-white/15 animate-pulse" />
                            </div>
                        </div>
                    </div>
                    <div className="h-10 w-48 bg-white/25 rounded-xl border border-white/20 animate-pulse shrink-0 self-start md:self-auto" />
                </div>
            </div>

            {/* Quota & Real-time Balances Skeleton */}
            <div className="mb-10 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
                    <div className="space-y-1.5">
                        <div className="h-5 w-72 max-w-full bg-slate-200 rounded animate-pulse" />
                        <div className="h-3.5 w-96 max-w-full bg-slate-100 rounded animate-pulse" />
                    </div>
                    <div className="h-6 w-40 bg-blue-50 border border-blue-100 rounded-lg animate-pulse self-start sm:self-auto shrink-0" />
                </div>

                {/* 8 Quota Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { titleW: 'w-32', percentW: '52%' },
                        { titleW: 'w-36', percentW: '42%' },
                        { titleW: 'w-24', percentW: '10%' },
                        { titleW: 'w-28', percentW: '15%' },
                        { titleW: 'w-36', percentW: '35%' },
                        { titleW: 'w-36', percentW: '20%' },
                        { titleW: 'w-36', percentW: '25%' },
                        { titleW: 'w-32', percentW: '30%' },
                    ].map((card, idx) => (
                        <div
                            key={idx}
                            className="p-4 rounded-xl border border-gray-200/80 bg-white space-y-3 animate-pulse shadow-2xs"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 shrink-0" />
                                    <div className={`h-3.5 bg-slate-200 rounded ${card.titleW}`} />
                                </div>
                                <div className="w-16 h-3.5 bg-slate-200 rounded shrink-0" />
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-slate-200 rounded-full"
                                    style={{ width: card.percentW }}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="w-32 h-3 bg-slate-100 rounded" />
                                <div className="w-8 h-3 bg-slate-100 rounded" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Included Plan Privileges Grid Skeleton */}
                <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-4 h-4 rounded bg-amber-200 animate-pulse" />
                        <div className="h-4 w-60 bg-slate-200 rounded animate-pulse" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                        {[...Array(10)].map((_, idx) => (
                            <div
                                key={idx}
                                className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-start gap-2 animate-pulse"
                            >
                                <div className="w-4 h-4 rounded-full bg-emerald-200 shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1 space-y-1">
                                    <div className="w-24 h-3 bg-slate-200 rounded" />
                                    <div className="w-16 h-2.5 bg-slate-100 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Plans Section Skeleton */}
            <div className="mb-12">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
                    <div className="space-y-1.5">
                        <div className="h-6 w-64 bg-slate-200 rounded-lg animate-pulse" />
                        <div className="h-3.5 w-80 max-w-full bg-slate-100 rounded animate-pulse" />
                    </div>
                    <div className="h-4 w-52 bg-slate-100 rounded animate-pulse self-start sm:self-auto shrink-0" />
                </div>

                <PlansSkeletonGrid />
            </div>

            {/* Footer Trust Markers Skeleton */}
            <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-8 border-t border-gray-100 pt-8 pb-4">
                {[...Array(3)].map((_, idx) => (
                    <div key={idx} className="flex items-center gap-2 animate-pulse">
                        <div className="w-4 h-4 rounded-full bg-slate-200 shrink-0" />
                        <div className="h-3.5 w-44 bg-slate-100 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BillingSkeleton;

'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import HrLayout from '@/HR/HrLayout';

const PageComponent = dynamic(() => import('@/HR/CandidateSearchResults'), { ssr: false });

export default function Page() {
  return (
    <HrLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#0A66C2] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[14px] font-semibold text-slate-600">Loading candidate search...</p>
          </div>
        </div>
      }>
        <PageComponent />
      </Suspense>
    </HrLayout>
  );
}

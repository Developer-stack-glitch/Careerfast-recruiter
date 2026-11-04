import { Suspense } from 'react';
import NvitesManagement from '@/HR/NvitesManagement';
import HrLayout from '@/HR/HrLayout';

export const metadata = {
  title: "Candidate Nvites | CareerFast Recruiter",
  description: "Manage and track candidate job invitations, views, responses, and engagement in real-time.",
};

export default function NvitesPage() {
  return (
    <HrLayout>
      <div className="min-h-screen bg-[#F8FAFC] py-6 sm:py-8 text-slate-800 antialiased font-sans overflow-x-clip w-full [&_a]:no-underline [&_a:hover]:no-underline">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Nvites...</div>}>
            <NvitesManagement />
          </Suspense>
        </div>
      </div>
    </HrLayout>
  );
}

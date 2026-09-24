'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import HrLayout from '@/HR/HrLayout';
import { Users } from 'lucide-react';

const ManageTeamPage = dynamic(() => import('@/HR/ManageTeam'), { ssr: false });

export default function Page() {
  const [isSub, setIsSub] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('loginDetails');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.is_sub_recruiter || parsed.sub_recruiter_info) {
          setIsSub(true);
        }
      }
    } catch (e) {}
  }, []);

  if (isSub) {
    return (
      <HrLayout>
        <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#F8FAFC]">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 text-center">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <Users size={28} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Team Access Restricted</h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Seat allocation and team member management are restricted to the primary recruiter account.
            </p>
            <button
              onClick={() => window.location.href = '/overview'}
              className="w-full py-2.5 px-4 bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold text-sm rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Return to Workspace
            </button>
          </div>
        </div>
      </HrLayout>
    );
  }

  return (
    <HrLayout>
      <ManageTeamPage />
    </HrLayout>
  );
}

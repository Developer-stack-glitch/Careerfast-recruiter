'use client';
import dynamic from 'next/dynamic';
import ProtectedRoute from '@/ProtectedRoute/ProtectedRoute';
import HrLayout from '@/HR/HrLayout';

const PageComponent = dynamic(() => import('@/HR/PostCourse'), { ssr: false });

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={[1, 3]}>
      <HrLayout>
        <PageComponent />
      </HrLayout>
    </ProtectedRoute>
  );
}

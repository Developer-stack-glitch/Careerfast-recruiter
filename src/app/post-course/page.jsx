'use client';
import dynamic from 'next/dynamic';
import ProtectedRoute from '@/ProtectedRoute/ProtectedRoute';
import HrLayout from '@/HR/HrLayout';
import CommonLoader from '@/Common/CommonLoader';

const PageComponent = dynamic(() => import('@/HR/PostCourse'), {
  ssr: false,
  loading: () => <CommonLoader fullScreen={true} text="Loading Course Management..." />
});

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={[1, 3]}>
      <HrLayout>
        <PageComponent />
      </HrLayout>
    </ProtectedRoute>
  );
}

'use client';
import dynamic from 'next/dynamic';
import HrLayout from '@/HR/HrLayout';

const PageComponent = dynamic(() => import('@/HR/Subscription'), { ssr: false });

export default function Page() {
  return (
    <HrLayout>
      <PageComponent />
    </HrLayout>
  );
}

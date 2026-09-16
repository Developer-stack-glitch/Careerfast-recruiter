'use client';
import dynamic from 'next/dynamic';

const PageComponent = dynamic(() => import('@/AllRegisteredCandidates/AllRegisteredCandidates'), { ssr: false });

export default function Page() {
  return <PageComponent />;
}

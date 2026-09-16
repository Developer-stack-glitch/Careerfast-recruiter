'use client';
import dynamic from 'next/dynamic';

const PageComponent = dynamic(() => import('@/NotFound/NotFound'), { ssr: false });

export default function NotFound() {
  return <PageComponent />;
}

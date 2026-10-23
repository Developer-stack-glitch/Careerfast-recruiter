'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CommonLoader from '@/Common/CommonLoader';

export default function CreateProfilePage() {
  const router = useRouter();

  useEffect(() => {
    // Recruiter profile creation is integrated into the registration process.
    // Redirect existing visits directly to recruiter dashboard.
    router.replace('/overview');
  }, [router]);

  return <CommonLoader fullScreen={true} text="Redirecting to Recruiter Portal..." />;
}

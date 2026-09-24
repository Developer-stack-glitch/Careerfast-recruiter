import Applicants from '@/HR/Applicants';
import HrLayout from '@/HR/HrLayout';

export default async function ApplicantsQueryPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const jobId = resolvedSearchParams?.job_id || resolvedSearchParams?.id || null;
  return (
    <HrLayout>
      <Applicants jobId={jobId} />
    </HrLayout>
  );
}

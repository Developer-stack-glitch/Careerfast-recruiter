import Applicants from '@/HR/Applicants';
import HrLayout from '@/HR/HrLayout';

export default async function ApplicantsPage({ params }) {
  const resolvedParams = await params;
  return (
    <HrLayout>
      <Applicants jobId={resolvedParams.id} />
    </HrLayout>
  );
}

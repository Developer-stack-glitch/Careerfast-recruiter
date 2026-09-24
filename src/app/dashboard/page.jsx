import HrDashboard from '@/HR/HrDashboard';
import HrLayout from '@/HR/HrLayout';

export const metadata = {
  title: "Recruiter Dashboard | CareerFast TalentHub",
  description: "Manage candidate searches, job postings, outreach campaigns, credits, and downloads.",
};

export default function HrDashboardPage() {
  return (
    <HrLayout>
      <HrDashboard />
    </HrLayout>
  );
}

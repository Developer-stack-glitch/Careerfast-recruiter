import HrReports from '@/HR/HrReports';
import HrLayout from '@/HR/HrLayout';

export const metadata = {
  title: "Recruiter Reports & Plan Analytics | CareerFast TalentHub",
  description: "View comprehensive recruiter plan reports, active job slots, candidate search quotas, CV unlocks, and team allocations.",
};

export default function HrReportsPage() {
  return (
    <HrLayout>
      <HrReports />
    </HrLayout>
  );
}

import SavedCandidates from "@/HR/SavedCandidates";
import HrLayout from "@/HR/HrLayout";

export const metadata = {
  title: "Saved Candidates | CareerFast Recruiter",
  description: "View and manage saved candidate talent and outreach pipeline.",
};

export default function SavedCandidatesPage() {
  return (
    <HrLayout>
      <SavedCandidates />
    </HrLayout>
  );
}

import FolderManagement from "@/HR/FolderManagement";
import HrLayout from "@/HR/HrLayout";

export const metadata = {
  title: "Candidate Folders | CareerFast Recruiter",
  description: "Manage candidate talent folders, recruitment pipelines, and candidate outreach.",
};

export default function FoldersPage() {
  return (
    <HrLayout>
      <FolderManagement />
    </HrLayout>
  );
}

import FolderManagement from "@/HR/FolderManagement";
import HrLayout from "@/HR/HrLayout";

export const metadata = {
  title: "Folder Management | CareerFast Recruiter",
  description: "Manage candidate talent folders, recruitment pipelines, and candidate outreach.",
};

export default function ManageFolderPage() {
  return (
    <HrLayout>
      <FolderManagement />
    </HrLayout>
  );
}

import RoleGuard from "@/components/school/RoleGuard";
import SchoolAdminWorkspace from "@/components/school/SchoolAdminWorkspace";

export default function SchoolAdminAnnouncementsPage() {
  return (
    <RoleGuard allowed={["school_admin"]}>
      <SchoolAdminWorkspace task="announcements" />
    </RoleGuard>
  );
}

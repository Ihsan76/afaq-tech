import RoleGuard from "@/components/school/RoleGuard";
import SchoolAdminWorkspace from "@/components/school/SchoolAdminWorkspace";

export default function SchoolAdminAttendancePage() {
  return (
    <RoleGuard allowed={["school_admin"]}>
      <SchoolAdminWorkspace task="attendance" />
    </RoleGuard>
  );
}

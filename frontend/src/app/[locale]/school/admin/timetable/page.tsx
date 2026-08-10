import RoleGuard from "@/components/school/RoleGuard";
import SchoolAdminWorkspace from "@/components/school/SchoolAdminWorkspace";

export default function SchoolAdminTimetablePage() {
  return (
    <RoleGuard allowed={["school_admin"]}>
      <SchoolAdminWorkspace task="timetable" />
    </RoleGuard>
  );
}

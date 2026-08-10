import RoleGuard from "@/components/school/RoleGuard";
import StudentWorkspace from "@/components/school/StudentWorkspace";

export default function StudentAttendancePage() {
  return (
    <RoleGuard allowed={["student"]}>
      <StudentWorkspace task="attendance" />
    </RoleGuard>
  );
}

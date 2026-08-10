import RoleGuard from "@/components/school/RoleGuard";
import TeacherWorkspace from "@/components/school/TeacherWorkspace";

export default function TeacherAttendancePage() {
  return (
    <RoleGuard allowed={["teacher"]}>
      <TeacherWorkspace task="attendance" />
    </RoleGuard>
  );
}

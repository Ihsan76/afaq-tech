import RoleGuard from "@/components/school/RoleGuard";
import TeacherWorkspace from "@/components/school/TeacherWorkspace";

export default function TeacherAssignmentsPage() {
  return (
    <RoleGuard allowed={["teacher"]}>
      <TeacherWorkspace task="assignments" />
    </RoleGuard>
  );
}

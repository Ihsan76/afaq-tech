import RoleGuard from "@/components/school/RoleGuard";
import StudentWorkspace from "@/components/school/StudentWorkspace";

export default function StudentAssignmentsPage() {
  return (
    <RoleGuard allowed={["student"]}>
      <StudentWorkspace task="assignments" />
    </RoleGuard>
  );
}

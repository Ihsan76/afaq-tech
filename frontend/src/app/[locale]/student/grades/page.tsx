import RoleGuard from "@/components/school/RoleGuard";
import StudentWorkspace from "@/components/school/StudentWorkspace";

export default function StudentGradesPage() {
  return (
    <RoleGuard allowed={["student"]}>
      <StudentWorkspace task="grades" />
    </RoleGuard>
  );
}

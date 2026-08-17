import RoleGuard from "@/components/school/RoleGuard";
import TeacherWorkspace from "@/components/school/TeacherWorkspace";

export default function TeacherGradesPage() {
  return (
    <RoleGuard allowed={["teacher"]}>
      <TeacherWorkspace task="grades" />
    </RoleGuard>
  );
}

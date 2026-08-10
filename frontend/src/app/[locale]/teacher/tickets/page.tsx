import RoleGuard from "@/components/school/RoleGuard";
import TeacherWorkspace from "@/components/school/TeacherWorkspace";

export default function TeacherTicketsPage() {
  return (
    <RoleGuard allowed={["teacher"]}>
      <TeacherWorkspace task="tickets" />
    </RoleGuard>
  );
}

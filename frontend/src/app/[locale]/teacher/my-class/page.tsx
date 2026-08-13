import RoleGuard from "@/components/school/RoleGuard";
import TeacherWorkspace from "@/components/school/TeacherWorkspace";

export default function TeacherMyClassPage() {
  return (
    <RoleGuard allowed={["teacher"]}>
      <TeacherWorkspace task="my-class" />
    </RoleGuard>
  );
}

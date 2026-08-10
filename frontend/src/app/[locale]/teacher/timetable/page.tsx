import RoleGuard from "@/components/school/RoleGuard";
import TeacherWorkspace from "@/components/school/TeacherWorkspace";

export default function TeacherTimetablePage() {
  return (
    <RoleGuard allowed={["teacher"]}>
      <TeacherWorkspace task="timetable" />
    </RoleGuard>
  );
}

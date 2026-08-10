import RoleGuard from "@/components/school/RoleGuard";
import StudentWorkspace from "@/components/school/StudentWorkspace";

export default function StudentTimetablePage() {
  return (
    <RoleGuard allowed={["student"]}>
      <StudentWorkspace task="timetable" />
    </RoleGuard>
  );
}

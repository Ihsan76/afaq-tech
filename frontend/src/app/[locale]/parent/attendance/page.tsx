import RoleGuard from "@/components/school/RoleGuard";
import ParentWorkspace from "@/components/school/ParentWorkspace";

export default function ParentAttendancePage() {
  return (
    <RoleGuard allowed={["parent"]}>
      <ParentWorkspace task="attendance" />
    </RoleGuard>
  );
}

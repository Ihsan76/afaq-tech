import RoleGuard from "@/components/school/RoleGuard";
import ParentWorkspace from "@/components/school/ParentWorkspace";

export default function ParentAssignmentsPage() {
  return (
    <RoleGuard allowed={["parent"]}>
      <ParentWorkspace task="assignments" />
    </RoleGuard>
  );
}

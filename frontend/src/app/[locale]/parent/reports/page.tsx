import RoleGuard from "@/components/school/RoleGuard";
import ParentWorkspace from "@/components/school/ParentWorkspace";

export default function ParentReportsPage() {
  return (
    <RoleGuard allowed={["parent"]}>
      <ParentWorkspace task="reports" />
    </RoleGuard>
  );
}

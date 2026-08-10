import RoleGuard from "@/components/school/RoleGuard";
import RoleDashboard from "@/components/school/RoleDashboard";

export default function ParentDashboardPage() {
  return (
    <RoleGuard allowed={["parent"]}>
      <RoleDashboard />
    </RoleGuard>
  );
}

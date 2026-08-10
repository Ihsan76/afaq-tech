import RoleGuard from "@/components/school/RoleGuard";
import RoleDashboard from "@/components/school/RoleDashboard";

export default function SchoolAdminDashboardPage() {
  return (
    <RoleGuard allowed={["school_admin"]}>
      <RoleDashboard />
    </RoleGuard>
  );
}

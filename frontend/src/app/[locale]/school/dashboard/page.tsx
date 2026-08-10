import RoleGuard from "@/components/school/RoleGuard";
import RoleDashboard from "@/components/school/RoleDashboard";

export default function SchoolDashboardPage() {
  return (
    <RoleGuard allowed={["school_admin", "teacher", "parent", "student"]}>
      <RoleDashboard />
    </RoleGuard>
  );
}

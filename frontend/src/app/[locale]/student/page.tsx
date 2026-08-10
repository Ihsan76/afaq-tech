import RoleGuard from "@/components/school/RoleGuard";
import RoleDashboard from "@/components/school/RoleDashboard";

export default function StudentDashboardPage() {
  return (
    <RoleGuard allowed={["student"]}>
      <RoleDashboard />
    </RoleGuard>
  );
}

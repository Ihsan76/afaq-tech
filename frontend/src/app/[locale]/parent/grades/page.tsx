import RoleGuard from "@/components/school/RoleGuard";
import ParentWorkspace from "@/components/school/ParentWorkspace";

export default function ParentGradesPage() {
  return (
    <RoleGuard allowed={["parent"]}>
      <ParentWorkspace task="grades" />
    </RoleGuard>
  );
}

import RoleGuard from "@/components/school/RoleGuard";
import ParentWorkspace from "@/components/school/ParentWorkspace";

export default function ParentChildrenPage() {
  return (
    <RoleGuard allowed={["parent"]}>
      <ParentWorkspace task="children" />
    </RoleGuard>
  );
}

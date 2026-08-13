"use client";

import { useParams } from "next/navigation";
import RoleGuard from "@/components/school/RoleGuard";
import SchoolAdminShell from "@/components/school/admin/SchoolAdminShell";
import AdminSectionStudentsView from "@/components/school/admin/AdminSectionStudentsView";

export default function SchoolAdminSectionStudentsPage() {
  const params = useParams<{ sectionId: string }>();
  const sectionId = (params?.sectionId as string) || "";

  return (
    <RoleGuard allowed={["school_admin"]}>
      <SchoolAdminShell endpoints={{}}>
        {() => <AdminSectionStudentsView sectionId={sectionId} />}
      </SchoolAdminShell>
    </RoleGuard>
  );
}

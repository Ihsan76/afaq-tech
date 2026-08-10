"use client";

import RoleGuard from "@/components/school/RoleGuard";
import SchoolAdminShell from "@/components/school/admin/SchoolAdminShell";
import AdminSectionsView from "@/components/school/admin/AdminSectionsView";

export default function SchoolAdminSectionsPage() {
  return (
    <RoleGuard allowed={["school_admin"]}>
      <SchoolAdminShell endpoints={{ sections: "/schools/sections/" }}>
        {({ data, refresh }) => (
          <AdminSectionsView sections={data.sections || []} refresh={refresh} />
        )}
      </SchoolAdminShell>
    </RoleGuard>
  );
}

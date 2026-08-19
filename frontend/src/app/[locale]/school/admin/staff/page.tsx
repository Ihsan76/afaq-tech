"use client";

import RoleGuard from "@/components/school/RoleGuard";
import SchoolAdminShell from "@/components/school/admin/SchoolAdminShell";
import AdminStaffView from "@/components/school/admin/AdminStaffView";

export default function SchoolAdminStaffPage() {
  return (
    <RoleGuard allowed={["school_admin"]}>
      <SchoolAdminShell
        endpoints={{
          staff: "/schools/school-staff/",
        }}
      >
        {({ data, schoolId, refresh }) => (
          <AdminStaffView
            staff={data.staff || []}
            schoolId={schoolId}
            refresh={refresh}
          />
        )}
      </SchoolAdminShell>
    </RoleGuard>
  );
}

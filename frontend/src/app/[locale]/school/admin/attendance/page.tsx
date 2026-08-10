"use client";

import RoleGuard from "@/components/school/RoleGuard";
import SchoolAdminShell from "@/components/school/admin/SchoolAdminShell";
import AdminAttendanceView from "@/components/school/admin/AdminAttendanceView";

export default function SchoolAdminAttendancePage() {
  return (
    <RoleGuard allowed={["school_admin"]}>
      <SchoolAdminShell endpoints={{ attendances: "/schools/attendances/" }}>
        {({ data }) => <AdminAttendanceView attendances={data.attendances || []} />}
      </SchoolAdminShell>
    </RoleGuard>
  );
}

"use client";

import RoleGuard from "@/components/school/RoleGuard";
import SchoolAdminShell from "@/components/school/admin/SchoolAdminShell";
import AdminGradesView from "@/components/school/admin/AdminGradesView";

export default function SchoolAdminGradesPage() {
  return (
    <RoleGuard allowed={["school_admin"]}>
      <SchoolAdminShell
        endpoints={{
          offered: "/schools/school-grades/",
          subjectPeriods: "/schools/school-subject-periods/",
        }}
      >
        {({ data, schoolId, refresh }) => (
          <AdminGradesView
            offered={data.offered || []}
            subjectPeriods={data.subjectPeriods || []}
            schoolId={schoolId}
            refresh={refresh}
          />
        )}
      </SchoolAdminShell>
    </RoleGuard>
  );
}

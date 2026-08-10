"use client";

import RoleGuard from "@/components/school/RoleGuard";
import SchoolAdminShell from "@/components/school/admin/SchoolAdminShell";
import AdminTeachersView from "@/components/school/admin/AdminTeachersView";

export default function SchoolAdminTeachersPage() {
  return (
    <RoleGuard allowed={["school_admin"]}>
      <SchoolAdminShell
        endpoints={{
          teachers: "/schools/school-teachers/",
          assignments: "/schools/teacher-assignments/",
          sections: "/schools/sections/",
          years: "/schools/academic-years/",
        }}
      >
        {({ data, schoolId, refresh }) => (
          <AdminTeachersView
            teachers={data.teachers || []}
            assignments={data.assignments || []}
            sections={data.sections || []}
            years={data.years || []}
            schoolId={schoolId}
            refresh={refresh}
          />
        )}
      </SchoolAdminShell>
    </RoleGuard>
  );
}

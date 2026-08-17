"use client";

import RoleGuard from "@/components/school/RoleGuard";
import SchoolAdminShell from "@/components/school/admin/SchoolAdminShell";
import AdminRoomsView from "@/components/school/admin/AdminRoomsView";

export default function SchoolAdminRoomsPage() {
  return (
    <RoleGuard allowed={["school_admin"]}>
      <SchoolAdminShell
        endpoints={{
          rooms: "/schools/rooms/",
          periods: "/schools/periods/",
          academicYears: "/schools/academic-years/?is_current=true",
        }}
      >
        {({ data, schoolId, refresh }) => (
          <AdminRoomsView
            rooms={data.rooms || []}
            periods={data.periods || []}
            academicYears={data.academicYears || []}
            schoolId={schoolId}
            refresh={refresh}
          />
        )}
      </SchoolAdminShell>
    </RoleGuard>
  );
}

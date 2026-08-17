"use client";

import RoleGuard from "@/components/school/RoleGuard";
import SchoolAdminShell from "@/components/school/admin/SchoolAdminShell";
import AdminTimetableView from "@/components/school/admin/AdminTimetableView";

export default function SchoolAdminTimetablePage() {
  return (
    <RoleGuard allowed={["school_admin"]}>
      <SchoolAdminShell
        endpoints={{
          sections: "/schools/sections/",
          periods: "/schools/periods/",
          rooms: "/schools/rooms/",
          slots: "/schools/timetable-slots/",
          academicYears: "/schools/academic-years/?is_current=true",
        }}
      >
        {({ data, refresh }) => (
          <AdminTimetableView
            sections={data.sections || []}
            periods={data.periods || []}
            rooms={data.rooms || []}
            slots={data.slots || []}
            academicYears={data.academicYears || []}
            refresh={refresh}
          />
        )}
      </SchoolAdminShell>
    </RoleGuard>
  );
}

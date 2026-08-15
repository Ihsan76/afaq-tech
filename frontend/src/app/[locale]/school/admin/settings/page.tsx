"use client";

import RoleGuard from "@/components/school/RoleGuard";
import SchoolAdminShell from "@/components/school/admin/SchoolAdminShell";
import AdminCalendarSettingsView from "@/components/school/admin/AdminCalendarSettingsView";

export default function SchoolAdminSettingsPage() {
  return (
    <RoleGuard allowed={["school_admin"]}>
      <SchoolAdminShell
        endpoints={{
          schools: "/schools/schools/",
        }}
      >
        {({ data, refresh }) => {
          const schools = data.schools || [];
          const school = schools[0] || null;
          return (
            <AdminCalendarSettingsView
              school={school}
              refresh={refresh}
            />
          );
        }}
      </SchoolAdminShell>
    </RoleGuard>
  );
}

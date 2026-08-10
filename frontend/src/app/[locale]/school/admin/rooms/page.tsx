"use client";

import RoleGuard from "@/components/school/RoleGuard";
import SchoolAdminShell from "@/components/school/admin/SchoolAdminShell";
import AdminRoomsView from "@/components/school/admin/AdminRoomsView";

export default function SchoolAdminRoomsPage() {
  return (
    <RoleGuard allowed={["school_admin"]}>
      <SchoolAdminShell
        endpoints={{ rooms: "/schools/rooms/", periods: "/schools/periods/" }}
      >
        {({ data, schoolId, refresh }) => (
          <AdminRoomsView rooms={data.rooms || []} periods={data.periods || []} schoolId={schoolId} refresh={refresh} />
        )}
      </SchoolAdminShell>
    </RoleGuard>
  );
}

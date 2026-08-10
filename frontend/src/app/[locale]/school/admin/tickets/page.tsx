"use client";

import RoleGuard from "@/components/school/RoleGuard";
import SchoolAdminShell from "@/components/school/admin/SchoolAdminShell";
import AdminTicketsView from "@/components/school/admin/AdminTicketsView";

export default function SchoolAdminTicketsPage() {
  return (
    <RoleGuard allowed={["school_admin"]}>
      <SchoolAdminShell
        endpoints={{ tickets: "/schools/tickets/", attachments: "/schools/attachments/" }}
      >
        {({ data, refresh }) => (
          <AdminTicketsView tickets={data.tickets || []} attachments={data.attachments || []} refresh={refresh} />
        )}
      </SchoolAdminShell>
    </RoleGuard>
  );
}

import { AdminNetworksClient } from "@/app/admin/networks/AdminNetworksClient";
import { AdminPageFooter, AdminPageHeader } from "@/components/AdminPageChrome";

export default function AdminNetworksPage() {
  return (
    <div className="admin-page-stack">
      <AdminPageHeader breadcrumbs={[{ label: "Catalog" }, { label: "Networks" }]} title="Networks" />
      <AdminNetworksClient />
      <AdminPageFooter />
    </div>
  );
}

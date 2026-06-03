import { AdminPageHeader } from "@/components/AdminPageChrome";
import { AdminSimCostSettings } from "../AdminSimCostSettings";

export const dynamic = "force-dynamic";

export default function AdminSimCostPage() {
  return (
    <div className="admin-page-stack">
      <AdminPageHeader
        breadcrumbs={[{ label: "Catalog" }, { label: "Pricing & hardware" }]}
        title="Pricing &amp; hardware"
      />
      <section className="admin-section">
        <div className="pt-2 md:pt-3">
          <AdminSimCostSettings />
        </div>
      </section>
    </div>
  );
}

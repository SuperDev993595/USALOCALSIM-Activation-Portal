import { AdminPageHeader } from "@/components/AdminPageChrome";
import { AdminSimCostSettings } from "../AdminSimCostSettings";

export const dynamic = "force-dynamic";

export default function AdminSimCostPage() {
  return (
    <div className="space-y-10">
      <AdminPageHeader
        title="Pricing &amp; hardware"
        description='Default hardware deduction when customers check &quot;I already have a SIM&quot; on Buy Plan. Per-market overrides apply for global and US catalogs.'
      />
      <section className="admin-panel">
        <div className="p-5 md:p-6">
          <AdminSimCostSettings />
        </div>
      </section>
    </div>
  );
}

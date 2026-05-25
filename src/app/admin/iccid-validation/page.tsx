import { AdminPageHeader } from "@/components/AdminPageChrome";
import { AdminIccidValidationSettings } from "../AdminIccidValidationSettings";

export const dynamic = "force-dynamic";

export default function AdminIccidValidationPage() {
  return (
    <div className="admin-page-stack">
      <AdminPageHeader
        breadcrumbs={[{ label: "Catalog" }, { label: "ICCID validation" }]}
        title="ICCID validation"
      />
      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2 className="admin-panel-head-title">Master list and fallback</h2>
          <p className="admin-panel-head-desc">
            Import SIM numbers from your spreadsheet. Toggle off list enforcement if you need to keep activations running before a new batch is loaded.
          </p>
        </div>
        <div className="p-5 md:p-6 pt-0 md:pt-0">
          <AdminIccidValidationSettings />
        </div>
      </section>
    </div>
  );
}

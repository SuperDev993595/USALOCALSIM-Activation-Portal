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
      <section className="admin-section">
        <div className="admin-section-head">
          <h2 className="admin-section-head-title">Master list and fallback</h2>
          <p className="admin-section-head-desc">
            Import SIM numbers from your spreadsheet. Toggle off list enforcement if you need to keep activations running before a new batch is loaded.
          </p>
        </div>
        <div className="pt-4 md:pt-5">
          <AdminIccidValidationSettings />
        </div>
      </section>
    </div>
  );
}

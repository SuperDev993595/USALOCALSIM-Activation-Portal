import { AdminPageHeader } from "@/components/AdminPageChrome";
import { AdminIccidValidationSettings } from "../AdminIccidValidationSettings";

export const dynamic = "force-dynamic";

export default function AdminIccidValidationPage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="ICCID validation"
        description="Control whether ICCIDs must appear on your imported master list, or whether the public site accepts the Luhn-checked 89… pattern when the list is unavailable."
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

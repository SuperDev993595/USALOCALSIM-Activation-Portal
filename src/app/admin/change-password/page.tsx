import { AdminPageFooter, AdminPageHeader } from "@/components/AdminPageChrome";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export default function AdminChangePasswordPage() {
  return (
    <div className="admin-page-stack">
      <AdminPageHeader
        breadcrumbs={[{ label: "Administration" }, { label: "Change password" }]}
        title="Change password"
      />
      <ChangePasswordForm />
      <AdminPageFooter href="/admin/users" label="Back to users" />
    </div>
  );
}

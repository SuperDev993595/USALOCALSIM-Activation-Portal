import { AdminPageHeader } from "@/components/AdminPageChrome";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export default function AdminChangePasswordPage() {
  return (
    <div className="admin-page-stack">
      <AdminPageHeader
        breadcrumbs={[{ label: "Administration" }, { label: "Change password" }]}
        title="Change password"
        description="Email verification required before your new password is saved."
      />
      <ChangePasswordForm variant="admin" />
    </div>
  );
}

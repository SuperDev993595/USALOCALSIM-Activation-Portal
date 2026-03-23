import { AdminPageFooter, AdminPageHeader } from "@/components/AdminPageChrome";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export default function AdminChangePasswordPage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Change password"
        description="A verification code is sent to your account email before your password can be changed."
      />
      <ChangePasswordForm />
      <AdminPageFooter href="/admin/users" label="Back to users" />
    </div>
  );
}

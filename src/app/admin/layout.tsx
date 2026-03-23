import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminAppShell } from "@/components/AdminAppShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login?callbackUrl=/admin");
  const role = (session.user as { role?: string }).role;
  if (role === "disabled") {
    redirect(
      "/api/auth/signout?callbackUrl=" +
        encodeURIComponent("/login?error=AccountDisabled"),
    );
  }
  if (role !== "admin") redirect("/login?callbackUrl=/admin");
  return (
    <AdminAppShell email={session.user.email ?? ""}>{children}</AdminAppShell>
  );
}

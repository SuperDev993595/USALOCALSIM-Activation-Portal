import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminNav } from "@/components/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login?callbackUrl=/admin");
  const role = (session.user as { role?: string }).role;
  if (role !== "admin") redirect("/login?callbackUrl=/admin");
  return (
    <>
      <AdminNav email={session.user.email ?? ""} />
      <main className="mx-auto max-w-7xl p-4 md:p-6">{children}</main>
    </>
  );
}

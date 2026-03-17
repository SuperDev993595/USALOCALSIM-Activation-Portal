import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function DealerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login?callbackUrl=/dealer");
  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && role !== "dealer") redirect("/login?callbackUrl=/dealer");
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-900">Dealer – Unlock vouchers</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{session.user.email}</span>
            <Link href="/api/auth/signout" className="text-sm text-red-600 hover:underline">
              Sign out
            </Link>
          </div>
        </div>
      </nav>
      <main className="p-4">{children}</main>
    </div>
  );
}

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

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
    <div className="min-h-screen bg-gray-100">
      <nav className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <Link href="/admin" className="font-medium text-gray-900 hover:text-blue-600">
              Queue
            </Link>
            <Link href="/admin/completed" className="text-gray-600 hover:text-blue-600">
              Completed
            </Link>
            <Link href="/admin/vouchers" className="text-gray-600 hover:text-blue-600">
              Import vouchers
            </Link>
            <Link href="/admin/vouchers/tracking" className="text-gray-600 hover:text-blue-600">
              Voucher tracking
            </Link>
          </div>
          <span className="text-sm text-gray-500">{session.user.email}</span>
          <Link href="/api/auth/signout" className="text-sm text-red-600 hover:underline">
            Sign out
          </Link>
        </div>
      </nav>
      <main className="p-4">{children}</main>
    </div>
  );
}

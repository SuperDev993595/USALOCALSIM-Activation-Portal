import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DealerNav } from "@/components/DealerNav";

export default async function DealerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login?callbackUrl=/dealer");
  const role = (session.user as { role?: string }).role;
  if (role === "disabled") {
    redirect(
      "/api/auth/signout?callbackUrl=" +
        encodeURIComponent("/login?error=AccountDisabled"),
    );
  }
  if (role !== "admin" && role !== "dealer") redirect("/login?callbackUrl=/dealer");
  return (
    <div className="public-site flex h-screen flex-col overflow-hidden">
      <DealerNav email={session.user.email ?? ""} />
      <main className="public-main ui-main-scrollbar relative z-10 min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}

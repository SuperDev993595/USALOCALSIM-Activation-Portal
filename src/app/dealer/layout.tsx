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
  if (!session?.user?.email) redirect("/login?callbackUrl=/dealer/scan");
  const role = (session.user as { role?: string }).role;
  if (role === "disabled") {
    redirect(
      "/api/auth/signout?callbackUrl=" +
        encodeURIComponent("/login?error=AccountDisabled"),
    );
  }
  if (role !== "admin" && role !== "dealer") redirect("/login?callbackUrl=/dealer/scan");
  return (
    <div className="dealer-shell public-site">
      <DealerNav email={session.user.email ?? ""} />
      <main className="dealer-shell-main public-main ui-main-scrollbar">
        <div className="dealer-shell-content">{children}</div>
      </main>
    </div>
  );
}

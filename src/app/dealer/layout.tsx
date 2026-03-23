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
    <>
      <DealerNav email={session.user.email ?? ""} />
      <main className="mx-auto max-w-7xl p-4 md:p-6">{children}</main>
    </>
  );
}

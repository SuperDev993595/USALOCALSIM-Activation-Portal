import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminUsersClient } from "./AdminUsersClient";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  return <AdminUsersClient currentUserId={session?.user?.id ?? ""} />;
}

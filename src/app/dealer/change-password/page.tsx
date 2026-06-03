import { redirect } from "next/navigation";

export default function DealerChangePasswordRedirectPage() {
  redirect("/dealer/settings");
}

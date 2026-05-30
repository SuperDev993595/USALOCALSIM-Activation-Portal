import { redirect } from "next/navigation";

export default function RedeepPage({
  searchParams,
}: {
  searchParams: { purchaseId?: string | string[]; access?: string | string[] };
}) {
  const purchaseId = Array.isArray(searchParams.purchaseId) ? searchParams.purchaseId[0] : searchParams.purchaseId;
  const access = Array.isArray(searchParams.access) ? searchParams.access[0] : searchParams.access;
  if (!purchaseId) redirect("/redeem/enter");
  redirect(
    `/redeem?purchaseId=${encodeURIComponent(purchaseId)}${access?.trim() ? `&access=${encodeURIComponent(access.trim())}` : ""}`,
  );
}

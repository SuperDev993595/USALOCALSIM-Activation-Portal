import { redirect } from "next/navigation";

/** Tourism / retail partner entry — POS scan & activate. */
export default function RetailPartnerPage() {
  redirect("/dealer/scan");
}

import { redirect } from "next/navigation";

/** Default dealer home — retail scan & activate. */
export default function DealerIndexPage() {
  redirect("/dealer/scan");
}

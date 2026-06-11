import { notFound } from "next/navigation";
import { DevTierBannersPreview } from "@/components/DevTierBannersPreview";
import { RedeemPageBackground } from "@/components/RedeemPageBackground";

export default function DevTierBannersPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <RedeemPageBackground>
      <DevTierBannersPreview />
    </RedeemPageBackground>
  );
}

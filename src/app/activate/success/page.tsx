import { redirect } from "next/navigation";

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

function buildQueryString(searchParams: Props["searchParams"]) {
  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(searchParams)) {
    if (val == null) continue;
    if (Array.isArray(val)) {
      for (const v of val) q.append(key, v);
    } else {
      q.set(key, val);
    }
  }
  return q.toString();
}

export default function LegacyActivateSuccessPage({ searchParams }: Props) {
  const qs = buildQueryString(searchParams);
  const params = new URLSearchParams(qs);
  const target = params.get("session_id") ? "/buy-plan/success" : "/redeem/success";
  redirect(qs ? `${target}?${qs}` : target);
}

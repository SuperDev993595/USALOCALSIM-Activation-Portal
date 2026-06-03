"use client";

import { useTranslations } from "next-intl";

const INCLUDE_KEYS = ["registerPackInclude1", "registerPackInclude2", "registerPackInclude3"] as const;

function CheckIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-emerald-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function CartPackIncludes() {
  const t = useTranslations("cart");

  return (
    <ul className="cart-flow-checklist">
      {INCLUDE_KEYS.map((key) => (
        <li key={key} className="cart-flow-checklist-item">
          <CheckIcon />
          <span>{t(key)}</span>
        </li>
      ))}
    </ul>
  );
}

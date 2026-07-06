"use client";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LinkupVerifiedBanner({ title, body }: { title: string; body: string }) {
  return (
    <div className="cart-credit-checkout-banner" role="status">
      <CheckIcon className="cart-credit-checkout-banner-icon" />
      <div>
        <p className="cart-credit-checkout-banner-title">{title}</p>
        <p className="cart-credit-checkout-banner-body">{body}</p>
      </div>
    </div>
  );
}

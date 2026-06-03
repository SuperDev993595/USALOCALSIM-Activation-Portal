import type { ReactNode } from "react";

const VARIANT_CLASS = {
  info: "cart-flow-notice--info",
  success: "cart-flow-notice--success",
  warning: "cart-flow-notice--warning",
  error: "cart-flow-notice--error",
} as const;

export function CartNotice({
  variant,
  children,
  action,
}: {
  variant: keyof typeof VARIANT_CLASS;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={`cart-flow-notice ${VARIANT_CLASS[variant]}`} role={variant === "error" || variant === "warning" ? "alert" : "status"}>
      <div className="cart-flow-notice-body">{children}</div>
      {action ? <div className="cart-flow-notice-action">{action}</div> : null}
    </div>
  );
}

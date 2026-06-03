"use client";

type AdminFeedbackVariant = "error" | "success" | "warning" | "info";

const variantClass: Record<AdminFeedbackVariant, string> = {
  error: "admin-callout admin-callout-error",
  success: "admin-callout admin-callout-success",
  warning: "admin-callout admin-callout-warning",
  info: "admin-callout admin-callout-muted",
};

export function AdminFeedbackBanner({
  variant,
  message,
  onDismiss,
}: {
  variant: AdminFeedbackVariant;
  message: string;
  onDismiss?: () => void;
}) {
  if (!message.trim()) return null;

  return (
    <div
      className={`${variantClass[variant]} items-start justify-between gap-3`}
      role={variant === "error" ? "alert" : "status"}
    >
      <p className="min-w-0 flex-1 leading-relaxed">{message}</p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-none border border-current/20 px-2 py-1 text-xs font-semibold uppercase tracking-wide opacity-80 hover:opacity-100"
        >
          Dismiss
        </button>
      ) : null}
    </div>
  );
}

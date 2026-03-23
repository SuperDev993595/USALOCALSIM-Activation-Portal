import { Suspense } from "react";
import { ActivateSuccessContent } from "./ActivateSuccessContent";

export default function ActivateSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
          <p className="text-muted">…</p>
        </div>
      }
    >
      <ActivateSuccessContent />
    </Suspense>
  );
}

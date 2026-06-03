"use client";

import { useEffect, useState } from "react";

/** JS-driven pulse — works when OS “reduced motion” disables CSS @keyframes. */
export function useActiveStepPulse(enabled: boolean) {
  const [pulseOn, setPulseOn] = useState(true);
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => setPulseOn((v) => !v), 800);
    return () => window.clearInterval(id);
  }, [enabled]);
  return pulseOn;
}

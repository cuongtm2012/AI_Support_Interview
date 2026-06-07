"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Dev: unregister stale SW that may cache old /_next chunks on localhost
    if (process.env.NODE_ENV === "development") {
      void navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())));
      return;
    }

    void navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}

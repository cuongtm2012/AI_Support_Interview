"use client";

import { useEffect, useState } from "react";

/** True after client mount — avoids SSR/localStorage hydration mismatches */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}

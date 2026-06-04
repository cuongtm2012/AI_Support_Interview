"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/stores/settings";

export function ThemeSync() {
  const darkMode = useSettingsStore((s) => s.darkMode);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    document.documentElement.classList.toggle("light", !darkMode);
  }, [darkMode]);

  return null;
}

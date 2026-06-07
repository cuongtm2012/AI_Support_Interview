"use client";

import { useEffect } from "react";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeSync } from "@/components/ThemeSync";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { initMonitoring } from "@/lib/monitoring";

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initMonitoring();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeSync />
        <ServiceWorkerRegister />
        {children}
      </AuthProvider>
    </ErrorBoundary>
  );
}

"use client";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeSync } from "@/components/ThemeSync";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeSync />
        {children}
      </AuthProvider>
    </ErrorBoundary>
  );
}

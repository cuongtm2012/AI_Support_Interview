import * as Sentry from "@sentry/browser";

let initialized = false;

export function initMonitoring(): void {
  if (initialized || typeof window === "undefined") return;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
  initialized = true;
}

export function captureError(
  error: unknown,
  context?: Record<string, string>
): void {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.error("[Interview Copilot]", error, context);
    return;
  }
  Sentry.captureException(error, { extra: context });
}

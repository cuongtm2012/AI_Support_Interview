import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  icon?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function Panel({
  title,
  icon,
  badge,
  actions,
  children,
  className = "",
  bodyClassName = "",
}: PanelProps) {
  return (
    <section className={`glass-panel flex h-full flex-col overflow-hidden ${className}`}>
      <header className="glass-panel-header">
        <div className="flex items-center gap-2.5">
          {icon && (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
              {icon}
            </span>
          )}
          <h2 className="text-sm font-semibold tracking-tight text-slate-100">
            {title}
          </h2>
          {badge}
        </div>
        {actions}
      </header>
      <div className={`flex min-h-0 flex-1 flex-col ${bodyClassName}`}>
        {children}
      </div>
    </section>
  );
}

const STATUS_DOT_CLASS: Record<
  "idle" | "session" | "listening" | "warning",
  string
> = {
  idle: "bg-slate-600",
  session: "bg-accent shadow-[0_0_8px_rgba(99,102,241,0.45)]",
  listening:
    "bg-live shadow-[0_0_8px_rgba(245,158,11,0.6)] motion-safe:animate-pulse-soft",
  warning:
    "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] motion-safe:animate-pulse-soft",
};

export function StatusDot({
  active,
  tone,
  label,
}: {
  active?: boolean;
  tone?: "idle" | "session" | "listening" | "warning";
  label: string;
}) {
  const resolvedTone =
    tone ??
    (active ? "listening" : "idle");

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-400">
      <span
        className={`h-2 w-2 rounded-full ${STATUS_DOT_CLASS[resolvedTone]}`}
        aria-hidden
      />
      {label}
    </span>
  );
}

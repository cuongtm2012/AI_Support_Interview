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

export function StatusDot({
  active,
  label,
}: {
  active: boolean;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-400">
      <span
        className={`h-2 w-2 rounded-full ${
          active
            ? "bg-live shadow-[0_0_8px_rgba(245,158,11,0.6)] motion-safe:animate-pulse-soft"
            : "bg-slate-600"
        }`}
        aria-hidden
      />
      {label}
    </span>
  );
}

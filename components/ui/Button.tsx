import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "live";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md";
  icon?: ReactNode;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-surface-base hover:bg-accent-hover shadow-glow disabled:opacity-40",
  secondary:
    "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 disabled:opacity-40",
  ghost: "text-slate-400 hover:bg-white/5 hover:text-slate-200 disabled:opacity-40",
  danger: "bg-red-500/90 text-white hover:bg-red-500 disabled:opacity-40",
  live: "bg-live text-surface-base hover:bg-amber-400 disabled:opacity-40",
};

const sizes = {
  sm: "gap-1.5 rounded-lg px-3 py-1.5 text-xs",
  md: "gap-2 rounded-xl px-4 py-2.5 text-sm",
};

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex cursor-pointer items-center justify-center font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base disabled:cursor-not-allowed ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

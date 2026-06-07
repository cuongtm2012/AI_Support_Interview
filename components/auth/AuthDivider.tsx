export function AuthDivider() {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-px flex-1 bg-white/[0.06]" />
      <span className="text-xs text-slate-500">or continue with</span>
      <div className="h-px flex-1 bg-white/[0.06]" />
    </div>
  );
}

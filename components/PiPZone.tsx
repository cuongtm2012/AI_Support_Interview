"use client";

import { Panel } from "@/components/ui/Panel";
import { IconVideo } from "@/components/ui/Icons";

export function PiPZone() {
  return (
    <Panel
      title="Meeting (PiP)"
      icon={<IconVideo size={16} />}
      className="border-dashed !border-white/[0.12] !bg-surface-card/40"
      bodyClassName="flex-1"
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-surface-base/80">
          <IconVideo size={32} className="text-slate-500" />
        </div>
        <div className="max-w-[240px]">
          <p className="text-sm font-medium text-slate-300">
            Kéo cửa sổ PiP vào đây
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Zoom / Meet / Teams trên browser → Picture-in-Picture → đặt vào góc
            trái màn hình
          </p>
        </div>
        <ol className="w-full max-w-[260px] space-y-2 text-left text-xs text-slate-500">
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-[10px] font-semibold text-accent">
              1
            </span>
            Mở cuộc gọi trên tab browser
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-[10px] font-semibold text-accent">
              2
            </span>
            Bấm nút PiP trên player
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-[10px] font-semibold text-accent">
              3
            </span>
            Kéo cửa sổ vào vùng này
          </li>
        </ol>
      </div>
    </Panel>
  );
}

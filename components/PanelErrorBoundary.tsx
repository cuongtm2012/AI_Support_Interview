"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { captureError } from "@/lib/monitoring";
import { Button } from "@/components/ui/Button";

interface Props {
  children: ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
  message?: string;
}

/** Isolated error boundary for a single panel (SPEC §14.2). */
export class PanelErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    captureError(error, {
      panel: this.props.label ?? "unknown",
      stack: info.componentStack?.slice(0, 500) ?? "",
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-sm font-medium text-red-300">
            {this.props.label ?? "Panel"} gặp lỗi
          </p>
          <p className="max-w-xs text-xs text-slate-500">
            {this.state.message || "Không thể hiển thị nội dung."}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => this.setState({ hasError: false, message: undefined })}
          >
            Thử lại
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { captureError } from "@/lib/monitoring";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    captureError(error, { stack: info.componentStack?.slice(0, 500) ?? "" });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-base p-6 text-center">
          <h1 className="text-lg font-semibold text-slate-100">
            Đã xảy ra lỗi
          </h1>
          <p className="max-w-md text-sm text-slate-500">
            {this.state.message || "Vui lòng tải lại trang."}
          </p>
          <Button
            variant="primary"
            onClick={() => window.location.reload()}
          >
            Tải lại
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

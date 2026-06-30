"use client";

import { Component, ReactNode } from "react";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow-sm">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-lg font-semibold text-gray-900 mb-2">
              页面遇到了一些问题
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              {this.state.error?.message || "发生了未知错误"}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="px-4 py-2 bg-shibu-600 text-white rounded-lg text-sm hover:bg-shibu-700"
              >
                刷新页面
              </button>
              <Link
                href="/dashboard"
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                返回工作台
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4">
      <div className="w-full rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-50 p-2 text-amber-700">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">We could not complete that action</h1>
            <p className="mt-1 text-sm text-gray-600">
              Your data has not been intentionally cleared. Try the action again, or return to the dashboard.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-md bg-active px-4 py-2 text-sm font-medium text-white"
          >
            <RotateCcw size={16} /> Try again
          </button>
          <Link
            href="/dashboard"
            className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-gray-700"
          >
            Back to dashboard
          </Link>
        </div>

        {error.digest && (
          <p className="mt-4 text-xs text-gray-400">Reference: {error.digest}</p>
        )}
      </div>
    </div>
  );
}

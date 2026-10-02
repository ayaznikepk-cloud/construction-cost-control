import Link from "next/link";
import { ArrowLeft, LayoutDashboard } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-white p-6 text-center shadow-sm">
        <div className="text-sm font-medium text-gray-500">Page not available</div>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">This page could not be found</h1>
        <p className="mt-2 text-sm text-gray-600">
          The link may be outdated, or this page may not be available for your account.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-gray-700"
          >
            <ArrowLeft size={16} /> Projects
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md bg-active px-4 py-2 text-sm font-medium text-white"
          >
            <LayoutDashboard size={16} /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

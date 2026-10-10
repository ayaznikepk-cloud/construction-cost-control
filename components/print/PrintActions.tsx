"use client";

import { useRouter } from "next/navigation";

export default function PrintActions() {
  const router = useRouter();
  return <div className="print-actions no-print flex flex-wrap gap-2">
    <button type="button" onClick={() => window.print()} className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white">Print / Save as PDF</button>
    <button type="button" onClick={() => router.back()} className="rounded border px-4 py-2 text-sm">Back</button>
  </div>;
}

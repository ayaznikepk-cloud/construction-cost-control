"use client";

import { useRouter } from "next/navigation";

export default function PrintActions() {
  const router = useRouter();
  return <div className="print-actions no-print flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
    <button type="button" onClick={() => window.print()} className="w-full whitespace-nowrap rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white sm:w-auto">Print / Save as PDF</button>
    <button type="button" onClick={() => router.back()} className="w-full whitespace-nowrap rounded border px-4 py-2 text-sm sm:w-auto">Back</button>
  </div>;
}

import type { ReactNode } from "react";
import PrintActions from "./PrintActions";

export default function PrintDocument({ title, subtitle, children, landscape = false }: { title: string; subtitle?: string; children: ReactNode; landscape?: boolean }) {
  return <article className={landscape ? "print-document print-landscape" : "print-document"}>
    <div className="print-document-heading mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0"><div className="text-sm font-semibold uppercase tracking-wide">Construction Cost Control</div><h1 className="mt-2 break-words text-xl font-bold sm:text-2xl">{title}</h1>{subtitle && <p className="mt-1 break-words text-sm text-gray-600">{subtitle}</p>}</div>
      <PrintActions />
    </div>
    <div className="mb-4 border-b pb-2 text-xs text-gray-500">Generated: {new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })} PKT</div>
    {children}
    <footer className="mt-8 border-t pt-2 text-xs text-gray-500">Construction Cost Control · Generated from authorized project records</footer>
  </article>;
}

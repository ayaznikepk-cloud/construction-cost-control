import type { ReactNode } from "react";
import PrintActions from "./PrintActions";

export default function PrintDocument({ title, subtitle, children, landscape = false }: { title: string; subtitle?: string; children: ReactNode; landscape?: boolean }) {
  return <article className={landscape ? "print-document print-landscape" : "print-document"}>
    <div className="mb-5 flex items-start justify-between gap-4">
      <div><div className="text-sm font-semibold uppercase tracking-wide">Construction Cost Control</div><h1 className="mt-2 text-2xl font-bold">{title}</h1>{subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}</div>
      <PrintActions />
    </div>
    <div className="mb-4 border-b pb-2 text-xs text-gray-500">Generated: {new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })} PKT</div>
    {children}
    <footer className="mt-8 border-t pt-2 text-xs text-gray-500">Construction Cost Control · Generated from authorized project records</footer>
  </article>;
}

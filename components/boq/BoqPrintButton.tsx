"use client";

export default function BoqPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 print:hidden"
    >
      Print BOQ
    </button>
  );
}

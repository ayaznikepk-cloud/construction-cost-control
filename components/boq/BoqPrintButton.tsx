"use client";

export default function BoqPrintButton({ targetId = "boq-print-area" }: { targetId?: string }) {
  function printBoq() {
    const target = document.getElementById(targetId);
    if (!target) return;

    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Bill of Quantities</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            * { box-sizing: border-box; }
            body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111827; font-size: 10px; }
            h2 { margin: 0 0 4px; font-size: 18px; }
            p { margin: 0; }
            .print-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 14px 0; }
            .print-summary > div { border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; break-inside: avoid; }
            .print-summary .text-xs { font-size: 9px; color: #6b7280; }
            .print-summary .text-lg { font-size: 13px; font-weight: 700; margin-top: 3px; }
            .print-table-wrap { overflow: visible !important; border: 1px solid #d1d5db; border-radius: 6px; }
            table { width: 100%; border-collapse: collapse; table-layout: auto; font-size: 8px; }
            thead { display: table-header-group; }
            tr { break-inside: avoid; }
            th, td { border-bottom: 1px solid #e5e7eb; padding: 5px 6px; vertical-align: top; }
            th { background: #f3f4f6; text-align: left; font-weight: 700; }
            th:nth-child(n+3), td:nth-child(n+3) { text-align: right; }
            th:nth-child(4), td:nth-child(4) { text-align: left; }
            td:nth-child(2) { min-width: 260px; white-space: normal; }
            .boq-section-row td { background: #f3f4f6; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; }
            .boq-description-row td { background: #f8fafc; font-weight: 700; }
            .boq-screen-only, .boq-locked-label, .boq-actions { display: none !important; }
            .print-only-header { display: block !important; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          ${target.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  }

  return (
    <button
      type="button"
      onClick={printBoq}
      className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
    >
      Print BOQ
    </button>
  );
}

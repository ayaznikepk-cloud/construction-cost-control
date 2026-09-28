import Link from "next/link";

export default function LabourPaymentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Labour Payments</h1>
      <div className="mb-6 flex gap-1 border-b border-border">
        <Link
          href="/labour-payments"
          className="border-b-2 border-transparent px-4 py-2 text-sm text-gray-600 hover:border-active hover:text-active"
        >
          Worker Ledger
        </Link>
        <Link
          href="/labour-payments/wage-sheets"
          className="border-b-2 border-transparent px-4 py-2 text-sm text-gray-600 hover:border-active hover:text-active"
        >
          Wage Sheets
        </Link>
      </div>
      {children}
    </div>
  );
}

export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import PrintDocument from "@/components/print/PrintDocument";
import { pkr } from "@/lib/format";

const fields = ["total_wages_earned", "total_paid", "outstanding_wage_payable", "outstanding_advance"] as const;

export default async function LabourPaymentsPrint({ searchParams }: { searchParams: { worker?: string; balance?: string } }) {
  const s = createClient();
  // This is the same authorized payable view used on the labour payments screen.
  // Fetch all matching rows in pages to avoid truncation of printed reports.
  const ledger: any[] = [];
  let errorMessage = "";
  for (let offset = 0; offset < 100000; offset += 1000) {
    const { data, error } = await s.from("v_worker_payable").select("*").order("worker_name").range(offset, offset + 999);
    if (error) { errorMessage = error.message; break; }
    ledger.push(...(data ?? []));
    if ((data ?? []).length < 1000) break;
    if (offset === 99000) errorMessage = "Report is too large; narrow the filters.";
  }
  const worker = ledger.some(l => String(l.worker_id) === searchParams.worker) ? searchParams.worker! : "all";
  const balance = ["payable", "advance"].includes(searchParams.balance ?? "") ? searchParams.balance! : "all";
  const filtered = ledger.filter(l => (worker === "all" || String(l.worker_id) === worker) && (balance === "all" || (balance === "payable" ? Number(l.outstanding_wage_payable ?? 0) !== 0 : Number(l.outstanding_advance ?? 0) !== 0)));
  const totals = fields.map(f => filtered.reduce((sum, l) => sum + Number(l[f] ?? 0), 0));
  return <PrintDocument title="Labour Payment Ledger" subtitle="Approved wages, payments and outstanding advances · PKR" landscape>
    <form method="GET" className="no-print mb-4 flex flex-wrap items-end gap-3 text-sm">
      <label>Worker <select name="worker" defaultValue={worker} className="block max-w-xs rounded border p-2"><option value="all">All workers</option>{ledger.map(l => <option key={l.worker_id} value={l.worker_id}>{l.worker_name}</option>)}</select></label>
      <label>Balance <select name="balance" defaultValue={balance} className="block rounded border p-2"><option value="all">All balances</option><option value="payable">Wages payable</option><option value="advance">Advance outstanding</option></select></label>
      <button className="rounded border px-3 py-2">Apply filters</button>
    </form>
    {errorMessage ? <p role="alert">Unable to load complete labour ledger: {errorMessage}</p> : <>
      <p className="mb-3 text-sm">{filtered.length} worker(s) · Wages payable: <strong>{pkr(totals[2])}</strong> · Advances outstanding: <strong>{pkr(totals[3])}</strong></p>
      <table className="print-table w-full text-right text-xs"><thead><tr><th className="text-left">Worker</th><th>Wages earned</th><th>Paid</th><th>Wages payable</th><th>Advance outstanding</th></tr></thead>
        <tbody>{filtered.map(l => <tr key={l.worker_id}><td className="text-left">{l.worker_name}</td>{fields.map(f => <td key={f}>{pkr(l[f])}</td>)}</tr>)}</tbody>
        <tfoot><tr><th className="text-left">Total</th>{totals.map((n,i) => <th key={fields[i]}>{pkr(n)}</th>)}</tr></tfoot>
      </table>
      <p className="mt-4 text-xs text-gray-500">Balances reflect the current ledger view, not a historical date-specific snapshot.</p>
      <div className="mt-12 grid grid-cols-3 gap-8 text-center text-xs"><span className="border-t pt-2">Prepared by</span><span className="border-t pt-2">Checked by</span><span className="border-t pt-2">Approved by</span></div>
    </>}
  </PrintDocument>;
}

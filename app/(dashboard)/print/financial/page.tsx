export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import PrintDocument from "@/components/print/PrintDocument";

const money = (v: unknown) => Number(v ?? 0).toLocaleString("en-PK", { maximumFractionDigits: 0 });
const fields = ["contract_value", "work_executed_value", "actual_cost", "amount_passed", "amount_received", "receivable", "supplier_payable"] as const;

export default async function PrintFinancial({ searchParams }: { searchParams: { project?: string } }) {
  const supabase = createClient();
  const { data: all, error } = await supabase.from("v_project_financial_summary").select("*").order("project_name");
  const selected = searchParams.project ?? "all";
  const projects = (all ?? []).filter(p => selected === "all" || String(p.project_id) === selected);
  const totals = fields.map(field => projects.reduce((sum, p) => sum + Number(p[field] ?? 0), 0));
  return <PrintDocument title="Project Financial Summary" subtitle={selected === "all" ? "All accessible projects" : projects[0]?.project_name ?? "Selected project"} landscape>
    <form method="GET" className="no-print mb-5 flex flex-wrap items-center gap-2">
      <label htmlFor="project" className="text-sm">Project</label>
      <select id="project" name="project" defaultValue={selected} className="max-w-sm rounded border p-2 text-sm">
        <option value="all">All projects</option>{(all ?? []).map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
      </select>
      <button className="rounded border px-3 py-2 text-sm">Apply filter</button>
    </form>
    {error ? <p role="alert">Unable to load financial summary: {error.message}</p> : <>
      <p className="mb-3 text-sm">{projects.length} project(s) · Values in PKR</p>
      <table className="print-table w-full text-right text-xs"><thead><tr><th className="text-left">Project</th>{["Contract","Executed","Actual cost","Passed","Received","Receivable","Supplier payable"].map(h => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{projects.map(p => <tr key={p.project_id}><td className="text-left">{p.project_name}</td>{fields.map(f => <td key={f}>{money(p[f])}</td>)}</tr>)}</tbody>
        <tfoot><tr><th className="text-left">Total</th>{totals.map((n, i) => <th key={fields[i]}>{money(n)}</th>)}</tr></tfoot>
      </table>
    </>}
  </PrintDocument>;
}

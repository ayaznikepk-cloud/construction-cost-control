export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import PrintDocument from "@/components/print/PrintDocument";

const money = (v: unknown) => Number(v ?? 0).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export default async function ExpensePrint({ searchParams }: { searchParams: { project?: string; from?: string; to?: string; classification?: string } }) {
  const s = createClient();
  const { data: projects } = await s.from("projects").select("id,project_name").order("project_name");
  const project = (projects ?? []).some(p => p.id === searchParams.project) ? searchParams.project! : "all";
  const classification = ["direct_boq", "overhead"].includes(searchParams.classification ?? "") ? searchParams.classification! : "all";
  const from = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.from ?? "") ? searchParams.from! : "";
  const to = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.to ?? "") ? searchParams.to! : "";
  let query = s.from("expenses").select("id,expense_number,expense_date,project_id,classification,payee,description,amount,status,projects(project_name),expense_categories(name)").order("expense_date", { ascending: true });
  if (project !== "all") query = query.eq("project_id", project);
  if (classification !== "all") query = query.eq("classification", classification);
  if (from) query = query.gte("expense_date", from);
  if (to) query = query.lte("expense_date", to);
  // Supabase returns a limited number of rows per request; paginate to include every authorized matching record.
  const records: any[] = [];
  let errorMessage = "";
  for (let offset = 0; offset < 100000; offset += 1000) {
    const { data, error } = await query.range(offset, offset + 999);
    if (error) { errorMessage = error.message; break; }
    records.push(...(data ?? []));
    if ((data ?? []).length < 1000) break;
    if (offset === 99000) errorMessage = "Too many records; narrow the filters.";
  }
  const total = records.reduce((sum, e) => sum + Number(e.amount ?? 0), 0);
  return <PrintDocument title="Expense Register" subtitle="Project expense transactions · PKR" landscape>
    <form method="GET" className="no-print mb-4 flex flex-wrap items-end gap-2 text-sm">
      <label>Project <select name="project" defaultValue={project} className="block rounded border p-2"><option value="all">All projects</option>{(projects ?? []).map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}</select></label>
      <label>From <input name="from" type="date" defaultValue={from} className="block rounded border p-2"/></label>
      <label>To <input name="to" type="date" defaultValue={to} className="block rounded border p-2"/></label>
      <label>Classification <select name="classification" defaultValue={classification} className="block rounded border p-2"><option value="all">All</option><option value="direct_boq">Direct BOQ</option><option value="overhead">Overhead</option></select></label>
      <button className="rounded border px-3 py-2">Apply filters</button>
    </form>
    {errorMessage ? <p role="alert">Unable to load complete register: {errorMessage}</p> : <>
      <p className="mb-3 text-sm">{records.length} transactions · Total: <strong>Rs {money(total)}</strong></p>
      <table className="print-table w-full text-left text-xs"><thead><tr><th>Date</th><th>Voucher</th><th>Project</th><th>Category</th><th>Classification</th><th>Payee / Description</th><th>Status</th><th className="text-right">Amount (PKR)</th></tr></thead>
      <tbody>{records.map(e => <tr key={e.id}><td>{e.expense_date}</td><td>{e.expense_number ?? "—"}</td><td>{e.projects?.project_name ?? "—"}</td><td>{e.expense_categories?.name ?? "—"}</td><td>{e.classification === "direct_boq" ? "Direct BOQ" : "Overhead"}</td><td>{e.payee ?? "—"}{e.description ? " — " + e.description : ""}</td><td>{e.status}</td><td className="text-right">{money(e.amount)}</td></tr>)}</tbody>
      <tfoot><tr><th colSpan={7}>Total</th><th className="text-right">{money(total)}</th></tr></tfoot></table>
    </>}
  </PrintDocument>;
}

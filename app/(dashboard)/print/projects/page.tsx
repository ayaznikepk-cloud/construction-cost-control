export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import PrintDocument from "@/components/print/PrintDocument";

const money = (v: unknown) => "Rs " + Number(v ?? 0).toLocaleString("en-PK", { maximumFractionDigits: 0 });

export default async function PrintProjects({ searchParams }: { searchParams: { status?: string } }) {
  const status = searchParams.status ?? "all";
  const supabase = createClient();
  let query = supabase.from("projects").select("project_code,project_name,department,location,original_contract_amount,status").order("project_name");
  if (status !== "all") query = query.eq("status", status);
  const { data, error } = await query;
  const total = (data ?? []).reduce((sum, p) => sum + Number(p.original_contract_amount ?? 0), 0);
  return <PrintDocument title="Project Register" subtitle={status === "all" ? "All project statuses" : "Status: " + status} landscape>
    <form method="GET" className="no-print mb-5 flex flex-wrap items-center gap-2">
      <label htmlFor="status" className="text-sm">Project status</label>
      <select id="status" name="status" defaultValue={status} className="rounded border p-2 text-sm">
        <option value="all">All</option><option value="active">Active</option><option value="completed">Completed</option><option value="on_hold">On hold</option>
      </select>
      <button className="rounded border px-3 py-2 text-sm">Apply filter</button>
    </form>
    {error ? <p role="alert">Unable to load project register: {error.message}</p> : <>
      <p className="mb-3 text-sm">{data?.length ?? 0} projects · Total agreement value: <strong>{money(total)}</strong></p>
      <table className="print-table w-full text-left text-xs"><thead><tr><th>Code</th><th>Project</th><th>Department</th><th>Location</th><th>Status</th><th className="text-right">Agreement (PKR)</th></tr></thead>
        <tbody>{(data ?? []).map(p => <tr key={p.project_code}><td>{p.project_code}</td><td>{p.project_name}</td><td>{p.department ?? "—"}</td><td>{p.location ?? "—"}</td><td>{p.status}</td><td className="text-right">{money(p.original_contract_amount)}</td></tr>)}</tbody>
        <tfoot><tr><th colSpan={5}>Total</th><th className="text-right">{money(total)}</th></tr></tfoot>
      </table>
    </>}
  </PrintDocument>;
}

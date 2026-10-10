export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrintDocument from "@/components/print/PrintDocument";
import { pkr } from "@/lib/format";

export default async function ProgressPrint({ params, searchParams }: { params: { projectId: string }; searchParams: { from?: string; to?: string; kind?: string } }) {
  const supabase = createClient();
  const { data: project, error: projectError } = await supabase.from("projects").select("project_code,project_name").eq("id", params.projectId).maybeSingle();
  if (!project && !projectError) notFound();
  const from = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.from ?? "") ? searchParams.from! : "";
  const to = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.to ?? "") ? searchParams.to! : "";
  const kind = searchParams.kind === "measurements" ? "measurements" : "progress";
  const measured = kind === "measurements";
  const dateColumn = measured ? "measurement_date" : "entry_date";
  const table = measured ? "measurements" : "progress_entries";
  let query = supabase.from(table).select(measured
    ? "id,measurement_date,measured_quantity,location,boq_items!inner(project_id,boq_number,description,contract_rate,rate_basis,units(code))"
    : "id,entry_date,quantity_today,boq_items!inner(project_id,boq_number,description,contract_rate,rate_basis,units(code))")
    .eq("boq_items.project_id", params.projectId).order(dateColumn).order("id");
  if (from) query = query.gte(dateColumn, from);
  if (to) query = query.lte(dateColumn, to);
  const rows: any[] = [];
  let errorMessage = projectError?.message ?? "";
  if (!errorMessage) for (let offset = 0; offset < 100000; offset += 1000) {
    const { data, error } = await query.range(offset, offset + 999);
    if (error) { errorMessage = error.message; break; }
    rows.push(...(data ?? []));
    if ((data ?? []).length < 1000) break;
    if (offset === 99000) errorMessage = "Report too large; narrow the date range.";
  }
  const boq = (r: any) => Array.isArray(r.boq_items) ? r.boq_items[0] : r.boq_items;
  const qty = (r: any) => Number(measured ? r.measured_quantity : r.quantity_today) || 0;
  const value = (r: any) => qty(r) * Number(boq(r)?.contract_rate ?? 0) / Number(boq(r)?.rate_basis || 1);
  const total = rows.reduce((sum, r) => sum + value(r), 0);
  return <PrintDocument title={measured ? "Measurement / Certification Register" : "Work Progress Register"} subtitle={project ? project.project_code + " — " + project.project_name : "Project"} landscape>
    <form method="GET" className="no-print mb-4 flex flex-wrap items-center gap-2 text-sm">
      <label htmlFor="kind">Register</label><select id="kind" name="kind" defaultValue={kind} className="rounded border p-2"><option value="progress">Work progress</option><option value="measurements">Measurements</option></select>
      <label htmlFor="from">From</label><input id="from" name="from" type="date" defaultValue={from} className="rounded border p-2"/>
      <label htmlFor="to">To</label><input id="to" name="to" type="date" defaultValue={to} className="rounded border p-2"/>
      <button className="rounded border px-3 py-2">Apply filters</button>
    </form>
    {errorMessage ? <p role="alert">Unable to load complete register: {errorMessage}</p> : <>
      <p className="mb-3 text-sm">{rows.length} records · Total value: <strong>{pkr(total)}</strong></p>
      <table className="print-table w-full text-left text-xs"><thead><tr><th>Date</th><th>BOQ #</th><th>Description / Location</th><th className="text-right">Quantity</th><th>Unit</th><th className="text-right">Value</th></tr></thead>
        <tbody>{rows.map(r => { const b = boq(r); const u = Array.isArray(b?.units) ? b.units[0]?.code : b?.units?.code; return <tr key={r.id}><td>{r[dateColumn]}</td><td>{b?.boq_number ?? "—"}</td><td>{b?.description ?? "—"}{measured && r.location && <div className="text-gray-500">{r.location}</div>}</td><td className="text-right">{qty(r).toLocaleString("en-PK")}</td><td>{u ?? "—"}</td><td className="text-right">{pkr(value(r))}</td></tr>; })}</tbody>
        <tfoot><tr><th colSpan={5}>Total</th><th className="text-right">{pkr(total)}</th></tr></tfoot>
      </table>
      <p className="mt-3 text-xs text-gray-500">{measured ? "Measurement and certification remain separate from billing." : "Executed quantities are not automatically certified or billed."}</p>
    </>}
  </PrintDocument>;
}

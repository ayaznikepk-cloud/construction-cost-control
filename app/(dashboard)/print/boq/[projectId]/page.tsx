export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrintDocument from "@/components/print/PrintDocument";
import { pkr } from "@/lib/format";

export default async function BoqPrintPage({ params }: { params: { projectId: string } }) {
  const supabase = createClient();
  const [{ data: project, error: projectError }, { data: sections, error: sectionsError }] = await Promise.all([
    supabase.from("projects").select("project_code,project_name,original_contract_amount,approved_dnit_mrs_amount,bid_percentage").eq("id", params.projectId).maybeSingle(),
    supabase.from("boq_sections").select("id,name,sort_order").eq("project_id", params.projectId).order("sort_order"),
  ]);
  if (!project && !projectError) notFound();

  const items: any[] = [];
  let errorMessage = projectError?.message ?? sectionsError?.message ?? "";
  if (!errorMessage) {
    for (let offset = 0; offset < 100000; offset += 1000) {
      const { data, error } = await supabase.from("boq_items").select("id,section_id,parent_boq_item_id,boq_number,description,original_quantity,mrs_rate,contract_rate,rate_basis,original_mrs_amount,original_contract_amount,sort_order,units(code)")
        .eq("project_id", params.projectId).order("sort_order").order("id").range(offset, offset + 999);
      if (error) { errorMessage = error.message; break; }
      items.push(...(data ?? []));
      if ((data ?? []).length < 1000) break;
      if (offset === 99000) errorMessage = "BOQ too large to print in one report.";
    }
  }
  const variations: any[] = [];
  const extraItems: any[] = [];
  if (!errorMessage) {
    for (let offset = 0; offset < 100000; offset += 1000) {
      const { data, error } = await supabase.from("boq_variations").select("boq_item_id,approved_quantity,status,boq_items!inner(project_id)").eq("boq_items.project_id",params.projectId).eq("status","approved").range(offset,offset+999);
      if (error) { errorMessage = error.message; break; }
      variations.push(...(data ?? []));
      if ((data ?? []).length < 1000) break;
      if (offset === 99000) errorMessage = "Too many variations to print.";
    }
  }
  if (!errorMessage) {
    for (let offset = 0; offset < 100000; offset += 1000) {
      const { data, error } = await supabase.from("boq_extra_items").select("quantity,approved_rate,status").eq("project_id",params.projectId).eq("status","approved").range(offset,offset+999);
      if (error) { errorMessage = error.message; break; }
      extraItems.push(...(data ?? []));
      if ((data ?? []).length < 1000) break;
      if (offset === 99000) errorMessage = "Too many extra items to print.";
    }
  }
  const { data: executionRows, error: executionError } = await supabase.from("v_boq_cost_summary").select("boq_item_id,executed_quantity").eq("project_id",params.projectId);
  if (executionError) errorMessage = errorMessage || executionError.message;
  const executedByItem = new Map((executionRows ?? []).map(row => [row.boq_item_id, Number(row.executed_quantity ?? 0)]));
  const approvedByItem = new Map<string,number>();
  for (const v of variations) approvedByItem.set(v.boq_item_id,(approvedByItem.get(v.boq_item_id) ?? 0)+Number(v.approved_quantity ?? 0));
  const rateBasis = (i:any) => Number(i.rate_basis || 1);
  const contractAmount = (i:any) => Number(i.original_contract_amount ?? Number(i.original_quantity)*Number(i.contract_rate)/rateBasis(i));
  const mrsAmount = (i:any) => Number(i.original_mrs_amount ?? Number(i.original_quantity)*Number(i.mrs_rate ?? 0)/rateBasis(i));
  const original = items.reduce((s,i)=>s+contractAmount(i),0);
  const mrs = items.reduce((s,i)=>s+mrsAmount(i),0);
  const variationValue = items.reduce((s,i)=>s+(approvedByItem.get(i.id)??0)*Number(i.contract_rate)/rateBasis(i),0);
  const extras = extraItems.reduce((s,i)=>s+Number(i.quantity)*Number(i.approved_rate ?? 0),0);
  const children = new Map<string,number>();
  for (const i of items) if (i.parent_boq_item_id) children.set(i.parent_boq_item_id,(children.get(i.parent_boq_item_id)??0)+contractAmount(i));
  const renderRows = (rows:any[]) => rows.map(i => {
    const unit = Array.isArray(i.units) ? i.units[0]?.code : i.units?.code;
    const heading = !unit;
    const variation = approvedByItem.get(i.id) ?? 0;
    const executed = executedByItem.get(i.id) ?? 0;
    return <tr key={i.id} className={heading ? "bg-slate-50 font-semibold" : ""}>
      <td>{i.parent_boq_item_id ? "↳ " : ""}{i.boq_number}</td>
      <td className={i.parent_boq_item_id ? "pl-5" : ""}>{i.description}</td>
      <td className="text-right">{heading ? "—" : Number(i.original_quantity).toLocaleString("en-PK")}</td>
      <td>{unit ?? "—"}</td>
      <td className="bg-blue-50 text-right">{i.mrs_rate == null ? "—" : Number(i.mrs_rate).toLocaleString("en-PK")}</td>
      <td className="bg-blue-50 text-right">{heading ? "—" : Number(i.contract_rate).toLocaleString("en-PK")}</td>
      <td className="bg-emerald-50 text-right">{heading ? "—" : pkr(mrsAmount(i))}</td>
      <td className="bg-emerald-50 text-right">{heading ? (children.has(i.id) ? pkr(children.get(i.id)!) : "—") : pkr(contractAmount(i))}</td>
      <td className="bg-amber-50 text-right">{heading ? "—" : variation.toLocaleString("en-PK")}</td>
      <td className="bg-amber-50 text-right">{heading ? "—" : (Number(i.original_quantity)+variation).toLocaleString("en-PK")}</td>
      <td className="bg-violet-50 text-right">{heading ? "—" : executed.toLocaleString("en-PK")}</td>
      <td className="bg-violet-50 text-right">{heading ? "—" : pkr(executed * Number(i.contract_rate ?? 0) / rateBasis(i))}</td>
    </tr>;
  });
  const sectionGroups = (sections ?? []).map(s=>({section:s,rows:items.filter(i=>i.section_id===s.id)}));
  return <PrintDocument title="Bill of Quantities" subtitle={project ? `${project.project_code} — ${project.project_name}` : "Project"} landscape>
    {errorMessage ? <p role="alert">Unable to load complete BOQ: {errorMessage}</p> : <>
      <div className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        {[
          ["Approved DNIT / MRS", Number(project?.approved_dnit_mrs_amount ?? 0)],
          ["MRS BOQ Total", mrs],
          ["Award / Agreement", Number(project?.original_contract_amount ?? 0)],
          ["Original Contractor BOQ", original],
          ["Approved Variations", variationValue],
          ["Approved Extra Items", extras],
          ["Revised BOQ Value", original+variationValue+extras],
        ].map(([label,value])=><div key={String(label)} className="rounded border p-2"><div className="text-xs text-gray-500">{label}</div><strong>{pkr(Number(value))}</strong></div>)}
        <div className="rounded border p-2"><div className="text-xs text-gray-500">Below DNIT</div><strong>{project?.bid_percentage == null ? "—" : `${Math.abs(Number(project.bid_percentage)).toFixed(2)}% below`}</strong></div>
      </div>
      <div className="print-table-scroll">
        <table className="print-table w-full text-left text-xs">
          <thead><tr><th>BOQ #</th><th>Description</th><th className="text-right">Original Qty</th><th>Unit</th><th className="bg-blue-100 text-right">MRS Rate</th><th className="bg-blue-100 text-right">Contract Rate</th><th className="bg-emerald-100 text-right">Original MRS Amount</th><th className="bg-emerald-100 text-right">Original Amount</th><th className="bg-amber-100 text-right">Approved Var.</th><th className="bg-amber-100 text-right">Revised Qty</th><th className="bg-violet-100 text-right">Executed Qty</th><th className="bg-violet-100 text-right">Executed Amount</th></tr></thead>
          <tbody>
            {sectionGroups.map(({section,rows})=><>{/* Section names separate BOQ groups */}<tr key={section.id} className="bg-gray-100 font-semibold"><td colSpan={12}>{section.name}</td></tr>{renderRows(rows)}</>)}
            {renderRows(items.filter(i=>!i.section_id))}
            {!items.length && <tr><td colSpan={12}>No BOQ items recorded.</td></tr>}
          </tbody>
        </table>
      </div>
    </>}
  </PrintDocument>;
}

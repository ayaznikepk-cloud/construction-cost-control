export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import AddSectionForm from "@/components/boq/AddSectionForm";
import AddItemForm from "@/components/boq/AddItemForm";
import { VariationForm, ExtraItemForm, ApprovalForm } from "@/components/boq/VariationExtraForms";
import { pkr } from "@/lib/format";

function textValue(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  return value || null;
}
function numberValue(formData: FormData, name: string) {
  const raw = String(formData.get(name) ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}
async function currentUser(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("You must be signed in.");
  return data.user;
}

async function addSection(formData: FormData) {
  "use server";
  const supabase = createClient();
  await currentUser(supabase);
  const projectId = textValue(formData, "project_id");
  const name = textValue(formData, "name");
  const sortOrder = numberValue(formData, "sort_order") ?? 0;
  if (!projectId || !name) throw new Error("Project and section name are required.");
  const { error } = await supabase.from("boq_sections").insert({ project_id: projectId, name, sort_order: sortOrder });
  if (error) throw new Error(`Could not add section: ${error.message}`);
  revalidatePath(`/projects/${projectId}/boq`);
}

async function addItem(formData: FormData) {
  "use server";
  const supabase = createClient();
  const user = await currentUser(supabase);
  const projectId = textValue(formData, "project_id");
  const sectionId = textValue(formData, "section_id");
  const parentId = textValue(formData, "parent_boq_item_id");
  const boqNumber = textValue(formData, "boq_number");
  const description = textValue(formData, "description");
  const unitId = textValue(formData, "unit_id");
  const quantity = numberValue(formData, "original_quantity");
  const mrsRate = numberValue(formData, "mrs_rate");
  const contractRate = numberValue(formData, "contract_rate");
  const sortOrder = numberValue(formData, "sort_order") ?? 0;

  if (!projectId || !boqNumber || !description || !unitId) throw new Error("BOQ number, description and unit are required.");
  if (quantity === null || quantity < 0 || contractRate === null || contractRate < 0 || (mrsRate !== null && mrsRate < 0)) {
    throw new Error("Quantity and rates must be zero or greater.");
  }
  const { data: unitRow } = await supabase.from("units").select("code").eq("id", unitId).maybeSingle();
  if (!unitRow) throw new Error("Selected unit was not found.");
  const rateBasis = unitRow.code.startsWith("%") ? 100 : 1;

  if (sectionId) {
    const { data } = await supabase.from("boq_sections").select("id").eq("id", sectionId).eq("project_id", projectId).maybeSingle();
    if (!data) throw new Error("Selected BOQ section does not belong to this project.");
  }
  if (parentId) {
    const { data } = await supabase.from("boq_items").select("id").eq("id", parentId).eq("project_id", projectId).maybeSingle();
    if (!data) throw new Error("Selected parent item does not belong to this project.");
  }

  const { error } = await supabase.from("boq_items").insert({
    project_id: projectId, section_id: sectionId, parent_boq_item_id: parentId,
    boq_number: boqNumber, description, unit_id: unitId, original_quantity: quantity,
    mrs_rate: mrsRate, contract_rate: contractRate, rate_basis: rateBasis, sort_order: sortOrder,
    created_by: user.id, updated_by: user.id,
  });
  if (error) throw new Error(`Could not add BOQ item: ${error.message}`);
  revalidatePath(`/projects/${projectId}/boq`);
}

async function updateItem(formData: FormData) {
  "use server";
  const supabase = createClient(); const user = await currentUser(supabase);
  const projectId=textValue(formData,"project_id"), itemId=textValue(formData,"item_id");
  const sectionId=textValue(formData,"section_id"), parentId=textValue(formData,"parent_boq_item_id");
  const boqNumber=textValue(formData,"boq_number"), description=textValue(formData,"description"), unitId=textValue(formData,"unit_id");
  const quantity=numberValue(formData,"original_quantity"), mrsRate=numberValue(formData,"mrs_rate"), contractRate=numberValue(formData,"contract_rate"), sortOrder=numberValue(formData,"sort_order")??0;
  if(!projectId||!itemId||!boqNumber||!description||!unitId) throw new Error("BOQ number, description and unit are required.");
  if(quantity===null||quantity<0||contractRate===null||contractRate<0||(mrsRate!==null&&mrsRate<0)) throw new Error("Quantity and rates must be zero or greater.");
  const {data:existing}=await supabase.from("boq_items").select("id,is_locked").eq("id",itemId).eq("project_id",projectId).maybeSingle();
  if(!existing) throw new Error("BOQ item was not found."); if(existing.is_locked) throw new Error("Locked BOQ items cannot be edited.");
  if(parentId===itemId) throw new Error("A BOQ item cannot be its own parent.");
  const {data:unit}=await supabase.from("units").select("code").eq("id",unitId).maybeSingle(); if(!unit) throw new Error("Selected unit was not found.");
  if(sectionId){const {data:s}=await supabase.from("boq_sections").select("id").eq("id",sectionId).eq("project_id",projectId).maybeSingle();if(!s)throw new Error("Selected BOQ section does not belong to this project.");}
  if(parentId){const {data:p}=await supabase.from("boq_items").select("id").eq("id",parentId).eq("project_id",projectId).maybeSingle();if(!p)throw new Error("Selected parent item does not belong to this project.");}
  const {error}=await supabase.from("boq_items").update({section_id:sectionId,parent_boq_item_id:parentId,boq_number:boqNumber,description,unit_id:unitId,original_quantity:quantity,mrs_rate:mrsRate,contract_rate:contractRate,rate_basis:unit.code.startsWith("%")?100:1,sort_order:sortOrder,updated_by:user.id}).eq("id",itemId).eq("project_id",projectId).eq("is_locked",false);
  if(error) throw new Error(`Could not update BOQ item: ${error.message}`); revalidatePath(`/projects/${projectId}/boq`);
}
async function deleteItem(formData: FormData) {
  "use server";
  const supabase=createClient(); await currentUser(supabase); const projectId=textValue(formData,"project_id"),itemId=textValue(formData,"item_id");
  if(!projectId||!itemId) throw new Error("Project and BOQ item are required.");
  const {data:item}=await supabase.from("boq_items").select("is_locked").eq("id",itemId).eq("project_id",projectId).maybeSingle(); if(!item) throw new Error("BOQ item was not found."); if(item.is_locked) throw new Error("Locked BOQ items cannot be deleted.");
  const {error}=await supabase.from("boq_items").delete().eq("id",itemId).eq("project_id",projectId).eq("is_locked",false); if(error) throw new Error(`Could not delete BOQ item: ${error.message}`); revalidatePath(`/projects/${projectId}/boq`);
}



async function addVariation(formData: FormData) {
  "use server";
  const supabase = createClient(); const user = await currentUser(supabase);
  const projectId=textValue(formData,"project_id"), boqItemId=textValue(formData,"boq_item_id");
  const proposed=numberValue(formData,"proposed_quantity");
  const status=textValue(formData,"status") ?? "draft", remarks=textValue(formData,"remarks");
  if(!projectId||!boqItemId||proposed===null) throw new Error("BOQ item and proposed quantity change are required.");
  if(!["draft","submitted"].includes(status)) throw new Error("New variations can only be saved as draft or submitted.");
  const {data:item}=await supabase.from("boq_items").select("id,is_locked").eq("id",boqItemId).eq("project_id",projectId).maybeSingle();
  if(!item) throw new Error("Selected BOQ item does not belong to this project.");
  if(!item.is_locked) throw new Error("Lock the original BOQ before recording variations.");
  const {error}=await supabase.from("boq_variations").insert({boq_item_id:boqItemId,proposed_quantity:proposed,status,remarks,created_by:user.id});
  if(error) throw new Error(`Could not add variation: ${error.message}`); revalidatePath(`/projects/${projectId}/boq`);
}
async function addExtraItem(formData: FormData) {
  "use server";
  const supabase=createClient(); const user=await currentUser(supabase);
  const projectId=textValue(formData,"project_id"),description=textValue(formData,"description"),unitId=textValue(formData,"unit_id");
  const quantity=numberValue(formData,"quantity"),proposedRate=numberValue(formData,"proposed_rate");
  const status=textValue(formData,"status")??"draft";
  if(!projectId||!description||!unitId||quantity===null||quantity<0) throw new Error("Description, unit and a valid quantity are required.");
  if(proposedRate!==null&&proposedRate<0) throw new Error("Rates must be zero or greater.");
  if(!["draft","submitted"].includes(status)) throw new Error("New extra items can only be saved as draft or submitted.");
  const {data:locked}=await supabase.from("boq_items").select("id").eq("project_id",projectId).eq("is_locked",true).limit(1);
  if(!locked?.length) throw new Error("Lock the original BOQ before recording extra items.");
  const {data:unit}=await supabase.from("units").select("id").eq("id",unitId).maybeSingle(); if(!unit) throw new Error("Selected unit was not found.");
  const {error}=await supabase.from("boq_extra_items").insert({project_id:projectId,description,unit_id:unitId,quantity,proposed_rate:proposedRate,status,created_by:user.id});
  if(error) throw new Error(`Could not add extra item: ${error.message}`); revalidatePath(`/projects/${projectId}/boq`);
}


async function decideChange(formData: FormData) {
  "use server";
  const supabase=createClient(); await currentUser(supabase);
  const projectId=textValue(formData,"project_id"),recordId=textValue(formData,"record_id"),kind=textValue(formData,"kind"),decision=textValue(formData,"decision");
  const reference=textValue(formData,"approval_reference"),date=textValue(formData,"approval_date"),remarks=textValue(formData,"approval_remarks");
  if(!projectId||!recordId||!reference||!date||!["variation","extra"].includes(kind??"")||!["approved","rejected"].includes(decision??"")) throw new Error("Decision, approval reference and approval date are required.");
  if(kind==="variation"){
    const approved=numberValue(formData,"approved_quantity");
    const {data:row}=await supabase.from("boq_variations").select("id,status,boq_items!inner(project_id)").eq("id",recordId).eq("boq_items.project_id",projectId).maybeSingle();
    if(!row||row.status!=="submitted") throw new Error("Only submitted variations can be approved or rejected.");
    const {error}=await supabase.from("boq_variations").update({status:decision,approved_quantity:decision==="approved"?approved:null,approval_reference:reference,approval_date:date,remarks:remarks??undefined}).eq("id",recordId).eq("status","submitted");
    if(error) throw new Error(`Could not update variation: ${error.message}`);
  } else {
    const approvedRate=numberValue(formData,"approved_rate");
    if(decision==="approved"&&(approvedRate===null||approvedRate<0)) throw new Error("A valid approved rate is required.");
    const {data:row}=await supabase.from("boq_extra_items").select("id,status").eq("id",recordId).eq("project_id",projectId).maybeSingle();
    if(!row||row.status!=="submitted") throw new Error("Only submitted extra items can be approved or rejected.");
    const {error}=await supabase.from("boq_extra_items").update({status:decision,approved_rate:decision==="approved"?approvedRate:null,approval_reference:reference,approval_date:date}).eq("id",recordId).eq("status","submitted");
    if(error) throw new Error(`Could not update extra item: ${error.message}`);
  }
  revalidatePath(`/projects/${projectId}/boq`);
}

async function lockOriginalBoq(formData: FormData) {
  "use server";
  const supabase = createClient();
  const user = await currentUser(supabase);
  const projectId = textValue(formData, "project_id");
  if (!projectId) throw new Error("Project is required.");
  const { data: items, error: readError } = await supabase.from("boq_items").select("id").eq("project_id", projectId);
  if (readError) throw new Error(`Could not read BOQ: ${readError.message}`);
  if (!items?.length) throw new Error("Add BOQ items before locking the original BOQ.");
  const { error } = await supabase.from("boq_items").update({ is_locked: true, updated_by: user.id }).eq("project_id", projectId).eq("is_locked", false);
  if (error) throw new Error(`Could not lock BOQ: ${error.message}`);
  revalidatePath(`/projects/${projectId}/boq`);
}

type BoqItem = {
  id: string; section_id: string | null; parent_boq_item_id: string | null; boq_number: string;
  description: string; original_quantity: number; mrs_rate: number | null; contract_rate: number;
  rate_basis: number; original_mrs_amount: number | null; original_contract_amount: number | null;
  sort_order: number; is_locked: boolean; unit_id: string | null; units: { code: string } | { code: string }[] | null;
};

export default async function BoqPage({ params, searchParams }: { params: { projectId: string }; searchParams?: { edit?: string } }) {
  const supabase = createClient();
  const [
    { data: project }, { data: sections, error: sectionError }, { data: rawItems, error: itemError },
    { data: units }, { data: costSummary }, { data: variations }, { data: extraItems }
  ] = await Promise.all([
    supabase.from("projects").select("original_contract_amount, approved_dnit_mrs_amount, bid_percentage").eq("id", params.projectId).single(),
    supabase.from("boq_sections").select("*").eq("project_id", params.projectId).order("sort_order"),
    supabase.from("boq_items").select("*, units(code)").eq("project_id", params.projectId).order("sort_order"),
    supabase.from("units").select("*").order("code"),
    supabase.from("v_boq_cost_summary").select("boq_item_id, executed_quantity").eq("project_id", params.projectId),
    supabase.from("boq_variations").select("id, boq_item_id, proposed_quantity, approved_quantity, status, approval_reference, approval_date, remarks, boq_items!inner(project_id,boq_number,description,contract_rate,rate_basis)").eq("boq_items.project_id", params.projectId),
    supabase.from("boq_extra_items").select("id, description, quantity, proposed_rate, approved_rate, status, approval_reference, approval_date, units(code)").eq("project_id", params.projectId),
  ]);
  if (sectionError || itemError) throw new Error(sectionError?.message || itemError?.message);

  const items = (rawItems ?? []) as unknown as BoqItem[];
  const executedByItem = new Map((costSummary ?? []).map((c) => [c.boq_item_id, Number(c.executed_quantity ?? 0)]));
  const approvedVariationByItem = new Map<string, number>();
  for (const v of variations ?? []) if (v.status === "approved") approvedVariationByItem.set(v.boq_item_id, (approvedVariationByItem.get(v.boq_item_id) ?? 0) + Number(v.approved_quantity ?? 0));

  const originalMrsValue = items.reduce((sum, i) => sum + Number(i.original_mrs_amount ?? (Number(i.original_quantity) * Number(i.mrs_rate ?? 0) / Number(i.rate_basis || 1))), 0);
  const originalBoqValue = items.reduce((sum, i) => sum + Number(i.original_contract_amount ?? (Number(i.original_quantity) * Number(i.contract_rate) / Number(i.rate_basis || 1))), 0);
  const approvedVariationValue = items.reduce((sum, i) => sum + (approvedVariationByItem.get(i.id) ?? 0) * Number(i.contract_rate) / Number(i.rate_basis || 1), 0);
  const approvedExtraValue = (extraItems ?? []).filter((e) => e.status === "approved").reduce((sum, e) => sum + Number(e.quantity) * Number(e.approved_rate ?? 0), 0);
  const revisedBoqValue = originalBoqValue + approvedVariationValue + approvedExtraValue;
  const allLocked = items.length > 0 && items.every((i) => i.is_locked);
  const editingItem = !allLocked && searchParams?.edit ? items.find((i) => i.id === searchParams.edit && !i.is_locked) ?? null : null;

  const grouped = (sections ?? []).map((section) => ({ section, items: items.filter((i) => i.section_id === section.id) }));
  const ungrouped = items.filter((i) => !i.section_id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-gray-900">Bill of Quantities</h2><p className="mt-1 text-sm text-gray-500">Original BOQ, approved quantity changes and execution are kept separately.</p></div>
        {!allLocked && items.length > 0 && <form action={lockOriginalBoq}><input type="hidden" name="project_id" value={params.projectId}/><button className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50">Lock original BOQ</button></form>}
        {allLocked && <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">Original BOQ locked</span>}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Approved DNIT / MRS" value={Number(project?.approved_dnit_mrs_amount ?? 0)} />
        <Metric label="MRS BOQ Total" value={originalMrsValue} />
        <Metric label="Award / Agreement" value={Number(project?.original_contract_amount ?? 0)} />
        <Metric label="Below DNIT" text={project?.bid_percentage == null ? "—" : `${Math.abs(Number(project.bid_percentage)).toFixed(2)}% below`} />
        <Metric label="Original Contractor BOQ" value={originalBoqValue} />
        <Metric label="Approved Variations" value={approvedVariationValue} />
        <Metric label="Approved Extra Items" value={approvedExtraValue} />
        <Metric label="Revised BOQ Value" value={revisedBoqValue} />
      </div>

      {!allLocked && <div className="grid gap-4 md:grid-cols-2"><AddSectionForm projectId={params.projectId} action={addSection}/><AddItemForm key={editingItem?.id ?? "new"} projectId={params.projectId} sections={sections ?? []} items={items.filter(i=>i.id!==editingItem?.id).map(i=>({id:i.id,boq_number:i.boq_number,description:i.description}))} units={units ?? []} action={editingItem?updateItem:addItem} editingItem={editingItem}/></div>}
      {allLocked && <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">The original BOQ is locked. Quantity changes are recorded as variations, and non-BOQ work as extra items.</div>}
      {allLocked && <div className="grid gap-4 xl:grid-cols-2"><VariationForm projectId={params.projectId} items={items.map(i=>({id:i.id,boq_number:i.boq_number,description:i.description,original_quantity:i.original_quantity}))} action={addVariation}/><ExtraItemForm projectId={params.projectId} units={units ?? []} action={addExtraItem}/></div>}
      {allLocked && <div className="grid gap-4 xl:grid-cols-2">
        <ChangeRegister title="Variation register" empty="No variations recorded." projectId={params.projectId} action={decideChange} rows={(variations??[]).map((v:any)=>({id:v.id,kind:"variation" as const,name:`${v.boq_items?.boq_number ?? "BOQ"} — ${v.boq_items?.description ?? ""}`,detail:`Proposed Δ ${Number(v.proposed_quantity).toLocaleString()} · Approved Δ ${v.approved_quantity==null?"—":Number(v.approved_quantity).toLocaleString()}`,status:v.status,reference:v.approval_reference,date:v.approval_date,proposedQuantity:Number(v.proposed_quantity)}))}/>
        <ChangeRegister title="Extra item register" empty="No extra items recorded." projectId={params.projectId} action={decideChange} rows={(extraItems??[]).map((e:any)=>({id:e.id,kind:"extra" as const,name:e.description,detail:`${Number(e.quantity).toLocaleString()} ${Array.isArray(e.units)?e.units[0]?.code:e.units?.code ?? ""} · Proposed ${e.proposed_rate==null?"—":pkr(Number(e.proposed_rate))} · Approved ${e.approved_rate==null?"—":pkr(Number(e.approved_rate))}`,status:e.status,reference:e.approval_reference,date:e.approval_date,proposedRate:e.proposed_rate==null?null:Number(e.proposed_rate)}))}/>
      </div>}

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead className="bg-gray-50"><tr className="border-b border-border text-left text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">BOQ #</th><th className="px-4 py-3 font-medium">Full Description</th>
              <th className="px-4 py-3 text-right font-medium">Original Qty</th><th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 text-right font-medium">MRS Rate</th><th className="px-4 py-3 text-right font-medium">Contract Rate</th>
              <th className="px-4 py-3 text-right font-medium">Original Amount</th><th className="px-4 py-3 text-right font-medium">Approved Var.</th>
              <th className="px-4 py-3 text-right font-medium">Revised Qty</th><th className="px-4 py-3 text-right font-medium">Executed</th>{!allLocked&&<th className="px-4 py-3 font-medium">Actions</th>}
            </tr></thead>
            <tbody>
              {grouped.map(({section,items:sectionItems}) => <SectionRows key={section.id} name={section.name} items={sectionItems} executed={executedByItem} variations={approvedVariationByItem} projectId={params.projectId} allLocked={allLocked}/>)}
              {ungrouped.map(item => <BoqRow key={item.id} item={item} executed={executedByItem.get(item.id) ?? 0} variation={approvedVariationByItem.get(item.id) ?? 0} projectId={params.projectId} allLocked={allLocked}/>)}
              {!items.length && <tr><td colSpan={allLocked?10:11} className="px-4 py-10 text-center text-gray-500">No BOQ items yet. Add sections and original BOQ items above.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Metric({label,value,text}:{label:string;value?:number;text?:string}) { return <div className="rounded-lg border border-border bg-white p-4"><div className="text-xs text-gray-500">{label}</div><div className="mt-1 text-lg font-semibold">{text ?? pkr(value ?? 0)}</div></div>; }
function SectionRows({name,items,executed,variations,projectId,allLocked}:{name:string;items:BoqItem[];executed:Map<string,number>;variations:Map<string,number>;projectId:string;allLocked:boolean}) {
  return <><tr className="bg-gray-50"><td colSpan={allLocked?10:11} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-600">{name}</td></tr>{items.map(item=><BoqRow key={item.id} item={item} executed={executed.get(item.id)??0} variation={variations.get(item.id)??0} projectId={projectId} allLocked={allLocked}/>)}</>;
}
function BoqRow({item,executed,variation,projectId,allLocked}:{item:BoqItem;executed:number;variation:number;projectId:string;allLocked:boolean}) {
  const unit = Array.isArray(item.units) ? item.units[0]?.code : item.units?.code;
  const revised = Number(item.original_quantity)+variation;
  const amount = Number(item.original_contract_amount ?? (Number(item.original_quantity) * Number(item.contract_rate) / Number(item.rate_basis || 1)));
  return <tr className="border-b border-border align-top last:border-0 hover:bg-gray-50">
    <td className="whitespace-nowrap px-4 py-3 font-medium">{item.boq_number}{item.is_locked && <span className="ml-2 text-[10px] text-gray-400">LOCKED</span>}</td>
    <td className="min-w-[360px] max-w-xl whitespace-normal px-4 py-3 leading-5 text-gray-700">{item.description}</td>
    <td className="px-4 py-3 text-right tabular-nums">{Number(item.original_quantity).toLocaleString()}</td><td className="px-4 py-3">{unit ?? "—"}</td>
    <td className="px-4 py-3 text-right tabular-nums">{item.mrs_rate == null ? "—" : Number(item.mrs_rate).toLocaleString()}</td>
    <td className="px-4 py-3 text-right tabular-nums">{Number(item.contract_rate).toLocaleString()}</td><td className="px-4 py-3 text-right tabular-nums">{pkr(amount)}</td>
    <td className="px-4 py-3 text-right tabular-nums">{variation.toLocaleString()}</td><td className="px-4 py-3 text-right tabular-nums">{revised.toLocaleString()}</td>
    <td className="px-4 py-3 text-right tabular-nums">{executed.toLocaleString()}</td>
    {!allLocked&&<td className="whitespace-nowrap px-4 py-3">{item.is_locked?<span className="text-xs text-gray-400">Locked</span>:<><a href={`/projects/${projectId}/boq?edit=${item.id}`} className="mr-3 font-medium text-blue-600 hover:underline">Edit</a><form action={deleteItem} className="inline"><input type="hidden" name="project_id" value={projectId}/><input type="hidden" name="item_id" value={item.id}/><button className="font-medium text-red-600 hover:underline">Delete</button></form></>}</td>}
  </tr>;
}

function ChangeRegister({title,empty,rows,projectId,action}:{title:string;empty:string;projectId:string;action:(formData:FormData)=>Promise<void>;rows:{id:string;kind:"variation"|"extra";name:string;detail:string;status:string;reference?:string|null;date?:string|null;proposedQuantity?:number|null;proposedRate?:number|null}[]}) {
 return <div className="overflow-hidden rounded-xl border border-border bg-white"><div className="border-b border-border px-4 py-3 font-medium">{title}</div>{!rows.length?<div className="px-4 py-8 text-sm text-gray-500">{empty}</div>:<div className="divide-y divide-border">{rows.map(r=><div key={r.id} className="px-4 py-3"><div className="flex items-start justify-between gap-3"><div className="font-medium text-gray-900">{r.name}</div><span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-medium uppercase text-gray-600">{r.status}</span></div><div className="mt-1 text-sm text-gray-600">{r.detail}</div>{(r.reference||r.date)&&<div className="mt-1 text-xs text-gray-500">{r.reference||"No reference"}{r.date?` · ${r.date}`:""}</div>}{r.status==="submitted"&&<ApprovalForm kind={r.kind} id={r.id} projectId={projectId} proposedQuantity={r.proposedQuantity} proposedRate={r.proposedRate} action={action}/>}</div>)}</div>}</div>
}

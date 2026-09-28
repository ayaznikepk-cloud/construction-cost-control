export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import AddSectionForm from "@/components/boq/AddSectionForm";
import AddItemForm from "@/components/boq/AddItemForm";
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
    mrs_rate: mrsRate, contract_rate: contractRate, sort_order: sortOrder,
    created_by: user.id, updated_by: user.id,
  });
  if (error) throw new Error(`Could not add BOQ item: ${error.message}`);
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
  sort_order: number; is_locked: boolean; units: { code: string } | { code: string }[] | null;
};

export default async function BoqPage({ params }: { params: { projectId: string } }) {
  const supabase = createClient();
  const [
    { data: project }, { data: sections, error: sectionError }, { data: rawItems, error: itemError },
    { data: units }, { data: costSummary }, { data: variations }, { data: extraItems }
  ] = await Promise.all([
    supabase.from("projects").select("original_contract_amount").eq("id", params.projectId).single(),
    supabase.from("boq_sections").select("*").eq("project_id", params.projectId).order("sort_order"),
    supabase.from("boq_items").select("*, units(code)").eq("project_id", params.projectId).order("sort_order"),
    supabase.from("units").select("*").order("code"),
    supabase.from("v_boq_cost_summary").select("boq_item_id, executed_quantity").eq("project_id", params.projectId),
    supabase.from("boq_variations").select("boq_item_id, approved_quantity, status, boq_items!inner(project_id)").eq("boq_items.project_id", params.projectId),
    supabase.from("boq_extra_items").select("quantity, approved_rate, status").eq("project_id", params.projectId),
  ]);
  if (sectionError || itemError) throw new Error(sectionError?.message || itemError?.message);

  const items = (rawItems ?? []) as unknown as BoqItem[];
  const executedByItem = new Map((costSummary ?? []).map((c) => [c.boq_item_id, Number(c.executed_quantity ?? 0)]));
  const approvedVariationByItem = new Map<string, number>();
  for (const v of variations ?? []) if (v.status === "approved") approvedVariationByItem.set(v.boq_item_id, (approvedVariationByItem.get(v.boq_item_id) ?? 0) + Number(v.approved_quantity ?? 0));

  const originalBoqValue = items.reduce((sum, i) => sum + Number(i.original_quantity) * Number(i.contract_rate), 0);
  const approvedVariationValue = items.reduce((sum, i) => sum + (approvedVariationByItem.get(i.id) ?? 0) * Number(i.contract_rate), 0);
  const approvedExtraValue = (extraItems ?? []).filter((e) => e.status === "approved").reduce((sum, e) => sum + Number(e.quantity) * Number(e.approved_rate ?? 0), 0);
  const revisedBoqValue = originalBoqValue + approvedVariationValue + approvedExtraValue;
  const allLocked = items.length > 0 && items.every((i) => i.is_locked);

  const grouped = (sections ?? []).map((section) => ({ section, items: items.filter((i) => i.section_id === section.id) }));
  const ungrouped = items.filter((i) => !i.section_id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-gray-900">Bill of Quantities</h2><p className="mt-1 text-sm text-gray-500">Original BOQ, approved quantity changes and execution are kept separately.</p></div>
        {!allLocked && items.length > 0 && <form action={lockOriginalBoq}><input type="hidden" name="project_id" value={params.projectId}/><button className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50">Lock original BOQ</button></form>}
        {allLocked && <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">Original BOQ locked</span>}
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Metric label="Award / Agreement" value={Number(project?.original_contract_amount ?? 0)} />
        <Metric label="Original BOQ Value" value={originalBoqValue} />
        <Metric label="Approved Variations" value={approvedVariationValue} />
        <Metric label="Approved Extra Items" value={approvedExtraValue} />
        <Metric label="Revised BOQ Value" value={revisedBoqValue} />
      </div>

      {!allLocked && <div className="grid gap-4 md:grid-cols-2"><AddSectionForm projectId={params.projectId} action={addSection}/><AddItemForm projectId={params.projectId} sections={sections ?? []} items={items.map(i=>({id:i.id,boq_number:i.boq_number,description:i.description}))} units={units ?? []} action={addItem}/></div>}
      {allLocked && <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">The original BOQ is locked. Quantity changes should now be recorded as variations, and non-BOQ work as extra items.</div>}

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead className="bg-gray-50"><tr className="border-b border-border text-left text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">BOQ #</th><th className="px-4 py-3 font-medium">Full Description</th>
              <th className="px-4 py-3 text-right font-medium">Original Qty</th><th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 text-right font-medium">MRS Rate</th><th className="px-4 py-3 text-right font-medium">Contract Rate</th>
              <th className="px-4 py-3 text-right font-medium">Original Amount</th><th className="px-4 py-3 text-right font-medium">Approved Var.</th>
              <th className="px-4 py-3 text-right font-medium">Revised Qty</th><th className="px-4 py-3 text-right font-medium">Executed</th>
            </tr></thead>
            <tbody>
              {grouped.map(({section,items:sectionItems}) => <SectionRows key={section.id} name={section.name} items={sectionItems} executed={executedByItem} variations={approvedVariationByItem}/>)}
              {ungrouped.map(item => <BoqRow key={item.id} item={item} executed={executedByItem.get(item.id) ?? 0} variation={approvedVariationByItem.get(item.id) ?? 0}/>)}
              {!items.length && <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-500">No BOQ items yet. Add sections and original BOQ items above.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Metric({label,value}:{label:string;value:number}) { return <div className="rounded-lg border border-border bg-white p-4"><div className="text-xs text-gray-500">{label}</div><div className="mt-1 text-lg font-semibold">{pkr(value)}</div></div>; }
function SectionRows({name,items,executed,variations}:{name:string;items:BoqItem[];executed:Map<string,number>;variations:Map<string,number>}) {
  return <><tr className="bg-gray-50"><td colSpan={10} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-600">{name}</td></tr>{items.map(item=><BoqRow key={item.id} item={item} executed={executed.get(item.id)??0} variation={variations.get(item.id)??0}/>)}</>;
}
function BoqRow({item,executed,variation}:{item:BoqItem;executed:number;variation:number}) {
  const unit = Array.isArray(item.units) ? item.units[0]?.code : item.units?.code;
  const revised = Number(item.original_quantity)+variation;
  const amount = Number(item.original_quantity)*Number(item.contract_rate);
  return <tr className="border-b border-border align-top last:border-0 hover:bg-gray-50">
    <td className="whitespace-nowrap px-4 py-3 font-medium">{item.boq_number}{item.is_locked && <span className="ml-2 text-[10px] text-gray-400">LOCKED</span>}</td>
    <td className="min-w-[360px] max-w-xl whitespace-normal px-4 py-3 leading-5 text-gray-700">{item.description}</td>
    <td className="px-4 py-3 text-right tabular-nums">{Number(item.original_quantity).toLocaleString()}</td><td className="px-4 py-3">{unit ?? "—"}</td>
    <td className="px-4 py-3 text-right tabular-nums">{item.mrs_rate == null ? "—" : Number(item.mrs_rate).toLocaleString()}</td>
    <td className="px-4 py-3 text-right tabular-nums">{Number(item.contract_rate).toLocaleString()}</td><td className="px-4 py-3 text-right tabular-nums">{pkr(amount)}</td>
    <td className="px-4 py-3 text-right tabular-nums">{variation.toLocaleString()}</td><td className="px-4 py-3 text-right tabular-nums">{revised.toLocaleString()}</td>
    <td className="px-4 py-3 text-right tabular-nums">{executed.toLocaleString()}</td>
  </tr>;
}

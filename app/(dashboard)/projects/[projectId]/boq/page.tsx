export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import AddSectionForm from "@/components/boq/AddSectionForm";
import AddItemForm from "@/components/boq/AddItemForm";

async function addSection(formData: FormData) {
  "use server";
  const supabase = createClient();
  const { error } = await supabase.from("boq_sections").insert({
    project_id: formData.get("project_id"),
    name: formData.get("name"),
    sort_order: Number(formData.get("sort_order") ?? 0),
  });
  if (error) throw new Error(`Could not add section: ${error.message}`);
  revalidatePath(`/projects/${formData.get("project_id")}/boq`);
}

async function addItem(formData: FormData) {
  "use server";
  const supabase = createClient();
  const projectId = formData.get("project_id") as string;

  const { error } = await supabase.from("boq_items").insert({
    project_id: projectId,
    section_id: formData.get("section_id") || null,
    boq_number: formData.get("boq_number"),
    description: formData.get("description"),
    unit_id: formData.get("unit_id"),
    original_quantity: Number(formData.get("original_quantity")),
    mrs_rate: formData.get("mrs_rate") ? Number(formData.get("mrs_rate")) : null,
    contract_rate: Number(formData.get("contract_rate")),
  });

  if (error) throw new Error(`Could not add BOQ item: ${error.message}`);

  revalidatePath(`/projects/${projectId}/boq`);
}

export default async function BoqPage({ params }: { params: { projectId: string } }) {
  const supabase = createClient();

  const [{ data: sections }, { data: items }, { data: units }, { data: costSummary }] =
    await Promise.all([
      supabase
        .from("boq_sections")
        .select("*")
        .eq("project_id", params.projectId)
        .order("sort_order"),
      supabase
        .from("boq_items")
        .select("*, units(code)")
        .eq("project_id", params.projectId)
        .order("sort_order"),
      supabase.from("units").select("*").order("code"),
      supabase
        .from("v_boq_cost_summary")
        .select("boq_item_id, executed_quantity, contract_value"),
    ]);

  const executedByItem = new Map(
    (costSummary ?? []).map((c) => [c.boq_item_id, c.executed_quantity])
  );

  const originalTotal = (items ?? []).reduce(
    (sum, i) => sum + Number(i.original_quantity) * Number(i.contract_rate),
    0
  );

  const grouped = (sections ?? []).map((s) => ({
    section: s,
    items: (items ?? []).filter((i) => i.section_id === s.id),
  }));
  const ungrouped = (items ?? []).filter((i) => !i.section_id);

  return (
    <div>
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-white p-4">
          <div className="text-xs text-gray-500">Original Contract</div>
          <div className="mt-1 text-lg font-semibold">
            Rs {originalTotal.toLocaleString("en-PK", { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-white p-4">
          <div className="text-xs text-gray-500">Approved Variations</div>
          <div className="mt-1 text-lg font-semibold text-gray-400">Rs 0</div>
        </div>
        <div className="rounded-lg border border-border bg-white p-4">
          <div className="text-xs text-gray-500">Revised Contract</div>
          <div className="mt-1 text-lg font-semibold">
            Rs {originalTotal.toLocaleString("en-PK", { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <AddSectionForm projectId={params.projectId} action={addSection} />
        <AddItemForm
          projectId={params.projectId}
          sections={sections ?? []}
          units={units ?? []}
          action={addItem}
        />
      </div>

      <div className="rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-gray-500">
              <th className="px-4 py-2 font-medium">BOQ #</th>
              <th className="px-4 py-2 font-medium">Description</th>
              <th className="px-4 py-2 font-medium">Qty</th>
              <th className="px-4 py-2 font-medium">Unit</th>
              <th className="px-4 py-2 font-medium">MRS Rate</th>
              <th className="px-4 py-2 font-medium">Contract Rate</th>
              <th className="px-4 py-2 font-medium">Contract Amount</th>
              <th className="px-4 py-2 font-medium">Executed</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map(({ section, items: sectionItems }) => (
              <>
                <tr key={section.id} className="bg-gray-50">
                  <td colSpan={8} className="px-4 py-2 text-xs font-semibold text-gray-600">
                    {section.name}
                  </td>
                </tr>
                {sectionItems.map((item) => (
                  <BoqRow key={item.id} item={item} executed={executedByItem.get(item.id)} />
                ))}
              </>
            ))}
            {ungrouped.map((item) => (
              <BoqRow key={item.id} item={item} executed={executedByItem.get(item.id)} />
            ))}
            {(items ?? []).length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-500">
                  No BOQ items yet — add your first one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BoqRow({
  item,
  executed,
}: {
  item: any;
  executed: number | undefined;
}) {
  const amount = Number(item.original_quantity) * Number(item.contract_rate);
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-2">{item.boq_number}</td>
      <td className="max-w-xs truncate px-4 py-2" title={item.description}>
        {item.description}
      </td>
      <td className="px-4 py-2">{Number(item.original_quantity).toLocaleString()}</td>
      <td className="px-4 py-2">{item.units?.code}</td>
      <td className="px-4 py-2">
        {item.mrs_rate ? Number(item.mrs_rate).toLocaleString() : "—"}
      </td>
      <td className="px-4 py-2">{Number(item.contract_rate).toLocaleString()}</td>
      <td className="px-4 py-2">Rs {amount.toLocaleString("en-PK", { maximumFractionDigits: 0 })}</td>
      <td className="px-4 py-2">{executed ? Number(executed).toLocaleString() : "0"}</td>
    </tr>
  );
}

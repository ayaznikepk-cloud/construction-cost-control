import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const value = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

async function addMaterial(formData: FormData) {
  "use server";
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in required.");

  const { data: userRow, error: userError } = await supabase
    .from("users").select("org_id").eq("id", user.id).single();
  if (userError || !userRow?.org_id) throw new Error("Organization not found.");

  const materialCode = value(formData, "material_code").toUpperCase();
  const name = value(formData, "name").replace(/\s+/g, " ");
  const category = value(formData, "category") || null;
  const baseUnitId = value(formData, "base_unit_id");
  if (!materialCode || !name || !baseUnitId) throw new Error("Code, material name and unit are required.");

  const { data: existing, error: checkError } = await supabase
    .from("materials").select("material_code,name").eq("org_id", userRow.org_id);
  if (checkError) throw new Error(checkError.message);
  const duplicate = (existing ?? []).some((m: any) =>
    String(m.material_code).trim().toLowerCase() === materialCode.toLowerCase() ||
    String(m.name).replace(/\s+/g, " ").trim().toLowerCase() === name.toLowerCase()
  );
  if (duplicate) throw new Error("A material with this code or name already exists.");

  const { error } = await supabase.from("materials").insert({
    org_id: userRow.org_id, material_code: materialCode, name, category, base_unit_id: baseUnitId
  });
  if (error) throw new Error(error.message);
  revalidatePath("/setup/materials");
  revalidatePath("/purchases");
}

export const dynamic = "force-dynamic";

export default async function MaterialsSetupPage() {
  const supabase = createClient();
  const [{ data: units }, { data: materials, error }] = await Promise.all([
    supabase.from("units").select("id,code,label").order("code"),
    supabase.from("materials").select("id,material_code,name,category,units:base_unit_id(code,label)").order("category").order("name")
  ]);

  return <div className="space-y-5">
    <div><h1 className="text-xl font-semibold">Materials</h1>
      <p className="text-sm text-muted-foreground">Maintain the material master used in purchases, stock receipts and material issues.</p>
    </div>

    <section className="rounded-xl border border-border bg-white p-4">
      <h2 className="font-semibold">Add material</h2>
      <p className="mb-4 text-sm text-muted-foreground">New materials become available immediately in Purchases.</p>
      <form action={addMaterial} className="grid gap-3 md:grid-cols-4">
        <input name="material_code" required placeholder="Material code e.g. CEM-001" className="rounded-md border px-3 py-2 text-sm" />
        <input name="name" required placeholder="Material name" className="rounded-md border px-3 py-2 text-sm" />
        <input name="category" placeholder="Category e.g. Cement" className="rounded-md border px-3 py-2 text-sm" />
        <select name="base_unit_id" required className="rounded-md border px-3 py-2 text-sm">
          <option value="">Select base unit</option>
          {(units ?? []).map((u: any) => <option key={u.id} value={u.id}>{u.code} — {u.label}</option>)}
        </select>
        <button type="submit" className="md:col-span-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Add material</button>
      </form>
    </section>

    <section className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="border-b px-4 py-3 font-semibold">Material register</div>
      {error ? <p className="p-4 text-sm text-red-600">{error.message}</p> :
       (materials ?? []).length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No materials configured yet.</p> :
       <div className="overflow-x-auto"><table className="w-full text-sm">
        <thead><tr className="border-b bg-gray-50 text-left text-xs text-muted-foreground">
          <th className="px-4 py-2">Code</th><th>Material</th><th>Category</th><th className="px-4">Base Unit</th>
        </tr></thead>
        <tbody>{(materials ?? []).map((m: any) => <tr key={m.id} className="border-b last:border-0">
          <td className="px-4 py-3 font-medium">{m.material_code}</td><td>{m.name}</td><td>{m.category || "—"}</td>
          <td className="px-4">{m.units?.code || "—"}</td>
        </tr>)}</tbody>
       </table></div>}
    </section>
  </div>;
}

export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const value = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

async function addSubcontractor(formData: FormData) {
  "use server";
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in required.");
  const { data: userRow, error: userError } = await supabase.from("users").select("org_id").eq("id", user.id).single();
  if (userError || !userRow?.org_id) throw new Error("Could not determine your organization.");
  const name = value(formData, "name").replace(/\s+/g, " ").trim();
  if (!name) throw new Error("Subcontractor name is required.");
  const { data: existing, error: checkError } = await supabase.from("subcontractors").select("id,name").eq("org_id", userRow.org_id);
  if (checkError) throw new Error(`Could not check subcontractors: ${checkError.message}`);
  if ((existing ?? []).some((x) => x.name.replace(/\s+/g, " ").trim().toLocaleLowerCase() === name.toLocaleLowerCase())) throw new Error("A subcontractor with this name already exists.");
  const { error } = await supabase.from("subcontractors").insert({ org_id: userRow.org_id, name, status: "active" });
  if (error) throw new Error(`Could not add subcontractor: ${error.message}`);
  revalidatePath("/setup/subcontractors"); revalidatePath("/subcontractors");
}

async function setStatus(formData: FormData) {
  "use server";
  const supabase = createClient(); const id = value(formData,"id"), status=value(formData,"status");
  if (!id || !["active","inactive"].includes(status)) throw new Error("Invalid subcontractor status.");
  const { error } = await supabase.from("subcontractors").update({status}).eq("id",id);
  if (error) throw new Error(`Could not update subcontractor: ${error.message}`);
  revalidatePath("/setup/subcontractors"); revalidatePath("/subcontractors");
}

export default async function Page() {
  const supabase=createClient();
  const {data:rows,error}=await supabase.from("subcontractors").select("id,name,status").order("name");
  return <div className="space-y-5"><div><h1 className="text-xl font-semibold">Subcontractor Setup</h1><p className="text-sm text-gray-500">Maintain the subcontractor master list used when creating project subcontracts.</p></div>
    <form action={addSubcontractor} className="rounded-xl border border-border bg-white p-4"><h2 className="font-semibold">Add subcontractor</h2><p className="mt-1 text-sm text-gray-500">Active subcontractors become available immediately in Finance → Subcontractors.</p><div className="mt-4 flex flex-col gap-3 sm:flex-row"><input name="name" required placeholder="Subcontractor / firm name *" className="min-w-0 flex-1 rounded-md border border-border px-3 py-2 text-sm"/><button className="rounded-md bg-active px-4 py-2 text-sm font-medium text-white">Add subcontractor</button></div></form>
    <section className="overflow-hidden rounded-xl border border-border bg-white"><div className="border-b border-border px-4 py-3 font-semibold">Subcontractor register</div>{error?<p className="p-4 text-sm text-red-600">Could not load subcontractors: {error.message}</p>:!(rows??[]).length?<p className="p-6 text-center text-sm text-gray-500">No subcontractors yet — add your first subcontractor above.</p>:<div className="divide-y">{(rows??[]).map(x=><div key={x.id} className="flex items-center justify-between gap-3 p-4"><div className="min-w-0"><div className="truncate font-medium">{x.name}</div><div className="text-xs capitalize text-gray-500">{x.status}</div></div><form action={setStatus}><input type="hidden" name="id" value={x.id}/><input type="hidden" name="status" value={x.status==="active"?"inactive":"active"}/><button className="rounded-md border border-border px-3 py-1.5 text-xs">{x.status==="active"?"Deactivate":"Activate"}</button></form></div>)}</div>}</section></div>;
}

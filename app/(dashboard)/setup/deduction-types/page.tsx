export const dynamic="force-dynamic";
import {createClient} from "@/lib/supabase/server";
import {revalidatePath} from "next/cache";

const val=(f:FormData,n:string)=>String(f.get(n)??"").trim();

async function addDeductionType(f:FormData){"use server";
  const s=createClient();
  const {data:{user}}=await s.auth.getUser();
  if(!user) throw new Error("Sign in required.");
  const name=val(f,"name"),description=val(f,"description");
  if(!name) throw new Error("Deduction type name is required.");
  const {data:u}=await s.from("users").select("org_id").eq("id",user.id).maybeSingle();
  if(!u?.org_id) throw new Error("Organization not found.");
  const {error}=await s.from("deduction_types").insert({org_id:u.org_id,name,description:description||null});
  if(error) throw new Error("Could not add deduction type: "+error.message);
  revalidatePath("/setup/deduction-types");
}

export default async function Page(){
  const s=createClient();
  const {data:{user}}=await s.auth.getUser();
  const {data:u}=user?await s.from("users").select("org_id").eq("id",user.id).maybeSingle():({data:null} as any);
  const {data:types}=u?.org_id?await s.from("deduction_types").select("id,name,description").eq("org_id",u.org_id).order("name"):({data:[]} as any);
  return <div className="space-y-6">
    <div><h1 className="text-xl font-semibold">Deduction Types</h1><p className="text-sm text-slate-500">Configure organization-level RA bill deductions and recoveries. Rates and amounts remain bill-specific.</p></div>
    <form action={addDeductionType} className="rounded-lg border bg-white p-4 space-y-3">
      <h2 className="font-medium">Add deduction / recovery type</h2>
      <div className="grid gap-3 md:grid-cols-2"><input name="name" required placeholder="e.g. Retention / Security" className="rounded border px-3 py-2"/><input name="description" placeholder="Optional description" className="rounded border px-3 py-2"/></div>
      <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white">Add type</button>
    </form>
    <div className="rounded-lg border bg-white">
      <div className="border-b px-4 py-3 font-medium">Configured types</div>
      {!types?.length?<p className="p-4 text-sm text-slate-500">No deduction types configured yet.</p>:
      <table className="w-full text-sm"><thead><tr className="border-b bg-slate-50 text-left"><th className="px-4 py-2">Name</th><th className="px-4 py-2">Description</th></tr></thead><tbody>{types.map((t:any)=><tr key={t.id} className="border-b last:border-0"><td className="px-4 py-3 font-medium">{t.name}</td><td className="px-4 py-3 text-slate-600">{t.description||"—"}</td></tr>)}</tbody></table>}
    </div>
    <p className="text-xs text-slate-500">Suggested categories may include Retention / Security, Income Tax, Sales Tax, Mobilization Advance Recovery, Secured Advance Recovery and Other Recovery. Add only the types applicable to your contracts.</p>
  </div>
}
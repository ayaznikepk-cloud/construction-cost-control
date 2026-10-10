import Link from "next/link";
export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import ProgressEntryForm from "@/components/progress/ProgressEntryForm";
import MeasurementForm from "@/components/progress/MeasurementForm";
import { pkr } from "@/lib/format";

function tv(fd:FormData,n:string){const v=String(fd.get(n)??"").trim();return v||null}
function nv(fd:FormData,n:string){const r=String(fd.get(n)??"").trim();if(!r)return null;const v=Number(r);return Number.isFinite(v)?v:null}
async function addProgress(fd:FormData){
 "use server"; const s=createClient(); const {data:{user}}=await s.auth.getUser(); if(!user)throw new Error("You must be signed in.");
 const projectId=tv(fd,"project_id"),itemId=tv(fd,"boq_item_id"),date=tv(fd,"entry_date"),qty=nv(fd,"quantity_today");
 if(!projectId||!itemId||!date||qty===null||qty<=0)throw new Error("Date, BOQ item and a positive quantity are required.");
 const {data:item}=await s.from("boq_items").select("id,original_quantity").eq("id",itemId).eq("project_id",projectId).maybeSingle(); if(!item)throw new Error("Selected BOQ item does not belong to this project.");
 const [{data:vars},{data:entries}]=await Promise.all([s.from("boq_variations").select("approved_quantity").eq("boq_item_id",itemId).eq("status","approved"),s.from("progress_entries").select("quantity_today").eq("boq_item_id",itemId)]);
 const revised=Number(item.original_quantity)+(vars??[]).reduce((a,v)=>a+Number(v.approved_quantity??0),0),done=(entries??[]).reduce((a,e)=>a+Number(e.quantity_today??0),0);
 if(done+qty>revised+0.000001)throw new Error("Entry exceeds revised BOQ quantity. Remaining: "+Math.max(0,revised-done).toLocaleString());
 const {error}=await s.from("progress_entries").insert({boq_item_id:itemId,entry_date:date,quantity_today:qty,recorded_by:user.id}); if(error)throw new Error("Could not save progress: "+error.message);
 revalidatePath("/projects/"+projectId+"/progress");revalidatePath("/projects/"+projectId+"/boq");revalidatePath("/projects/"+projectId+"/overview");
}

async function addMeasurement(fd:FormData){
 "use server"; const s=createClient(); const {data:{user}}=await s.auth.getUser(); if(!user)throw new Error("You must be signed in.");
 const projectId=tv(fd,"project_id"),itemId=tv(fd,"boq_item_id"),date=tv(fd,"measurement_date"),qty=nv(fd,"measured_quantity"),location=tv(fd,"location"),notes=tv(fd,"calculation_notes"),remarks=tv(fd,"remarks");
 if(!projectId||!itemId||!date||qty===null||qty<=0)throw new Error("Date, BOQ item and a positive measured quantity are required.");
 const {data:item}=await s.from("boq_items").select("id").eq("id",itemId).eq("project_id",projectId).maybeSingle();if(!item)throw new Error("Selected BOQ item does not belong to this project.");
 const [{data:progress},{data:measured}]=await Promise.all([s.from("progress_entries").select("quantity_today").eq("boq_item_id",itemId),s.from("measurements").select("measured_quantity").eq("boq_item_id",itemId)]);
 const executed=(progress??[]).reduce((a,e)=>a+Number(e.quantity_today??0),0),certified=(measured??[]).reduce((a,m)=>a+Number(m.measured_quantity??0),0);
 if(certified+qty>executed+0.000001)throw new Error("Measurement exceeds executed quantity. Remaining measurable quantity: "+Math.max(0,executed-certified).toLocaleString());
 const {error}=await s.from("measurements").insert({boq_item_id:itemId,measurement_date:date,measured_quantity:qty,location,calculation_notes:notes,remarks,measured_by:user.id});if(error)throw new Error("Could not save measurement: "+error.message);
 revalidatePath("/projects/"+projectId+"/progress");
}

export default async function ProgressPage({params}:{params:{projectId:string}}){
 const s=createClient(); const [{data:raw},{data:vars},{data:entries,error},{data:measurements}]=await Promise.all([
 s.from("boq_items").select("id,boq_number,description,original_quantity,original_contract_amount,contract_rate,rate_basis,units(code)").eq("project_id",params.projectId).order("sort_order"),
 s.from("boq_variations").select("boq_item_id,approved_quantity,status,boq_items!inner(project_id)").eq("boq_items.project_id",params.projectId),
 s.from("progress_entries").select("id,boq_item_id,entry_date,quantity_today,created_at,boq_items!inner(project_id,boq_number,description,contract_rate,rate_basis,units(code))").eq("boq_items.project_id",params.projectId).order("entry_date",{ascending:false}).order("created_at",{ascending:false}),
 s.from("measurements").select("id,boq_item_id,measurement_date,measured_quantity,location,calculation_notes,remarks,boq_items!inner(project_id,boq_number,description,contract_rate,rate_basis,units(code))").eq("boq_items.project_id",params.projectId).order("measurement_date",{ascending:false})
 ]);if(error)throw new Error(error.message);
 const av=new Map<string,number>();for(const v of vars??[])if(v.status==="approved")av.set(v.boq_item_id,(av.get(v.boq_item_id)??0)+Number(v.approved_quantity??0));
 const ex=new Map<string,number>();for(const e of entries??[])ex.set(e.boq_item_id,(ex.get(e.boq_item_id)??0)+Number(e.quantity_today??0));
 const measuredMap=new Map<string,number>();for(const m of measurements??[])measuredMap.set(m.boq_item_id,(measuredMap.get(m.boq_item_id)??0)+Number(m.measured_quantity??0));
 const items=(raw??[]).map((i:any)=>{const unit=Array.isArray(i.units)?i.units[0]?.code:i.units?.code??"";return {...i,unit,revised_quantity:Number(i.original_quantity)+(av.get(i.id)??0),executed_quantity:ex.get(i.id)??0,measured_quantity:measuredMap.get(i.id)??0}});
 const originalValue=items.reduce((a:any,i:any)=>a+Number(i.original_contract_amount??0),0),variationValue=items.reduce((a:any,i:any)=>a+(av.get(i.id)??0)*Number(i.contract_rate)/Number(i.rate_basis||1),0),revisedValue=originalValue+variationValue,executedValue=items.reduce((a:any,i:any)=>a+i.executed_quantity*Number(i.contract_rate)/Number(i.rate_basis||1),0),complete=items.filter((i:any)=>i.revised_quantity>0&&i.executed_quantity>=i.revised_quantity).length;
 return <div className="space-y-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Work Progress</h2><p className="mt-1 text-sm text-gray-500">Daily executed quantities against the revised BOQ. Certification and billing remain separate.</p></div><Link href={`/print/progress/${params.projectId}`} className="rounded border px-3 py-2 text-sm font-medium">Print progress / PDF</Link></div>
 <div className="grid gap-4 md:grid-cols-4"><Metric label="Revised BOQ Value" value={pkr(revisedValue)}/><Metric label="Executed Value" value={pkr(executedValue)}/><Metric label="BOQ Items Complete" value={complete+" / "+items.length}/><Metric label="Value Progress" value={(revisedValue?executedValue/revisedValue*100:0).toFixed(2)+"%"}/></div>
 <ProgressEntryForm projectId={params.projectId} items={items.filter((i:any)=>i.revised_quantity>i.executed_quantity).map((i:any)=>({id:i.id,boq_number:i.boq_number,description:i.description,unit:i.unit,revised_quantity:i.revised_quantity,executed_quantity:i.executed_quantity}))} action={addProgress}/>
 <MeasurementForm projectId={params.projectId} items={items.filter((i:any)=>i.executed_quantity>i.measured_quantity).map((i:any)=>({id:i.id,boq_number:i.boq_number,description:i.description,unit:i.unit,executed:i.executed_quantity,measured:i.measured_quantity}))} action={addMeasurement}/>
 <div className="overflow-hidden rounded-xl border border-border bg-white"><div className="border-b border-border px-4 py-3 font-medium">Progress register</div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="bg-gray-50 text-xs text-gray-500"><tr><th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3 text-left">BOQ #</th><th className="px-4 py-3 text-left">Description</th><th className="px-4 py-3 text-right">Today Qty</th><th className="px-4 py-3 text-left">Unit</th><th className="px-4 py-3 text-right">Executed Value</th></tr></thead><tbody>{(entries??[]).map((e:any)=>{const b=Array.isArray(e.boq_items)?e.boq_items[0]:e.boq_items,u=Array.isArray(b?.units)?b.units[0]?.code:b?.units?.code,val=Number(e.quantity_today)*Number(b?.contract_rate??0)/Number(b?.rate_basis||1);return <tr key={e.id} className="border-t border-border"><td className="px-4 py-3">{e.entry_date}</td><td className="px-4 py-3 font-medium">{b?.boq_number}</td><td className="max-w-xl px-4 py-3 text-gray-700">{b?.description}</td><td className="px-4 py-3 text-right">{Number(e.quantity_today).toLocaleString()}</td><td className="px-4 py-3">{u}</td><td className="px-4 py-3 text-right">{pkr(val)}</td></tr>})}{!(entries??[]).length&&<tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No work progress recorded yet.</td></tr>}</tbody></table></div></div>
 <div className="overflow-hidden rounded-xl border border-border bg-white"><div className="border-b border-border px-4 py-3 font-medium">Measurement / certification register</div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="bg-gray-50 text-xs text-gray-500"><tr><th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3 text-left">BOQ #</th><th className="px-4 py-3 text-left">Description / Location</th><th className="px-4 py-3 text-right">Measured Qty</th><th className="px-4 py-3 text-left">Unit</th><th className="px-4 py-3 text-right">Measured Value</th></tr></thead><tbody>{(measurements??[]).map((m:any)=>{const b=Array.isArray(m.boq_items)?m.boq_items[0]:m.boq_items,u=Array.isArray(b?.units)?b.units[0]?.code:b?.units?.code,val=Number(m.measured_quantity)*Number(b?.contract_rate??0)/Number(b?.rate_basis||1);return <tr key={m.id} className="border-t border-border"><td className="px-4 py-3">{m.measurement_date}</td><td className="px-4 py-3 font-medium">{b?.boq_number}</td><td className="max-w-xl px-4 py-3"><div>{b?.description}</div>{m.location&&<div className="mt-1 text-xs text-gray-500">{m.location}</div>}</td><td className="px-4 py-3 text-right">{Number(m.measured_quantity).toLocaleString()}</td><td className="px-4 py-3">{u}</td><td className="px-4 py-3 text-right">{pkr(val)}</td></tr>})}{!(measurements??[]).length&&<tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No measurements recorded yet.</td></tr>}</tbody></table></div></div>
 </div>
}
function Metric({label,value}:{label:string;value:string}){return <div className="rounded-xl border border-border bg-white p-4"><div className="text-xs text-gray-500">{label}</div><div className="mt-1 text-lg font-semibold">{value}</div></div>}

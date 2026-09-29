import PurchaseEntryForm from "@/components/purchases/PurchaseEntryForm";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";
import {pkr,fmtDate} from "@/lib/format";

const textValue=(f:FormData,k:string)=>String(f.get(k)??"").trim();
const num=(f:FormData,k:string)=>{const n=Number(f.get(k)??0);return Number.isFinite(n)?n:0};

async function createPurchase(_state:{error:string|null;success:string|null},formData:FormData):Promise<{error:string|null;success:string|null}>{"use server";
 try{
 const supabase=createClient();
 const {data:{user}}=await supabase.auth.getUser(); if(!user) throw new Error("Sign in required.");
 let raw:any[]=[]; try{raw=JSON.parse(textValue(formData,"items_json"));}catch{throw new Error("Invalid purchase lines.");}
 const items=raw.map(x=>({material_id:String(x.material_id||""),quantity:Number(x.quantity),rate:Number(x.rate)}));
 if(!textValue(formData,"project_id")||!textValue(formData,"supplier_id")||!textValue(formData,"invoice_date")) throw new Error("Project, supplier and invoice date are required.");
 if(!items.length||items.some(x=>!x.material_id||!Number.isFinite(x.quantity)||x.quantity<=0||!Number.isFinite(x.rate)||x.rate<0)) throw new Error("Complete all material lines.");
 const {error}=await supabase.rpc("create_purchase",{p_project:textValue(formData,"project_id"),p_supplier:textValue(formData,"supplier_id"),p_invoice_number:textValue(formData,"invoice_number"),p_invoice_date:textValue(formData,"invoice_date"),p_transport:num(formData,"transport_charges"),p_other:num(formData,"other_charges"),p_items:items,p_paid_now:num(formData,"paid_now")});
 if(error) throw new Error(error.message);
 revalidatePath("/purchases"); revalidatePath("/dashboard");
 return {error:null,success:"Purchase posted and stock received."};
 }catch(e){return {error:e instanceof Error?e.message:"Unable to post purchase.",success:null};}
}

export const dynamic="force-dynamic";
export default async function PurchasesPage(){
 const supabase=createClient();
 const [{data:projects},{data:suppliers},{data:materials},{data:purchases,error}]=await Promise.all([
  supabase.from("projects").select("id,project_code,project_name").eq("status","active").order("project_code"),
  supabase.from("suppliers").select("id,name").eq("status","active").order("name"),
  supabase.from("materials").select("id,material_code,name,units:base_unit_id(code)").order("name"),
  supabase.from("purchases").select("id,invoice_number,invoice_date,transport_charges,other_charges,status,projects(project_code,project_name),suppliers(name),purchase_items(amount)").order("invoice_date",{ascending:false}).limit(50)
 ]);
 const rows=(purchases??[]).map((x:any)=>({...x,subtotal:(x.purchase_items??[]).reduce((s:number,i:any)=>s+Number(i.amount??0),0)}));
 return <div className="space-y-5"><div><h1 className="text-xl font-semibold">Purchases</h1><p className="text-sm text-muted-foreground">Material purchases, immediate goods receipt and supplier liability.</p></div>
 <PurchaseEntryForm projects={(projects??[]) as any} suppliers={(suppliers??[]) as any} materials={(materials??[]) as any} action={createPurchase}/>
 <section className="overflow-hidden rounded-xl border border-border bg-white"><div className="border-b px-4 py-3 font-semibold">Purchase register</div>{error?<p className="p-4 text-sm text-red-600">{error.message}</p>:rows.length===0?<p className="p-6 text-center text-sm text-muted-foreground">No purchases recorded yet.</p>:<div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-gray-50 text-left text-xs text-muted-foreground"><th className="px-4 py-2">Date</th><th>Project</th><th>Supplier</th><th>Invoice</th><th className="text-right">Materials</th><th className="text-right">Charges</th><th className="px-4 text-right">Total</th><th>Status</th></tr></thead><tbody>{rows.map((r:any)=>{const charges=Number(r.transport_charges??0)+Number(r.other_charges??0);return <tr key={r.id} className="border-b last:border-0"><td className="px-4 py-3">{fmtDate(r.invoice_date)}</td><td>{r.projects?.project_code} — {r.projects?.project_name}</td><td>{r.suppliers?.name}</td><td>{r.invoice_number||"—"}</td><td className="text-right">{pkr(r.subtotal)}</td><td className="text-right">{pkr(charges)}</td><td className="px-4 text-right font-medium">{pkr(r.subtotal+charges)}</td><td className="uppercase">{r.status}</td></tr>})}</tbody></table></div>}</section></div>
}
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
 const [{data:projects},{data:suppliers},{data:materials},{data:purchases,error},{data:payments}]=await Promise.all([
  supabase.from("projects").select("id,project_code,project_name").eq("status","active").order("project_code"),
  supabase.from("suppliers").select("id,name").eq("status","active").order("name"),
  supabase.from("materials").select("id,material_code,name,units:base_unit_id(code)").order("name"),
  supabase.from("purchases").select("id,project_id,supplier_id,invoice_number,invoice_date,transport_charges,other_charges,status,projects(project_code,project_name),suppliers(name),purchase_items(amount,quantity,rate,materials(material_code,name,units:base_unit_id(code)))").order("invoice_date",{ascending:false}).limit(50),
  supabase.from("supplier_payments").select("project_id,supplier_id,amount,payment_date,reference_number,status").eq("status","posted")
 ]);
 const rows=(purchases??[]).map((x:any)=>{
 const subtotal=(x.purchase_items??[]).reduce((s:number,i:any)=>s+Number(i.amount??0),0);
 const total=subtotal+Number(x.transport_charges??0)+Number(x.other_charges??0);
 const paid=(payments??[]).filter((p:any)=>p.project_id===x.project_id&&p.supplier_id===x.supplier_id&&x.invoice_number&&p.reference_number===x.invoice_number&&p.payment_date===x.invoice_date).reduce((s:number,p:any)=>s+Number(p.amount??0),0);
 const balance=Math.max(total-paid,0);
 const paymentStatus=paid<=0?"UNPAID":balance>0?"PART PAID":"PAID";
 return {...x,subtotal,total,paid,balance,paymentStatus};
 });
 return <div className="min-w-0 space-y-5"><div><h1 className="text-xl font-semibold">Purchases</h1><p className="text-sm text-muted-foreground">Material purchases, immediate goods receipt and supplier liability.</p></div>
 <PurchaseEntryForm projects={(projects??[]) as any} suppliers={(suppliers??[]) as any} materials={(materials??[]) as any} action={createPurchase}/>
 <section className="overflow-hidden rounded-xl border border-border bg-white"><div className="border-b px-4 py-3 font-semibold">Purchase register</div>{error?<p className="p-4 text-sm text-red-600">{error.message}</p>:rows.length===0?<p className="p-6 text-center text-sm text-muted-foreground">No purchases recorded yet.</p>:<div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead><tr className="border-b bg-gray-50 text-left text-xs text-muted-foreground"><th className="px-4 py-2">Date</th><th className="w-[260px]">Project</th><th>Supplier</th><th>Invoice</th><th>Material / Qty</th><th className="text-right">Materials</th><th className="text-right">Charges</th><th className="px-4 text-right">Total</th><th className="text-right">Paid</th><th className="text-right">Balance</th><th>Payment</th><th>Status</th></tr></thead><tbody>{rows.map((r:any)=>{const charges=Number(r.transport_charges??0)+Number(r.other_charges??0);return <tr key={r.id} className="border-b last:border-0"><td className="px-4 py-3">{fmtDate(r.invoice_date)}</td><td className="w-[260px] max-w-[260px] pr-3"><div className="truncate" title={`${r.projects?.project_code??""} — ${r.projects?.project_name??""}`}>{r.projects?.project_code} — {r.projects?.project_name}</div></td><td>{r.suppliers?.name}</td><td>{r.invoice_number||"—"}</td><td className="min-w-[260px] py-3">{(r.purchase_items??[]).map((i:any,n:number)=><div key={n} className={n?"mt-1":""}><span className="font-medium" title={i.materials?.material_code?`Material code: ${i.materials.material_code}`:""}>{i.materials?.name??"Material"}</span><span className="ml-2 text-xs text-muted-foreground">{Number(i.quantity??0).toLocaleString("en-PK")} {i.materials?.units?.code??""} × {pkr(Number(i.rate??0))}</span></div>)}</td><td className="text-right">{pkr(r.subtotal)}</td><td className="text-right">{pkr(charges)}</td><td className="px-4 text-right font-medium">{pkr(r.total)}</td><td className="text-right">{pkr(r.paid)}</td><td className="text-right font-medium">{pkr(r.balance)}</td><td className="font-medium">{r.paymentStatus}</td><td className="uppercase">{r.status}</td></tr>})}</tbody></table></div>}</section></div>
}
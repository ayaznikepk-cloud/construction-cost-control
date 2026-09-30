"use client";
import {useEffect,useRef,useState} from "react";
import {createClient} from "@/lib/supabase/client";

type Project={id:string;project_code:string;project_name:string};
type Category={id:string;name:string;default_classification:string|null};

export default function ExpenseEntryForm({projects,categories,action}:{projects:Project[];categories:Category[];action:(f:FormData)=>void}){
 const [projectId,setProjectId]=useState(""),[classification,setClassification]=useState(""),[items,setItems]=useState<any[]>([]),[pending,setPending]=useState(false),[error,setError]=useState<string|null>(null),[success,setSuccess]=useState<string|null>(null);
 const ref=useRef<HTMLFormElement>(null);
 async function submit(fd:FormData){setPending(true);setError(null);setSuccess(null);try{await action(fd);ref.current?.reset();setProjectId("");setClassification("");setItems([]);setSuccess("Expense posted successfully.");}catch(e:any){setError(e?.message??"Could not post expense.");}finally{setPending(false)}}
 useEffect(()=>{if(!projectId){setItems([]);return}const s=createClient();s.from("boq_items").select("id,boq_number,description").eq("project_id",projectId).order("sort_order").then(({data})=>setItems(data??[]))},[projectId]);
 return <form ref={ref} action={submit} className="min-w-0 rounded-xl border border-border bg-white p-4"><h2 className="mb-3 font-semibold">Record expense</h2>
 {error&&<div className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}{success&&<div className="mb-3 rounded bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>}
 <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
 <select required name="project_id" value={projectId} onChange={e=>setProjectId(e.target.value)} className="min-w-0 w-full rounded border px-3 py-2 text-sm"><option value="">Select project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.project_code} — {p.project_name}</option>)}</select>
 <input required type="date" name="expense_date" className="min-w-0 w-full rounded border px-3 py-2 text-sm"/><input name="expense_number" placeholder="Expense / voucher no." className="min-w-0 w-full rounded border px-3 py-2 text-sm"/>
 <select required name="expense_category_id" className="min-w-0 w-full rounded border px-3 py-2 text-sm"><option value="">Expense category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
 <select required name="classification" value={classification} onChange={e=>setClassification(e.target.value)} className="min-w-0 w-full rounded border px-3 py-2 text-sm"><option value="">Cost classification</option><option value="direct_boq">Direct BOQ cost</option><option value="overhead">Project overhead</option></select>
 <select required={classification==="direct_boq"} disabled={!projectId||classification!=="direct_boq"} name="boq_item_id" className="rounded border px-3 py-2 text-sm disabled:bg-gray-50"><option value="">{classification==="direct_boq"?"Select BOQ item":"BOQ allocation — direct costs only"}</option>{items.map(i=><option key={i.id} value={i.id}>{i.boq_number} — {i.description.slice(0,80)}</option>)}</select>
 <input name="payee" placeholder="Supplier / person / payee" className="min-w-0 w-full rounded border px-3 py-2 text-sm"/><input required type="number" min="0.01" step="0.01" name="amount" placeholder="Amount (Rs)" className="min-w-0 w-full rounded border px-3 py-2 text-sm"/>
 <input name="payment_method" placeholder="Payment method" className="min-w-0 w-full rounded border px-3 py-2 text-sm"/><input name="paid_from" placeholder="Paid from / account" className="min-w-0 w-full rounded border px-3 py-2 text-sm"/><input name="description" placeholder="Description" className="rounded border px-3 py-2 text-sm md:col-span-2"/>
 </div><button disabled={pending} className="mt-3 w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{pending?"Posting...":"Post expense"}</button></form>
}
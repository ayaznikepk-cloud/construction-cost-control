"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {createClient} from "@/lib/supabase/client";
import FormStatusMessage from "@/components/shared/FormStatusMessage";

type Project={id:string;project_code:string;project_name:string};
type Category={id:string;name:string;default_classification:string|null};

export default function ExpenseEntryForm({projects,categories,action}:{projects:Project[];categories:Category[];action:(f:FormData)=>void}){
 const [projectId,setProjectId]=useState(projects.length===1?projects[0].id:""),[classification,setClassification]=useState(""),[items,setItems]=useState<any[]>([]),[boqId,setBoqId]=useState(""),[boqQuery,setBoqQuery]=useState(""),[boqOpen,setBoqOpen]=useState(false),[pending,setPending]=useState(false),[error,setError]=useState<string|null>(null),[success,setSuccess]=useState<string|null>(null);
 const ref=useRef<HTMLFormElement>(null);
 const filteredItems=useMemo(()=>{const q=boqQuery.trim().toLowerCase();return q?items.filter(i=>`${i.boq_number} ${i.description}`.toLowerCase().includes(q)):items},[items,boqQuery]);
 async function submit(fd:FormData){
  setPending(true);setError(null);setSuccess(null);
  if(classification==="direct_boq"&&!boqId){setError("Select the BOQ item this expense belongs to.");setPending(false);return}
  try{
   await action(fd);
   ref.current?.reset();
   setProjectId(projects.length===1?projects[0].id:"");
   setClassification("");setBoqId("");setBoqQuery("");setBoqOpen(false);
   setSuccess("Expense posted successfully.");
  }catch(e:any){setError(e?.message??"Could not post expense. Your entered information has been kept so you can try again.");}
  finally{setPending(false)}
 }
 useEffect(()=>{setBoqId("");setBoqQuery("");setBoqOpen(false);if(!projectId){setItems([]);return}const s=createClient();s.from("boq_items").select("id,boq_number,description").eq("project_id",projectId).order("sort_order").then(({data})=>setItems(data??[]))},[projectId]);
 const today=new Date().toISOString().slice(0,10);
 return <form ref={ref} action={submit} className="min-w-0 rounded-xl border border-border bg-white p-4"><h2 className="mb-3 font-semibold">Record expense</h2>
 {error&&<div className="mb-3"><FormStatusMessage kind="error">{error}</FormStatusMessage></div>}{success&&<div className="mb-3"><FormStatusMessage kind="success">{success}</FormStatusMessage></div>}
 <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
 <select required name="project_id" value={projectId} onChange={e=>setProjectId(e.target.value)} className="min-w-0 w-full rounded border px-3 py-2 text-sm"><option value="">Select project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.project_code} — {p.project_name}</option>)}</select>
 <input required type="date" name="expense_date" defaultValue={today} className="min-w-0 w-full rounded border px-3 py-2 text-sm"/><input name="expense_number" placeholder="Expense / voucher no." className="min-w-0 w-full rounded border px-3 py-2 text-sm"/>
 <select required name="expense_category_id" className="min-w-0 w-full rounded border px-3 py-2 text-sm"><option value="">Expense category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
 <select required name="classification" value={classification} onChange={e=>setClassification(e.target.value)} className="min-w-0 w-full rounded border px-3 py-2 text-sm"><option value="">Cost classification</option><option value="direct_boq">Direct BOQ cost</option><option value="overhead">Project overhead</option></select>
 <div className="relative min-w-0"><input type="hidden" name="boq_item_id" value={boqId}/><input disabled={!projectId||classification!=="direct_boq"} value={boqQuery} onChange={e=>{setBoqQuery(e.target.value);setBoqId("");setBoqOpen(true)}} onFocus={()=>setBoqOpen(true)} placeholder={classification==="direct_boq"?"Search BOQ no. or description":"BOQ allocation — direct costs only"} className="min-w-0 w-full rounded border px-3 py-2 text-sm disabled:bg-gray-50"/>{classification==="direct_boq"&&projectId&&boqOpen&&<div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded border bg-white shadow-lg">{filteredItems.length?filteredItems.slice(0,50).map(i=><button key={i.id} type="button" onClick={()=>{setBoqId(i.id);setBoqQuery(`${i.boq_number} — ${i.description}`);setBoqOpen(false)}} className="block w-full border-b px-3 py-2 text-left text-sm last:border-0 hover:bg-gray-50"><span className="font-medium">{i.boq_number}</span> — {i.description}</button>):<div className="px-3 py-3 text-sm text-gray-500">No matching BOQ items.</div>}</div>}{classification==="direct_boq"&&!boqId&&<span className="mt-1 block text-[11px] text-gray-500">Select a BOQ item from the search results.</span>}</div>
 <input name="payee" placeholder="Supplier / person / payee" className="min-w-0 w-full rounded border px-3 py-2 text-sm"/><input required type="number" min="0.01" step="0.01" name="amount" placeholder="Amount (Rs)" className="min-w-0 w-full rounded border px-3 py-2 text-sm"/>
 <input name="payment_method" placeholder="Payment method" className="min-w-0 w-full rounded border px-3 py-2 text-sm"/><input name="paid_from" placeholder="Paid from / account" className="min-w-0 w-full rounded border px-3 py-2 text-sm"/><input name="description" placeholder="Description" className="rounded border px-3 py-2 text-sm md:col-span-2"/>
 </div><button disabled={pending} className="mt-3 w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{pending?"Posting expense...":"Post expense"}</button><p className="mt-2 text-center text-[11px] text-gray-500">The form is cleared only after a successful save.</p></form>
}
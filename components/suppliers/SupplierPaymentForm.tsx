"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { pkr } from "@/lib/format";
import FormStatusMessage from "@/components/shared/FormStatusMessage";

type Option={project_id:string;supplier_id:string;supplier_name:string;balance:number;project_label:string};
type Result={ok:boolean;error?:string};
const initial:Result={ok:false};

function Submit(){const {pending}=useFormStatus();return <button disabled={pending} className="rounded bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">{pending?"Recording payment...":"Record supplier payment"}</button>}

export default function SupplierPaymentForm({options,action}:{options:Option[];action:(fd:FormData)=>Promise<Result>}){
  async function formStateAction(_previousState:Result,formData:FormData):Promise<Result>{
    const projectId=String(formData.get("project_id")??"");
    const supplierId=String(formData.get("supplier_id")??"");
    const amount=Number(formData.get("amount")??0);
    const option=options.find(o=>o.project_id===projectId&&o.supplier_id===supplierId);
    if(option&&amount>option.balance+0.000001)return {ok:false,error:`Payment cannot exceed the outstanding balance (${pkr(option.balance)}).`};
    if(option&&!window.confirm(`Record a payment of ${pkr(amount)} to ${option.supplier_name} for ${option.project_label}?`))return {ok:false};
    try{return await action(formData)}catch{return {ok:false,error:"Could not record the payment. Your entries have been kept so you can try again."}}
  }
  const [state,formAction]=useFormState(formStateAction,initial); const ref=useRef<HTMLFormElement>(null);
  const [project,setProject]=useState(()=>{const ids=Array.from(new Set(options.map(o=>o.project_id)));return ids.length===1?ids[0]:""}); const [supplier,setSupplier]=useState("");
  const projects=useMemo(()=>Array.from(new Map(options.map(o=>[o.project_id,o.project_label]))),[options]);
  const suppliers=options.filter(o=>o.project_id===project);
  const selected=options.find(o=>o.project_id===project&&o.supplier_id===supplier);
  const today=new Date().toISOString().slice(0,10);
  useEffect(()=>{if(state.ok){ref.current?.reset();const ids=Array.from(new Set(options.map(o=>o.project_id)));setProject(ids.length===1?ids[0]:"");setSupplier("");}},[state,options]);
  return <form ref={ref} action={formAction} className="min-w-0 space-y-4 rounded-xl border bg-white p-4">
    <div><h2 className="font-semibold">Record supplier payment</h2><p className="text-sm text-slate-600">Only suppliers with an outstanding balance are available.</p></div>
    {state.ok&&<FormStatusMessage kind="success">Payment recorded successfully.</FormStatusMessage>}
    {state.error&&<FormStatusMessage kind="error">{state.error}</FormStatusMessage>}
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      <select name="project_id" required value={project} onChange={e=>{setProject(e.target.value);setSupplier("");}} className="min-w-0 w-full rounded border px-3 py-2"><option value="">Select project</option>{projects.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select>
      <select name="supplier_id" required value={supplier} onChange={e=>setSupplier(e.target.value)} className="min-w-0 w-full rounded border px-3 py-2"><option value="">Select supplier</option>{suppliers.map(o=><option key={o.supplier_id} value={o.supplier_id}>{o.supplier_name}</option>)}</select>
      <div className="rounded bg-slate-50 px-3 py-2 text-sm"><span className="text-slate-500">Outstanding</span><div className="font-semibold">{selected?pkr(selected.balance):"Rs 0"}</div></div>
      <input name="amount" type="number" min="0.01" step="0.01" max={selected?.balance} required placeholder="Amount (Rs)" className="min-w-0 w-full rounded border px-3 py-2"/>
      <input name="payment_date" type="date" required defaultValue={today} className="min-w-0 w-full rounded border px-3 py-2"/>
      <select name="payment_method" className="min-w-0 w-full rounded border px-3 py-2"><option value="">Payment method</option><option>Cash</option><option>Cheque</option><option>Bank Transfer</option><option>Online Transfer</option><option>Other</option></select>
      <input name="reference_number" placeholder="Cheque / transaction reference" className="rounded border px-3 py-2 lg:col-span-2"/>
      <Submit/>
      {selected&&<p className="text-xs text-slate-500 lg:col-span-3">Maximum payment: {pkr(selected.balance)}. You will be asked to confirm the supplier, project and amount before recording.</p>}
    </div>
  </form>
}

"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { pkr } from "@/lib/format";

type Option={project_id:string;supplier_id:string;supplier_name:string;balance:number;project_label:string};
type Result={ok:boolean;error?:string};
const initial:Result={ok:false};

function Submit(){const {pending}=useFormStatus();return <button disabled={pending} className="rounded bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">{pending?"Recording…":"Record supplier payment"}</button>}

export default function SupplierPaymentForm({options,action}:{options:Option[];action:(fd:FormData)=>Promise<Result>}){
  const [state,formAction]=useFormState(action,initial); const ref=useRef<HTMLFormElement>(null);
  const [project,setProject]=useState(""); const [supplier,setSupplier]=useState("");
  const projects=useMemo(()=>Array.from(new Map(options.map(o=>[o.project_id,o.project_label]))),[options]);
  const suppliers=options.filter(o=>o.project_id===project);
  const selected=options.find(o=>o.project_id===project&&o.supplier_id===supplier);
  useEffect(()=>{if(state.ok){ref.current?.reset();setProject("");setSupplier("");}},[state]);
  return <form ref={ref} action={formAction} className="rounded-xl border bg-white p-4 space-y-4">
    <div><h2 className="font-semibold">Record supplier payment</h2><p className="text-sm text-slate-600">Only suppliers with an outstanding balance are available.</p></div>
    {state.ok&&<div className="rounded bg-green-50 p-3 text-sm text-green-700">Payment recorded successfully.</div>}
    {state.error&&<div className="rounded bg-red-50 p-3 text-sm text-red-700">{state.error}</div>}
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      <select name="project_id" required value={project} onChange={e=>{setProject(e.target.value);setSupplier("");}} className="rounded border px-3 py-2"><option value="">Select project</option>{projects.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select>
      <select name="supplier_id" required value={supplier} onChange={e=>setSupplier(e.target.value)} className="rounded border px-3 py-2"><option value="">Select supplier</option>{suppliers.map(o=><option key={o.supplier_id} value={o.supplier_id}>{o.supplier_name}</option>)}</select>
      <div className="rounded bg-slate-50 px-3 py-2 text-sm"><span className="text-slate-500">Outstanding</span><div className="font-semibold">{selected?pkr(selected.balance):"Rs 0"}</div></div>
      <input name="amount" type="number" min="0.01" step="0.01" max={selected?.balance} required placeholder="Amount (Rs)" className="rounded border px-3 py-2"/>
      <input name="payment_date" type="date" required className="rounded border px-3 py-2"/>
      <select name="payment_method" className="rounded border px-3 py-2"><option value="">Payment method</option><option>Cash</option><option>Cheque</option><option>Bank Transfer</option><option>Online Transfer</option><option>Other</option></select>
      <input name="reference_number" placeholder="Cheque / transaction reference" className="rounded border px-3 py-2 lg:col-span-2"/>
      <Submit/>
    </div>
  </form>
}

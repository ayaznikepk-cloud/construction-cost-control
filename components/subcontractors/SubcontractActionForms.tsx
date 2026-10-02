"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { pkr } from "@/lib/format";
import FormStatusMessage from "@/components/shared/FormStatusMessage";

export type SubcontractState = { error: string | null; success: string | null };

function PendingButton({ idle, busy, className }: { idle: string; busy: string; className: string }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} className={className}>{pending ? busy : idle}</button>;
}

export function CreateSubcontractForm({ projects, people, action }: any) {
  const [state, formAction] = useFormState(action, { error: null, success: null });
  const ref = useRef<HTMLFormElement>(null);
  useEffect(()=>{ if(state.success) ref.current?.reset(); },[state.success]);

  return <form ref={ref} action={formAction} className="mt-4 grid min-w-0 gap-3 md:grid-cols-2 lg:grid-cols-3">
    {state.error&&<div className="md:col-span-2 lg:col-span-3"><FormStatusMessage kind="error">{state.error}</FormStatusMessage></div>}
    {state.success&&<div className="md:col-span-2 lg:col-span-3"><FormStatusMessage kind="success">{state.success}</FormStatusMessage></div>}
    <select name="project_id" required defaultValue={projects.length===1?projects[0].id:""} className="min-w-0 rounded border px-3 py-2"><option value="">Select project</option>{projects.map((p:any)=><option key={p.id} value={p.id}>{p.project_code} — {p.project_name}</option>)}</select>
    <div className="min-w-0"><label className="mb-1 block text-xs font-medium text-gray-600">Subcontractor</label><select name="subcontractor_id" required className="min-w-0 w-full rounded border px-3 py-2"><option value="">Select subcontractor</option>{people.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
    <input name="contract_value" required type="number" min=".01" step=".01" placeholder="Contract value (Rs)" className="min-w-0 rounded border px-3 py-2"/>
    <input name="retention_percentage" type="number" min="0" max="100" step=".01" placeholder="Retention %" className="min-w-0 rounded border px-3 py-2"/>
    <input name="scope_description" placeholder="Scope / work description" className="min-w-0 rounded border px-3 py-2 md:col-span-2"/>
    <PendingButton idle="Create subcontract" busy="Creating subcontract..." className="rounded bg-active px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"/>
  </form>;
}

export function CertifySubcontractForm({ id, remaining, action }: any) {
  const [state, formAction] = useFormState(action, { error: null, success: null });
  const ref=useRef<HTMLFormElement>(null); const today=new Date().toISOString().slice(0,10);
  useEffect(()=>{ if(state.success) ref.current?.reset(); },[state.success]);
  function confirm(e:React.FormEvent<HTMLFormElement>){const fd=new FormData(e.currentTarget);const amount=Number(fd.get("amount_certified")??0);if(amount>remaining+0.000001){e.preventDefault();window.alert(`Certified amount cannot exceed ${pkr(remaining)}.`);return}if(!window.confirm(`Certify work amount of ${pkr(amount)}?`))e.preventDefault();}
  return <form ref={ref} action={formAction} onSubmit={confirm} className="grid gap-2 sm:grid-cols-2">
    <b className="text-sm sm:col-span-2">Certify work</b>
    {state.error&&<div className="sm:col-span-2"><FormStatusMessage kind="error">{state.error}</FormStatusMessage></div>}
    {state.success&&<div className="sm:col-span-2"><FormStatusMessage kind="success">{state.success}</FormStatusMessage></div>}
    <input type="hidden" name="subcontract_id" value={id}/>
    <input required name="measurement_date" type="date" defaultValue={today} className="min-w-0 rounded border px-2 py-2"/>
    <input required name="amount_certified" type="number" min=".01" max={remaining||undefined} step=".01" placeholder={`Certified amount (max ${pkr(remaining)})`} className="min-w-0 rounded border px-2 py-2"/>
    <input name="description" placeholder="Measurement / description" className="min-w-0 rounded border px-2 py-2 sm:col-span-2"/>
    <PendingButton idle="Add certified work" busy="Saving certification..." className="rounded border border-active px-3 py-2 text-active disabled:opacity-50 sm:col-span-2"/>
  </form>;
}

export function PaySubcontractForm({ id, payable, contractRemaining, action }: any) {
  const [state, formAction] = useFormState(action, { error: null, success: null });
  const ref=useRef<HTMLFormElement>(null); const today=new Date().toISOString().slice(0,10);
  useEffect(()=>{ if(state.success) ref.current?.reset(); },[state.success]);
  function confirm(e:React.FormEvent<HTMLFormElement>){const fd=new FormData(e.currentTarget);const amount=Number(fd.get("amount")??0);const kind=String(fd.get("payment_type")??"running");const max=kind==="advance"?contractRemaining:payable;if(amount>max+0.000001){e.preventDefault();window.alert(`Payment cannot exceed ${pkr(max)} for this payment type.`);return}if(!window.confirm(`Record ${kind} payment of ${pkr(amount)}?`))e.preventDefault();}
  return <form ref={ref} action={formAction} onSubmit={confirm} className="grid gap-2 sm:grid-cols-2">
    <b className="text-sm sm:col-span-2">Record payment</b>
    {state.error&&<div className="sm:col-span-2"><FormStatusMessage kind="error">{state.error}</FormStatusMessage></div>}
    {state.success&&<div className="sm:col-span-2"><FormStatusMessage kind="success">{state.success}</FormStatusMessage></div>}
    <input type="hidden" name="subcontract_id" value={id}/>
    <input required name="payment_date" type="date" defaultValue={today} className="min-w-0 rounded border px-2 py-2"/>
    <input required name="amount" type="number" min=".01" step=".01" placeholder="Payment amount" className="min-w-0 rounded border px-2 py-2"/>
    <select name="payment_type" className="min-w-0 rounded border px-2 py-2"><option value="running">Running payment</option><option value="advance">Advance</option><option value="final">Final payment</option></select>
    <PendingButton idle="Record payment" busy="Recording payment..." className="rounded bg-active px-3 py-2 text-white disabled:opacity-50"/>
    <p className="text-[11px] text-gray-500 sm:col-span-2">Running/final payable: {pkr(payable)}. Advance limit remaining: {pkr(contractRemaining)}.</p>
  </form>;
}

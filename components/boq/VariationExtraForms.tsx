"use client";
import { useRef, useState } from "react";
import FormStatusMessage from "@/components/shared/FormStatusMessage";

const cls="rounded-md border border-border px-3 py-2 text-sm";
type Action=(formData:FormData)=>Promise<void>;
export function VariationForm({projectId,items,action}:{projectId:string;items:{id:string;boq_number:string;description:string;original_quantity:number}[];action:Action}) {
 const ref=useRef<HTMLFormElement>(null),[error,setError]=useState<string|null>(null),[success,setSuccess]=useState<string|null>(null),[pending,setPending]=useState(false);
 async function submit(fd:FormData){setPending(true);setError(null);setSuccess(null);try{await action(fd);ref.current?.reset();setSuccess("Variation saved successfully.")}catch(e:any){setError(e?.message??"Could not save variation. Your entries have been kept.")}finally{setPending(false)}}
 return <form ref={ref} action={submit} className="rounded-xl border border-border bg-white p-4"><div className="mb-3 font-medium">New BOQ variation</div>{error&&<div className="mb-3"><FormStatusMessage kind="error">{error}</FormStatusMessage></div>}{success&&<div className="mb-3"><FormStatusMessage kind="success">{success}</FormStatusMessage></div>}<input type="hidden" name="project_id" value={projectId}/><div className="grid gap-2 md:grid-cols-2">
  <select name="boq_item_id" required className={"md:col-span-2 "+cls}><option value="">Select original BOQ item</option>{items.filter(i=>Number(i.original_quantity)>0).map(i=><option key={i.id} value={i.id}>{i.boq_number} — {i.description.slice(0,90)}</option>)}</select>
  <input name="proposed_quantity" type="number" step="0.001" required placeholder="Proposed quantity change (+ / -)" className={cls}/><select name="status" className={cls} defaultValue="draft"><option value="draft">Save as draft</option><option value="submitted">Submit for approval</option></select>
  <input name="remarks" placeholder="Remarks / reason" className={"md:col-span-2 "+cls}/>
 </div><button disabled={pending} className="mt-3 w-full rounded-md bg-active px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{pending?"Saving...":"Add variation"}</button></form>
}
export function ExtraItemForm({projectId,units,action}:{projectId:string;units:{id:string;code:string}[];action:Action}) {
 const ref=useRef<HTMLFormElement>(null),[error,setError]=useState<string|null>(null),[success,setSuccess]=useState<string|null>(null),[pending,setPending]=useState(false);
 async function submit(fd:FormData){setPending(true);setError(null);setSuccess(null);try{await action(fd);ref.current?.reset();setSuccess("Extra item saved successfully.")}catch(e:any){setError(e?.message??"Could not save extra item. Your entries have been kept.")}finally{setPending(false)}}
 return <form ref={ref} action={submit} className="rounded-xl border border-border bg-white p-4"><div className="mb-3 font-medium">New extra / non-BOQ item</div>{error&&<div className="mb-3"><FormStatusMessage kind="error">{error}</FormStatusMessage></div>}{success&&<div className="mb-3"><FormStatusMessage kind="success">{success}</FormStatusMessage></div>}<input type="hidden" name="project_id" value={projectId}/><div className="grid gap-2 md:grid-cols-2">
  <textarea name="description" required rows={3} placeholder="Full description of extra / non-BOQ work" className={"md:col-span-2 "+cls}/>
  <input name="quantity" type="number" min="0" step="0.001" required placeholder="Quantity" className={cls}/><select name="unit_id" required className={cls}><option value="">Unit</option>{units.map(u=><option key={u.id} value={u.id}>{u.code}</option>)}</select>
  <input name="proposed_rate" type="number" min="0" step="0.01" placeholder="Proposed rate" className={cls}/><select name="status" className={cls} defaultValue="draft"><option value="draft">Save as draft</option><option value="submitted">Submit for approval</option></select>
 </div><button disabled={pending} className="mt-3 w-full rounded-md bg-active px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{pending?"Saving...":"Add extra item"}</button></form>
}
export function ApprovalForm({kind,id,projectId,proposedQuantity,proposedRate,action}:{kind:"variation"|"extra";id:string;projectId:string;proposedQuantity?:number|null;proposedRate?:number|null;action:Action}) {
 const [error,setError]=useState<string|null>(null),[pending,setPending]=useState(false);
 async function submit(fd:FormData){setPending(true);setError(null);try{await action(fd)}catch(e:any){setError(e?.message??"Could not update approval.")}finally{setPending(false)}}
 return <form action={submit} className="mt-3 rounded-lg bg-gray-50 p-3"><input type="hidden" name="project_id" value={projectId}/><input type="hidden" name="record_id" value={id}/><input type="hidden" name="kind" value={kind}/>{error&&<p className="mb-2 text-xs text-danger">{error}</p>}<div className="grid gap-2 md:grid-cols-2">
  {kind==="variation"?<input name="approved_quantity" type="number" step="0.001" required defaultValue={proposedQuantity??""} placeholder="Approved quantity change" className={cls}/>:<input name="approved_rate" type="number" min="0" step="0.01" required defaultValue={proposedRate??""} placeholder="Approved rate" className={cls}/>}
  <input name="approval_reference" required placeholder="Approval reference" className={cls}/><input name="approval_date" type="date" required className={cls}/><input name="approval_remarks" placeholder="Approval / rejection remarks" className={cls}/>
 </div><div className="mt-2 flex gap-2"><button name="decision" value="approved" disabled={pending} className="rounded-md bg-active px-3 py-2 text-xs font-medium text-white disabled:opacity-50">Approve</button><button name="decision" value="rejected" disabled={pending} className="rounded-md border border-border bg-white px-3 py-2 text-xs font-medium text-gray-700 disabled:opacity-50">Reject</button></div></form>
}
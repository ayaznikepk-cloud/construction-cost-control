"use client";
import { useRef, useState } from "react";
import FormStatusMessage from "@/components/shared/FormStatusMessage";

export default function AddItemForm({projectId,sections,items,units,action}:{
 projectId:string; sections:{id:string;name:string}[]; items:{id:string;boq_number:string;description:string}[];
 units:{id:string;code:string}[]; action:(formData:FormData)=>Promise<void>;
}) {
 const formRef=useRef<HTMLFormElement>(null); const [error,setError]=useState<string|null>(null); const [pending,setPending]=useState(false); const [success,setSuccess]=useState<string|null>(null);
 async function handleAction(fd:FormData){setPending(true);setError(null);setSuccess(null);try{await action(fd);formRef.current?.reset();setSuccess("BOQ item added successfully.");}catch(e:any){setError(e?.message??"Something went wrong.");}finally{setPending(false);}}
 const cls="rounded-md border border-border px-3 py-2 text-sm";
 return <form ref={formRef} action={handleAction} className="rounded-lg border border-border bg-white p-4">
  <input type="hidden" name="project_id" value={projectId}/><div className="mb-3 text-sm font-medium">Add original BOQ item</div>
  {error&&<div className="mb-3"><FormStatusMessage kind="error">{error}</FormStatusMessage></div>}{success&&<div className="mb-3"><FormStatusMessage kind="success">{success}</FormStatusMessage></div>}<div className="grid grid-cols-2 gap-2">
   <select name="section_id" className={cls}><option value="">No section</option>{sections.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
   <input name="boq_number" placeholder="BOQ #" required className={cls}/>
   <select name="parent_boq_item_id" className={"col-span-2 "+cls}><option value="">No parent item</option>{items.map(i=><option key={i.id} value={i.id}>{i.boq_number} — {i.description.slice(0,70)}</option>)}</select>
   <textarea name="description" rows={4} placeholder="Full government BOQ / specification description" required className={"col-span-2 "+cls}/>
   <input name="original_quantity" type="number" min="0" step="0.001" placeholder="Original quantity" required className={cls}/>
   <select name="unit_id" required className={cls}><option value="">Unit</option>{units.map(u=><option key={u.id} value={u.id}>{u.code}</option>)}</select>
   <input name="mrs_rate" type="number" min="0" step="0.01" placeholder="MRS rate" className={cls}/>
   <input name="contract_rate" type="number" min="0" step="0.01" placeholder="Contract rate" required className={cls}/>
   <input name="sort_order" type="number" min="0" step="1" placeholder="Sort order" className={"col-span-2 "+cls}/>
  </div><button disabled={pending} className="mt-2 w-full rounded-md bg-active px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{pending?"Adding BOQ item...":"Add BOQ item"}</button>
 </form>;
}

"use client";
import { useRef, useState } from "react";
import FormStatusMessage from "@/components/shared/FormStatusMessage";

export default function AddItemForm({projectId,sections,items,units,action,editingItem}:{
 projectId:string; sections:{id:string;name:string}[]; items:{id:string;boq_number:string;description:string}[];
 units:{id:string;code:string}[]; action:(formData:FormData)=>Promise<void>;
 editingItem?: {id:string;section_id:string|null;parent_boq_item_id:string|null;boq_number:string;description:string;original_quantity:number;mrs_rate:number|null;contract_rate:number;sort_order:number;unit_id:string|null}|null;
}) {
 const formRef=useRef<HTMLFormElement>(null); const [error,setError]=useState<string|null>(null); const [pending,setPending]=useState(false); const [rowType,setRowType]=useState<"description"|"measured">(editingItem && Number(editingItem.original_quantity)===0 && Number(editingItem.contract_rate)===0 ? "description" : "measured"); const [success,setSuccess]=useState<string|null>(null);
 async function handleAction(fd:FormData){setPending(true);setError(null);setSuccess(null);try{await action(fd);if(!editingItem) formRef.current?.reset();setSuccess(editingItem?"BOQ item updated successfully.":"BOQ item added successfully.");}catch(e:any){setError(e?.message??"Something went wrong.");}finally{setPending(false);}}
 const cls="rounded-md border border-border px-3 py-2 text-sm";
 return <form ref={formRef} action={handleAction} className="rounded-lg border border-border bg-white p-4">
  <input type="hidden" name="project_id" value={projectId}/>{editingItem&&<input type="hidden" name="item_id" value={editingItem.id}/>}<div className="mb-3 text-sm font-medium">{editingItem?"Edit original BOQ item":"Add original BOQ item"}</div>
  {error&&<div className="mb-3"><FormStatusMessage kind="error">{error}</FormStatusMessage></div>}{success&&<div className="mb-3"><FormStatusMessage kind="success">{success}</FormStatusMessage></div>}<div className="mb-3 flex flex-wrap gap-4 rounded-md bg-gray-50 p-3 text-sm"><label className="flex items-center gap-2"><input type="radio" name="row_type" value="description" checked={rowType==="description"} onChange={()=>setRowType("description")}/> Description / parent row</label><label className="flex items-center gap-2"><input type="radio" name="row_type" value="measured" checked={rowType==="measured"} onChange={()=>setRowType("measured")}/> Measurable BOQ sub-item</label></div><div className="grid grid-cols-2 gap-2">
   <select name="section_id" defaultValue={editingItem?.section_id ?? ""} className={cls}><option value="">No section</option>{sections.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
   <input name="boq_number" defaultValue={editingItem?.boq_number ?? ""} placeholder="BOQ #" required className={cls}/>
   <select name="parent_boq_item_id" defaultValue={editingItem?.parent_boq_item_id ?? ""} className={"col-span-2 "+cls}><option value="">No parent item</option>{items.map(i=><option key={i.id} value={i.id}>{i.boq_number} — {i.description.slice(0,70)}</option>)}</select>
   <textarea name="description" defaultValue={editingItem?.description ?? ""} rows={4} placeholder="Full government BOQ / specification description" required className={"col-span-2 "+cls}/>
   {rowType==="measured" && <input name="original_quantity" defaultValue={editingItem?.original_quantity} type="number" min="0" step="0.001" placeholder="Original quantity" required className={cls}/>}
   {rowType==="measured" && <select name="unit_id" defaultValue={editingItem?.unit_id ?? ""} required className={cls}><option value="">Unit</option>{units.map(u=><option key={u.id} value={u.id}>{u.code}</option>)}</select>}
   {rowType==="measured" && <input name="mrs_rate" defaultValue={editingItem?.mrs_rate ?? ""} type="number" min="0" step="0.01" placeholder="MRS rate" className={cls}/>}
   {rowType==="measured" && <input name="contract_rate" defaultValue={editingItem?.contract_rate} type="number" min="0" step="0.01" placeholder="Contract rate" required className={cls}/>}
   {rowType==="description" && <p className="col-span-2 text-xs text-gray-500">Parent rows carry the full specification but no billable quantity or rate. Add measured child rows beneath them.</p>}
   <input name="sort_order" defaultValue={editingItem?.sort_order} type="number" min="0" step="1" placeholder="Sort order" className={"col-span-2 "+cls}/>
  </div><button disabled={pending} className="mt-2 w-full rounded-md bg-active px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{pending?(editingItem?"Updating BOQ item...":"Adding BOQ item..."):(editingItem?"Update BOQ item":"Add BOQ item")}</button>
 </form>;
}

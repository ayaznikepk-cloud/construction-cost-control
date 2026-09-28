"use client";
import { useRef,useState } from "react";
type Action=(formData:FormData)=>Promise<void>;
const cls="rounded-md border border-border px-3 py-2 text-sm";
export default function ProgressEntryForm({projectId,items,action}:{projectId:string;items:{id:string;boq_number:string;description:string;unit:string;revised_quantity:number;executed_quantity:number}[];action:Action}){
 const ref=useRef<HTMLFormElement>(null),[error,setError]=useState<string|null>(null),[pending,setPending]=useState(false);
 async function submit(fd:FormData){setPending(true);setError(null);try{await action(fd);ref.current?.reset()}catch(e:any){setError(e?.message??"Could not save progress.")}finally{setPending(false)}}
 return <form ref={ref} action={submit} className="rounded-xl border border-border bg-white p-4"><div className="mb-1 font-medium">Record daily work progress</div><p className="mb-3 text-xs text-gray-500">Enter the quantity executed today. Cumulative quantity is calculated from saved entries.</p>{error&&<p className="mb-2 text-sm text-danger">{error}</p>}<input type="hidden" name="project_id" value={projectId}/><div className="grid gap-2 md:grid-cols-2">
 <input name="entry_date" type="date" required className={cls}/><select name="boq_item_id" required className={cls}><option value="">Select BOQ item</option>{items.map(i=><option key={i.id} value={i.id}>{i.boq_number} — {i.description.slice(0,75)} ({i.executed_quantity.toLocaleString()} / {i.revised_quantity.toLocaleString()} {i.unit})</option>)}</select>
 <input name="quantity_today" type="number" min="0.001" step="0.001" required placeholder="Quantity executed today" className={cls}/><input name="note" disabled placeholder="Measurement/location details come next" className={cls}/>
 </div><button disabled={pending} className="mt-3 w-full rounded-md bg-active px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{pending?"Saving...":"Save progress"}</button></form>
}
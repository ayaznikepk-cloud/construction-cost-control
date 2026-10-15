"use client";
import {useState} from "react";
import FormStatusMessage from "@/components/shared/FormStatusMessage";
type Action=(fd:FormData)=>Promise<void>;
const cls="min-w-0 w-full rounded-md border border-border px-3 py-2 text-sm";

function F({action,children,confirmMessage,successMessage}:{action:Action;children:(pending:boolean)=>React.ReactNode;confirmMessage?:string;successMessage?:string}){
 const[e,setE]=useState<string|null>(null),[ok,setOk]=useState<string|null>(null),[p,setP]=useState(false);
 async function run(fd:FormData){
  if(confirmMessage&&!window.confirm(confirmMessage))return;
  setP(true);setE(null);setOk(null);
  try{await action(fd);if(successMessage)setOk(successMessage)}
  catch(x:any){setE(x?.message??"Could not complete this action. Please try again.")}
  finally{setP(false)}
 }
 return <form action={run}>{e&&<div className="mb-3"><FormStatusMessage kind="error">{e}</FormStatusMessage></div>}{ok&&<div className="mb-3"><FormStatusMessage kind="success">{ok}</FormStatusMessage></div>}<fieldset disabled={p}>{children(p)}</fieldset></form>
}

export function SubmitBill({projectId,billId,action}:{projectId:string;billId:string;action:Action}){
 const today=new Date().toISOString().slice(0,10);
 return <F action={action} confirmMessage="Submit this RA bill for checking? You will no longer be able to add or change claim items while it is under checking." successMessage="RA bill submitted successfully.">
  {p=><><input type="hidden" name="project_id" value={projectId}/><input type="hidden" name="ra_bill_id" value={billId}/><div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"><input name="submission_date" type="date" required defaultValue={today} className={cls}/><button className="rounded-md bg-active px-4 py-2 text-sm font-medium text-white">{p?"Submitting...":"Submit RA bill"}</button></div></>}
 </F>
}

export function CertificationForm({projectId,billId,items,action}:{projectId:string;billId:string;items:{id:string;label:string;claimed:number;certified:number|null}[];action:Action}){
 const [itemId,setItemId]=useState("");
 const selected=items.find(i=>i.id===itemId);
 return <F action={action} successMessage="Certified quantity saved successfully.">
  {p=><><input type="hidden" name="project_id" value={projectId}/><input type="hidden" name="ra_bill_id" value={billId}/><div className="mt-3 rounded-lg bg-gray-50 p-3"><div className="mb-1 text-sm font-medium">Government checking / certification</div><p className="mb-2 text-xs text-gray-500">Certified quantity cannot exceed the quantity claimed in this RA bill.</p><div className="grid min-w-0 gap-2 md:grid-cols-3"><select name="ra_bill_item_id" required value={itemId} onChange={e=>setItemId(e.target.value)} className={cls}><option value="">Select claimed BOQ item</option>{items.map(i=><option key={i.id} value={i.id}>{i.label} — claimed {i.claimed.toLocaleString()}</option>)}</select><input name="certified_quantity" type="number" min="0" max={selected?.claimed} step="0.001" required placeholder="Certified quantity" className={cls}/><button className="rounded-md bg-active px-3 py-2 text-sm font-medium text-white">{p?"Saving...":"Save certified qty"}</button></div>{selected&&<p className="mt-2 text-xs text-gray-500">Maximum certified quantity: {selected.claimed.toLocaleString()}</p>}</div></>}
 </F>
}

export function BillStatusAction({projectId,billId,label,next,action}:{projectId:string;billId:string;label:string;next:string;action:Action}){
 const message=next==="verified"?"Mark checking as complete and move this bill to Verified?":next==="passed"?"Pass this bill at the certified amount? This is a financial status change.":undefined;
 return <F action={action} confirmMessage={message} successMessage={next==="verified"?"Bill marked as verified.":"Bill passed successfully."}>
  {p=><><input type="hidden" name="project_id" value={projectId}/><input type="hidden" name="ra_bill_id" value={billId}/><input type="hidden" name="next_status" value={next}/><button className="mt-3 rounded-md border border-border bg-white px-4 py-2 text-sm font-medium disabled:opacity-50">{p?"Working...":label}</button></>}
 </F>
}

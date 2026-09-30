"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {useFormState,useFormStatus} from "react-dom";

type Project={id:string;project_code:string;project_name:string};
type Supplier={id:string;name:string};
type Material={id:string;material_code:string;name:string;units:{code:string}|null};
type Line={material_id:string;quantity:string;rate:string};

type FormState={error:string|null;success:string|null};
function SubmitButton(){const {pending}=useFormStatus();return <button disabled={pending} className="mt-4 w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{pending?"Posting purchase...":"Post purchase & receive stock"}</button>}
export default function PurchaseEntryForm({projects,suppliers,materials,action}:{projects:Project[];suppliers:Supplier[];materials:Material[];action:(s:FormState,f:FormData)=>Promise<FormState>}){
 const [lines,setLines]=useState<Line[]>([{material_id:"",quantity:"",rate:""}]);
 const [transport,setTransport]=useState("0"),[other,setOther]=useState("0");
 const [state,formAction]=useFormState(action,{error:null,success:null});
 const formRef=useRef<HTMLFormElement>(null);
 useEffect(()=>{if(state.success){formRef.current?.reset();setLines([{material_id:"",quantity:"",rate:""}]);setTransport("0");setOther("0");}},[state.success]);
 const subtotal=useMemo(()=>lines.reduce((s,l)=>s+(Number(l.quantity)||0)*(Number(l.rate)||0),0),[lines]);
 const total=subtotal+(Number(transport)||0)+(Number(other)||0);
 const setLine=(i:number,k:keyof Line,v:string)=>setLines(x=>x.map((l,n)=>n===i?{...l,[k]:v}:l));
 return <form ref={formRef} action={formAction} className="min-w-0 rounded-xl border border-border bg-white p-4">
  <h2 className="font-semibold">Record material purchase</h2>
  <p className="mt-1 text-xs text-muted-foreground">Posting a purchase receives the material into the project store. Supplier payment can be recorded now or later.</p>
  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
   <select required name="project_id" className="min-w-0 w-full rounded border px-3 py-2 text-sm"><option value="">Select project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.project_code} — {p.project_name}</option>)}</select>
   <select required name="supplier_id" className="min-w-0 w-full rounded border px-3 py-2 text-sm"><option value="">Select supplier</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
   <input name="invoice_number" placeholder="Supplier invoice no." className="min-w-0 w-full rounded border px-3 py-2 text-sm"/>
   <input required type="date" name="invoice_date" className="min-w-0 w-full rounded border px-3 py-2 text-sm"/>
  </div>
  <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="pb-2">Material</th><th className="pb-2">Qty</th><th className="pb-2">Rate</th><th className="pb-2 text-right">Amount</th><th></th></tr></thead>
   <tbody>{lines.map((l,i)=><tr key={i} className="border-b">
    <td className="py-2 pr-2"><select required value={l.material_id} onChange={e=>setLine(i,"material_id",e.target.value)} className="w-full rounded border px-3 py-2"><option value="">Select material</option>{materials.map(m=><option key={m.id} value={m.id}>{m.material_code} — {m.name}{m.units?.code?" ("+m.units.code+")":""}</option>)}</select></td>
    <td className="py-2 pr-2"><input required min="0.0001" step="any" type="number" value={l.quantity} onChange={e=>setLine(i,"quantity",e.target.value)} className="w-32 rounded border px-3 py-2"/></td>
    <td className="py-2 pr-2"><input required min="0" step="0.01" type="number" value={l.rate} onChange={e=>setLine(i,"rate",e.target.value)} className="w-36 rounded border px-3 py-2"/></td>
    <td className="py-2 text-right">{((Number(l.quantity)||0)*(Number(l.rate)||0)).toLocaleString("en-PK",{maximumFractionDigits:2})}</td>
    <td className="pl-2 text-right"><button type="button" disabled={lines.length===1} onClick={()=>setLines(x=>x.filter((_,n)=>n!==i))} className="rounded border px-2 py-1 disabled:opacity-40">Remove</button></td>
   </tr>)}</tbody></table></div>
  <input type="hidden" name="items_json" value={JSON.stringify(lines)}/>
  <button type="button" onClick={()=>setLines(x=>[...x,{material_id:"",quantity:"",rate:""}])} className="mt-3 rounded border px-3 py-2 text-sm">+ Add material line</button>
  <div className="mt-4 grid gap-3 md:grid-cols-4">
   <label className="text-xs font-medium text-muted-foreground">Transport charges (Rs)<input name="transport_charges" type="number" min="0" step="0.01" value={transport} onChange={e=>setTransport(e.target.value)} placeholder="0" className="mt-1 w-full rounded border px-3 py-2 text-sm text-foreground"/></label>
   <label className="text-xs font-medium text-muted-foreground">Other charges (Rs)<input name="other_charges" type="number" min="0" step="0.01" value={other} onChange={e=>setOther(e.target.value)} placeholder="0" className="mt-1 w-full rounded border px-3 py-2 text-sm text-foreground"/></label>
   <label className="text-xs font-medium text-muted-foreground">Paid now (optional)<input name="paid_now" type="number" min="0" step="0.01" placeholder="0" className="mt-1 w-full rounded border px-3 py-2 text-sm text-foreground"/></label>
   <div className="rounded bg-gray-50 px-3 py-2"><div className="text-xs text-muted-foreground">Invoice total</div><div className="font-semibold">Rs {total.toLocaleString("en-PK",{maximumFractionDigits:2})}</div></div>
  </div>
  {state.error?<p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>:null}
  {state.success?<p className="mt-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{state.success}</p>:null}
  <SubmitButton/>
 </form>
}
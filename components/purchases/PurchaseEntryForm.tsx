"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {useFormState,useFormStatus} from "react-dom";
import FormStatusMessage from "@/components/shared/FormStatusMessage";

type Project={id:string;project_code:string;project_name:string};
type Supplier={id:string;name:string};
type Material={id:string;material_code:string;name:string;units:{code:string}|null};
type Line={material_id:string;quantity:string;rate:string};

type FormState={error:string|null;success:string|null};
function SearchPicker({name,placeholder,items,required=false,value,onChange}:{name?:string;placeholder:string;items:{id:string;label:string;search:string}[];required?:boolean;value?:string;onChange?:(id:string)=>void}){const[internalId,setInternalId]=useState(""),[q,setQ]=useState(""),[open,setOpen]=useState(false);const id=value??internalId;const choose=(v:string)=>{if(onChange)onChange(v);else setInternalId(v)};const matches=useMemo(()=>{const s=q.trim().toLowerCase();return items.filter(x=>!s||x.search.includes(s)).slice(0,50)},[items,q]);return <div className="relative min-w-0"><input type="hidden" name={name} value={id}/><input required={required&&!id} value={q} onFocus={()=>setOpen(true)} onBlur={()=>setTimeout(()=>setOpen(false),150)} onChange={e=>{setQ(e.target.value);choose("");setOpen(true)}} placeholder={placeholder} className="min-w-0 w-full rounded border px-3 py-2 text-sm"/>{open&&<div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded border bg-white shadow-lg">{matches.length?matches.map(x=><button key={x.id} type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>{choose(x.id);setQ(x.label);setOpen(false)}} className="block w-full border-b px-3 py-2 text-left text-sm last:border-0 hover:bg-gray-50">{x.label}</button>):<div className="p-3 text-sm text-muted-foreground">No matching records.</div>}</div>}</div>}
function SubmitButton(){const {pending}=useFormStatus();return <button disabled={pending} className="mt-4 w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{pending?"Posting purchase...":"Post purchase & receive stock"}</button>}
export default function PurchaseEntryForm({projects,suppliers,materials,action}:{projects:Project[];suppliers:Supplier[];materials:Material[];action:(s:FormState,f:FormData)=>Promise<FormState>}){
 const [lines,setLines]=useState<Line[]>([{material_id:"",quantity:"",rate:""}]);
 const [transport,setTransport]=useState("0"),[other,setOther]=useState("0");
 const [projectKey,setProjectKey]=useState(0),[supplierKey,setSupplierKey]=useState(0);
 const [selectedProject,setSelectedProject]=useState(projects.length===1?projects[0].id:"");
 const [state,formAction]=useFormState(action,{error:null,success:null});
 const today=new Date().toISOString().slice(0,10);
 const formRef=useRef<HTMLFormElement>(null);
 useEffect(()=>{if(state.success){formRef.current?.reset();setLines([{material_id:"",quantity:"",rate:""}]);setTransport("0");setOther("0");setSelectedProject(projects.length===1?projects[0].id:"");setProjectKey(x=>x+1);setSupplierKey(x=>x+1);}},[state.success,projects]);
 const subtotal=useMemo(()=>lines.reduce((s,l)=>s+(Number(l.quantity)||0)*(Number(l.rate)||0),0),[lines]);
 const total=subtotal+(Number(transport)||0)+(Number(other)||0);
 const setLine=(i:number,k:keyof Line,v:string)=>setLines(x=>x.map((l,n)=>n===i?{...l,[k]:v}:l));
 const projectItems=useMemo(()=>projects.map(p=>({id:p.id,label:`${p.project_code} — ${p.project_name}`,search:`${p.project_code} ${p.project_name}`.toLowerCase()})),[projects]);
 const supplierItems=useMemo(()=>suppliers.map(s=>({id:s.id,label:s.name,search:s.name.toLowerCase()})),[suppliers]);
 const materialItems=useMemo(()=>materials.map(m=>({id:m.id,label:`${m.name}${m.units?.code?" ("+m.units.code+")":""}`,search:`${m.material_code} ${m.name} ${m.units?.code??""}`.toLowerCase()})),[materials]);
 return <form ref={formRef} action={formAction} className="min-w-0 rounded-xl border border-border bg-white p-4">
  <h2 className="font-semibold">Record material purchase</h2>
  <p className="mt-1 text-xs text-muted-foreground">Posting a purchase receives the material into the project store. Supplier payment can be recorded now or later.</p>
  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
   <SearchPicker key={`project-${projectKey}`} required name="project_id" placeholder="Search project code or name" items={projectItems} value={selectedProject} onChange={setSelectedProject}/>
   <SearchPicker key={`supplier-${supplierKey}`} required name="supplier_id" placeholder="Search supplier" items={supplierItems}/>
   <input name="invoice_number" placeholder="Supplier invoice no." className="min-w-0 w-full rounded border px-3 py-2 text-sm"/>
   <input required type="date" name="invoice_date" defaultValue={today} className="min-w-0 w-full rounded border px-3 py-2 text-sm"/>
  </div>
  <div className="mt-4"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="pb-2">Material</th><th className="hidden pb-2 sm:table-cell">Qty</th><th className="hidden pb-2 sm:table-cell">Rate</th><th className="hidden pb-2 text-right sm:table-cell">Amount</th><th className="hidden sm:table-cell"></th></tr></thead>
   <tbody>{lines.map((l,i)=><tr key={i} className="border-b">
    <td className="py-2 pr-0 sm:pr-2"><SearchPicker required value={l.material_id} onChange={v=>setLine(i,"material_id",v)} placeholder="Search material name or code" items={materialItems}/><div className="mt-2 grid grid-cols-2 gap-2 sm:hidden"><input aria-label="Quantity" placeholder="Qty" required min="0.0001" step="any" type="number" value={l.quantity} onChange={e=>setLine(i,"quantity",e.target.value)} className="w-full rounded border px-3 py-2"/><input aria-label="Rate" placeholder="Rate" required min="0" step="0.01" type="number" value={l.rate} onChange={e=>setLine(i,"rate",e.target.value)} className="w-full rounded border px-3 py-2"/><div className="text-xs text-muted-foreground">Amount: <span className="font-medium text-foreground">{((Number(l.quantity)||0)*(Number(l.rate)||0)).toLocaleString("en-PK",{maximumFractionDigits:2})}</span></div><button type="button" disabled={lines.length===1} onClick={()=>setLines(x=>x.filter((_,n)=>n!==i))} className="justify-self-end rounded border px-2 py-1 text-xs disabled:opacity-40">Remove</button></div></td>
    <td className="hidden py-2 pr-2 sm:table-cell"><input required min="0.0001" step="any" type="number" value={l.quantity} onChange={e=>setLine(i,"quantity",e.target.value)} className="w-32 rounded border px-3 py-2"/></td>
    <td className="hidden py-2 pr-2 sm:table-cell"><input required min="0" step="0.01" type="number" value={l.rate} onChange={e=>setLine(i,"rate",e.target.value)} className="w-36 rounded border px-3 py-2"/></td>
    <td className="hidden py-2 text-right sm:table-cell">{((Number(l.quantity)||0)*(Number(l.rate)||0)).toLocaleString("en-PK",{maximumFractionDigits:2})}</td>
    <td className="hidden pl-2 text-right sm:table-cell"><button type="button" disabled={lines.length===1} onClick={()=>setLines(x=>x.filter((_,n)=>n!==i))} className="rounded border px-2 py-1 disabled:opacity-40">Remove</button></td>
   </tr>)}</tbody></table></div>
  <input type="hidden" name="items_json" value={JSON.stringify(lines)}/>
  <button type="button" onClick={()=>setLines(x=>[...x,{material_id:"",quantity:"",rate:""}])} className="mt-3 rounded border px-3 py-2 text-sm">+ Add material line</button>
  <div className="mt-4 grid gap-3 md:grid-cols-4">
   <label className="text-xs font-medium text-muted-foreground">Transport charges (Rs)<input name="transport_charges" type="number" min="0" step="0.01" value={transport} onChange={e=>setTransport(e.target.value)} placeholder="0" className="mt-1 w-full rounded border px-3 py-2 text-sm text-foreground"/></label>
   <label className="text-xs font-medium text-muted-foreground">Other charges (Rs)<input name="other_charges" type="number" min="0" step="0.01" value={other} onChange={e=>setOther(e.target.value)} placeholder="0" className="mt-1 w-full rounded border px-3 py-2 text-sm text-foreground"/></label>
   <label className="text-xs font-medium text-muted-foreground">Paid now (optional)<input name="paid_now" type="number" min="0" step="0.01" placeholder="0" className="mt-1 w-full rounded border px-3 py-2 text-sm text-foreground"/></label>
   <div className="rounded bg-gray-50 px-3 py-2"><div className="text-xs text-muted-foreground">Invoice total</div><div className="font-semibold">Rs {total.toLocaleString("en-PK",{maximumFractionDigits:2})}</div></div>
  </div>
  {state.error?<div className="mt-3"><FormStatusMessage kind="error">{state.error}</FormStatusMessage></div>:null}
  {state.success?<div className="mt-3"><FormStatusMessage kind="success">{state.success}</FormStatusMessage></div>:null}
  <SubmitButton/>
  <p className="mt-2 text-center text-[11px] text-gray-500">The form is cleared only after the purchase is saved successfully.</p>
 </form>
}
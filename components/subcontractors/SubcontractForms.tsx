"use client";
import {useRef} from "react";

export function ResetForm({action,children,className}:{action:(formData:FormData)=>Promise<void>;children:React.ReactNode;className?:string}){
 const ref=useRef<HTMLFormElement>(null);
 return <form ref={ref} action={async fd=>{await action(fd);ref.current?.reset()}} className={className}>{children}</form>
}
export function SubcontractorPicker({people}:{people:{id:string;name:string}[]}){
 return <div className="min-w-0"><label className="mb-1 block text-xs font-medium text-gray-600">Subcontractor</label>
 <select name="subcontractor_id" required defaultValue="" className="min-w-0 w-full rounded border px-3 py-2"><option value="">Select subcontractor</option>{people.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
 <p className="mt-1 text-[11px] text-gray-500">Active subcontractors from Setup.</p></div>
}

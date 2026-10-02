export const dynamic = "force-dynamic";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { pkr } from "@/lib/format";
import { CreateSecurityForm, SecurityActionForm, type SecurityState } from "@/components/securities/SecurityForms";

const types = [
  ["earnest_money", "Earnest Money"],
  ["performance_security", "Performance Security"],
  ["retention", "Retention"],
  ["bank_guarantee", "Bank Guarantee"],
  ["mobilization_advance", "Mobilization Advance"],
  ["secured_advance", "Secured Advance"],
  ["other", "Other"],
] as const;
const label = (value: string) => types.find(([key]) => key === value)?.[1] ?? value.replaceAll("_", " ");
const tv=(f:FormData,n:string)=>{const v=String(f.get(n)??"").trim();return v||null};
const nv=(f:FormData,n:string)=>{const r=String(f.get(n)??"").trim(),v=Number(r);return r&&Number.isFinite(v)?v:null};

async function createSecurity(_state: SecurityState, f:FormData): Promise<SecurityState> {
  "use server";
  const s=createClient(); const {data:{user}}=await s.auth.getUser(); if(!user) return {error:"Your session has expired. Please sign in again.",success:null};
  const projectId=tv(f,"project_id"),type=tv(f,"type"),amount=nv(f,"amount"),issue=tv(f,"issue_date"),expiry=tv(f,"expiry_date"),reference=tv(f,"reference");
  const raw=f.get("attachment"), file=raw instanceof File&&raw.size>0?raw:null;
  if(!projectId||!type||amount===null||amount<=0) return {error:"Select a project and type, and enter an amount greater than zero.",success:null};
  if(file&&!["application/pdf","image/jpeg","image/png"].includes(file.type)) return {error:"Attachment must be PDF, JPG or PNG.",success:null};
  if(file&&file.size>10*1024*1024) return {error:"Attachment must be 10 MB or smaller.",success:null};
  let attachmentId:null|string=null;
  if(file){const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_"),path=`${user.id}/${crypto.randomUUID()}-${safe}`;const {error:ue}=await s.storage.from("project-documents").upload(path,file,{contentType:file.type,upsert:false});if(ue)return {error:"Could not upload the supporting document. Please try again.",success:null};const {data:a,error:ae}=await s.from("attachments").insert({storage_path:path,file_name:file.name,mime_type:file.type,uploaded_by:user.id}).select("id").single();if(ae){await s.storage.from("project-documents").remove([path]);return {error:"The file uploaded, but its attachment record could not be saved.",success:null}}attachmentId=a.id}
  const {error}=await s.from("securities").insert({project_id:projectId,type,amount,issue_date:issue,expiry_date:expiry,reference,status:"active",recovered_amount:0,released_amount:0,attachment_id:attachmentId});
  if(error)return {error:"Could not save the security item. Your entries have been kept.",success:null}; revalidatePath("/securities"); return {error:null,success:"Security item saved successfully."};
}

async function updateSecurity(_state: SecurityState, f:FormData): Promise<SecurityState> {
  "use server";
  const s=createClient(); const id=tv(f,"security_id"),action=tv(f,"action"),amount=nv(f,"amount");
  if(!id||!action||amount===null||amount<=0)return {error:"Enter an amount greater than zero.",success:null};
  const {data:row}=await s.from("securities").select("amount,recovered_amount,released_amount,status").eq("id",id).maybeSingle();
  if(!row||row.status!=="active")return {error:"This security is no longer active. Refresh the page and try again.",success:null};
  const total=Number(row.amount), recovered=Number(row.recovered_amount??0), released=Number(row.released_amount??0);
  if(recovered+released+amount>total+0.000001)return {error:"Amount exceeds the remaining security balance.",success:null};
  const patch:any=action==="recover"?{recovered_amount:recovered+amount}:{released_amount:released+amount};
  const newRecovered=action==="recover"?recovered+amount:recovered,newReleased=action==="release"?released+amount:released;
  if(newRecovered+newReleased+0.000001>=total)patch.status="released";
  const {error}=await s.from("securities").update(patch).eq("id",id);if(error)return {error:"Could not update the security item. Please try again.",success:null};revalidatePath("/securities");return {error:null,success:action==="recover"?"Recovery recorded successfully.":"Release recorded successfully."};
}

export default async function SecuritiesPage(){
  const s=createClient();
  const [{data:projects},{data:rows,error}]=await Promise.all([
    s.from("projects").select("id,project_code,project_name").order("project_name"),
    s.from("securities").select("id,project_id,type,amount,issue_date,reference,expiry_date,recovered_amount,released_amount,status,attachment_id,attachments!securities_attachment_id_fkey(file_name,storage_path),projects(project_code,project_name)").order("issue_date",{ascending:false}),
  ]);
  const securities=await Promise.all((rows??[]).map(async(row:any)=>{const a=Array.isArray(row.attachments)?row.attachments[0]:row.attachments;if(!a?.storage_path)return{...row,attachmentUrl:null};const {data}=await s.storage.from("project-documents").createSignedUrl(a.storage_path,3600);return{...row,attachmentUrl:data?.signedUrl??null}}));
  const active=securities.filter((x:any)=>x.status==="active"),total=active.reduce((a:number,x:any)=>a+Number(x.amount??0),0),recovered=active.reduce((a:number,x:any)=>a+Number(x.recovered_amount??0),0),released=active.reduce((a:number,x:any)=>a+Number(x.released_amount??0),0);
  return <div className="min-w-0 space-y-6">
    <div><h1 className="text-xl font-semibold">Securities & Recoveries</h1><p className="mt-1 text-sm text-gray-500">Track contract securities, guarantees, advances, recoveries and releases by project.</p></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric l="Active securities" v={String(active.length)}/><Metric l="Active amount" v={pkr(total)}/><Metric l="Recovered" v={pkr(recovered)}/><Metric l="Released" v={pkr(released)}/></div>
    <section className="rounded-xl border border-border bg-white p-4"><h2 className="font-medium">Add security / recovery item</h2><p className="mt-1 text-xs text-gray-500">Amounts and dates are checked before saving. Supporting documents are optional.</p><CreateSecurityForm projects={projects ?? []} types={types} action={createSecurity}/></section>
    <section className="overflow-hidden rounded-xl border border-border bg-white"><div className="border-b border-border px-4 py-3 font-medium">Security & recovery register</div>{error&&<p className="p-4 text-sm text-danger">{error.message}</p>}
      <div className="space-y-3 p-3 md:hidden">{securities.map((x:any)=>{const p=Array.isArray(x.projects)?x.projects[0]:x.projects,remaining=Math.max(0,Number(x.amount)-Number(x.recovered_amount??0)-Number(x.released_amount??0));return <div key={x.id} className="rounded-lg border border-border p-3"><div className="flex items-start justify-between gap-2"><div><div className="font-medium">{label(x.type)}</div><div className="text-xs text-gray-500">{p?.project_code} — {p?.project_name}</div></div><span className="rounded-full bg-gray-100 px-2 py-1 text-xs uppercase">{x.status}</span></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><Mini l="Amount" v={pkr(Number(x.amount))}/><Mini l="Remaining" v={pkr(remaining)}/><Mini l="Recovered" v={pkr(Number(x.recovered_amount??0))}/><Mini l="Released" v={pkr(Number(x.released_amount??0))}/></div>{x.attachmentUrl&&<a href={x.attachmentUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-medium text-active">📎 View document</a>}{x.status==="active"&&remaining>0&&<SecurityActionForm id={x.id} max={remaining} action={updateSecurity}/>}</div>})}{!securities.length&&<p className="p-3 text-sm text-gray-500">No securities or recoveries recorded yet.</p>}</div>
      <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[1000px] text-sm"><thead className="bg-gray-50 text-left text-xs text-gray-500"><tr><th className="px-4 py-2">Project</th><th>Type</th><th>Reference</th><th>Expiry</th><th className="text-right">Amount</th><th className="text-right">Recovered</th><th className="text-right">Released</th><th className="text-right">Remaining</th><th>Document</th><th className="pr-4">Action</th></tr></thead><tbody>{securities.map((x:any)=>{const p=Array.isArray(x.projects)?x.projects[0]:x.projects,remaining=Math.max(0,Number(x.amount)-Number(x.recovered_amount??0)-Number(x.released_amount??0));return <tr key={x.id} className="border-t border-border align-top"><td className="px-4 py-3">{p?.project_code} — {p?.project_name}</td><td>{label(x.type)}</td><td>{x.reference??"—"}</td><td>{x.expiry_date??"—"}</td><td className="text-right">{pkr(Number(x.amount))}</td><td className="text-right">{pkr(Number(x.recovered_amount??0))}</td><td className="text-right">{pkr(Number(x.released_amount??0))}</td><td className="text-right font-medium">{pkr(remaining)}</td><td>{x.attachmentUrl?<a href={x.attachmentUrl} target="_blank" rel="noreferrer" className="text-active">📎 View</a>:"—"}</td><td className="pr-4">{x.status==="active"&&remaining>0?<SecurityActionForm id={x.id} max={remaining} action={updateSecurity}/>:<span className="text-xs uppercase text-gray-500">{x.status}</span>}</td></tr>})}</tbody></table></div>
    </section>
  </div>
}
function Metric({l,v}:{l:string;v:string}){return <div className="rounded-xl border border-border bg-white p-3 sm:p-4"><div className="text-xs text-gray-500">{l}</div><div className="mt-1 text-base font-semibold sm:text-lg">{v}</div></div>}
function Mini({l,v}:{l:string;v:string}){return <div><div className="text-gray-500">{l}</div><div className="mt-1 font-medium">{v}</div></div>}

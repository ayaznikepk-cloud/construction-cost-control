export const dynamic = "force-dynamic";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { pkr } from "@/lib/format";

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

async function createSecurity(f:FormData) {
  "use server";
  const s=createClient(); const {data:{user}}=await s.auth.getUser(); if(!user) throw new Error("Sign in required.");
  const projectId=tv(f,"project_id"),type=tv(f,"type"),amount=nv(f,"amount"),issue=tv(f,"issue_date"),expiry=tv(f,"expiry_date"),reference=tv(f,"reference");
  const raw=f.get("attachment"), file=raw instanceof File&&raw.size>0?raw:null;
  if(!projectId||!type||amount===null||amount<=0) throw new Error("Project, type and positive amount are required.");
  if(file&&!["application/pdf","image/jpeg","image/png"].includes(file.type)) throw new Error("Attachment must be PDF, JPG or PNG.");
  if(file&&file.size>10*1024*1024) throw new Error("Attachment must be 10 MB or smaller.");
  let attachmentId:null|string=null;
  if(file){const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_"),path=`${user.id}/${crypto.randomUUID()}-${safe}`;const {error:ue}=await s.storage.from("project-documents").upload(path,file,{contentType:file.type,upsert:false});if(ue)throw new Error("Could not upload attachment: "+ue.message);const {data:a,error:ae}=await s.from("attachments").insert({storage_path:path,file_name:file.name,mime_type:file.type,uploaded_by:user.id}).select("id").single();if(ae){await s.storage.from("project-documents").remove([path]);throw new Error(ae.message)}attachmentId=a.id}
  const {error}=await s.from("securities").insert({project_id:projectId,type,amount,issue_date:issue,expiry_date:expiry,reference,status:"active",recovered_amount:0,released_amount:0,attachment_id:attachmentId});
  if(error)throw new Error("Could not save security: "+error.message); revalidatePath("/securities");
}

async function updateSecurity(f:FormData) {
  "use server";
  const s=createClient(); const id=tv(f,"security_id"),action=tv(f,"action"),amount=nv(f,"amount");
  if(!id||!action||amount===null||amount<=0)throw new Error("Positive amount is required.");
  const {data:row}=await s.from("securities").select("amount,recovered_amount,released_amount,status").eq("id",id).maybeSingle();
  if(!row||row.status!=="active")throw new Error("Only active securities can be updated.");
  const total=Number(row.amount), recovered=Number(row.recovered_amount??0), released=Number(row.released_amount??0);
  if(recovered+released+amount>total+0.000001)throw new Error("Recovery/release exceeds the security amount.");
  const patch:any=action==="recover"?{recovered_amount:recovered+amount}:{released_amount:released+amount};
  const newRecovered=action==="recover"?recovered+amount:recovered,newReleased=action==="release"?released+amount:released;
  if(newRecovered+newReleased+0.000001>=total)patch.status="released";
  const {error}=await s.from("securities").update(patch).eq("id",id);if(error)throw new Error(error.message);revalidatePath("/securities");
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
    <section className="rounded-xl border border-border bg-white p-4"><h2 className="font-medium">Add security / recovery item</h2><form action={createSecurity} encType="multipart/form-data" className="mt-4 grid min-w-0 gap-3 md:grid-cols-2 lg:grid-cols-3">
      <select required name="project_id" className="min-w-0 w-full rounded border border-border px-3 py-2 text-sm"><option value="">Select project</option>{(projects??[]).map((p:any)=><option key={p.id} value={p.id}>{p.project_code} — {p.project_name}</option>)}</select>
      <select required name="type" className="min-w-0 w-full rounded border border-border px-3 py-2 text-sm"><option value="">Select type</option>{types.map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
      <input required name="amount" type="number" min="0.01" step="0.01" placeholder="Security / advance amount (Rs)" className="min-w-0 rounded border border-border px-3 py-2 text-sm"/>
      <input name="issue_date" type="date" className="min-w-0 rounded border border-border px-3 py-2 text-sm"/><input name="expiry_date" type="date" className="min-w-0 rounded border border-border px-3 py-2 text-sm"/><input name="reference" placeholder="Reference / guarantee no." className="min-w-0 rounded border border-border px-3 py-2 text-sm"/>
      <label className="min-w-0 rounded border border-dashed border-border bg-gray-50 px-3 py-2 text-sm"><span className="block text-xs font-medium">Supporting document (optional)</span><input name="attachment" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="mt-1 block w-full min-w-0 text-xs"/><span className="text-[11px] text-gray-500">PDF, JPG or PNG · max 10 MB</span></label>
      <button className="rounded bg-active px-4 py-2 text-sm font-medium text-white">Add item</button>
    </form></section>
    <section className="overflow-hidden rounded-xl border border-border bg-white"><div className="border-b border-border px-4 py-3 font-medium">Security & recovery register</div>{error&&<p className="p-4 text-sm text-danger">{error.message}</p>}
      <div className="space-y-3 p-3 md:hidden">{securities.map((x:any)=>{const p=Array.isArray(x.projects)?x.projects[0]:x.projects,remaining=Math.max(0,Number(x.amount)-Number(x.recovered_amount??0)-Number(x.released_amount??0));return <div key={x.id} className="rounded-lg border border-border p-3"><div className="flex items-start justify-between gap-2"><div><div className="font-medium">{label(x.type)}</div><div className="text-xs text-gray-500">{p?.project_code} — {p?.project_name}</div></div><span className="rounded-full bg-gray-100 px-2 py-1 text-xs uppercase">{x.status}</span></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><Mini l="Amount" v={pkr(Number(x.amount))}/><Mini l="Remaining" v={pkr(remaining)}/><Mini l="Recovered" v={pkr(Number(x.recovered_amount??0))}/><Mini l="Released" v={pkr(Number(x.released_amount??0))}/></div>{x.attachmentUrl&&<a href={x.attachmentUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-medium text-active">📎 View document</a>}{x.status==="active"&&remaining>0&&<Actions id={x.id} max={remaining}/>}</div>})}{!securities.length&&<p className="p-3 text-sm text-gray-500">No securities or recoveries recorded yet.</p>}</div>
      <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[1000px] text-sm"><thead className="bg-gray-50 text-left text-xs text-gray-500"><tr><th className="px-4 py-2">Project</th><th>Type</th><th>Reference</th><th>Expiry</th><th className="text-right">Amount</th><th className="text-right">Recovered</th><th className="text-right">Released</th><th className="text-right">Remaining</th><th>Document</th><th className="pr-4">Action</th></tr></thead><tbody>{securities.map((x:any)=>{const p=Array.isArray(x.projects)?x.projects[0]:x.projects,remaining=Math.max(0,Number(x.amount)-Number(x.recovered_amount??0)-Number(x.released_amount??0));return <tr key={x.id} className="border-t border-border align-top"><td className="px-4 py-3">{p?.project_code} — {p?.project_name}</td><td>{label(x.type)}</td><td>{x.reference??"—"}</td><td>{x.expiry_date??"—"}</td><td className="text-right">{pkr(Number(x.amount))}</td><td className="text-right">{pkr(Number(x.recovered_amount??0))}</td><td className="text-right">{pkr(Number(x.released_amount??0))}</td><td className="text-right font-medium">{pkr(remaining)}</td><td>{x.attachmentUrl?<a href={x.attachmentUrl} target="_blank" rel="noreferrer" className="text-active">📎 View</a>:"—"}</td><td className="pr-4">{x.status==="active"&&remaining>0?<Actions id={x.id} max={remaining}/>:<span className="text-xs uppercase text-gray-500">{x.status}</span>}</td></tr>})}</tbody></table></div>
    </section>
  </div>
}
function Actions({id,max}:{id:string;max:number}){return <form action={updateSecurity} className="mt-2 flex min-w-[240px] gap-2"><input type="hidden" name="security_id" value={id}/><input name="amount" required type="number" min="0.01" max={max} step="0.01" placeholder="Amount" className="min-w-0 w-24 flex-1 rounded border border-border px-2 py-1.5 text-xs"/><button name="action" value="recover" className="rounded border px-2 py-1.5 text-xs">Recover</button><button name="action" value="release" className="rounded bg-active px-2 py-1.5 text-xs text-white">Release</button></form>}
function Metric({l,v}:{l:string;v:string}){return <div className="rounded-xl border border-border bg-white p-3 sm:p-4"><div className="text-xs text-gray-500">{l}</div><div className="mt-1 text-base font-semibold sm:text-lg">{v}</div></div>}
function Mini({l,v}:{l:string;v:string}){return <div><div className="text-gray-500">{l}</div><div className="mt-1 font-medium">{v}</div></div>}

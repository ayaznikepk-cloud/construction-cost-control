export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const categories = ["Contract / Agreement","Tender / DNIT","Work Order","Drawing","Measurement / MB","RA Bill / Certificate","Correspondence","Approval / Sanction","Site Record","Other"] as const;
const tv=(f:FormData,n:string)=>{const v=String(f.get(n)??"").trim();return v||null};
const go=(kind:string,msg:string):never=>redirect("/documents?"+new URLSearchParams({kind,msg}).toString());

async function uploadDocument(f:FormData){
  "use server";
  const s=createClient();
  const {data:{user}}=await s.auth.getUser();
  if(!user)go("error","Sign in required.");
  const projectId=tv(f,"project_id"),title=tv(f,"title"),category=tv(f,"category"),reference=tv(f,"reference"),documentDate=tv(f,"document_date"),notes=tv(f,"notes");
  const raw=f.get("file");
  if(!projectId||!title||!category)go("error","Project, category and title are required.");
  if(!(raw instanceof File)||raw.size===0){go("error","Document file is required.");return;}
  const file=raw;
  if(!["application/pdf","image/jpeg","image/png"].includes(file.type))go("error","Document must be PDF, JPG or PNG.");
  if(file.size>10*1024*1024)go("error","Document must be 10 MB or smaller.");

  const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
  const storagePath=`${user.id}/documents/${crypto.randomUUID()}-${safe}`;
  const {error:uploadError}=await s.storage.from("project-documents").upload(storagePath,file,{contentType:file.type,upsert:false});
  if(uploadError)go("error","Could not upload document: "+uploadError.message);

  const {data:attachment,error:attachmentError}=await s.from("attachments").insert({storage_path:storagePath,file_name:file.name,mime_type:file.type,uploaded_by:user.id}).select("id").single();
  if(attachmentError){await s.storage.from("project-documents").remove([storagePath]);go("error","Could not save attachment: "+attachmentError.message);}

  const {error}=await s.from("documents").insert({project_id:projectId,title,category,reference,document_date:documentDate,notes,attachment_id:attachment.id,uploaded_by:user.id});
  if(error){await s.from("attachments").delete().eq("id",attachment.id);await s.storage.from("project-documents").remove([storagePath]);go("error","Could not save document: "+error.message);}
  go("success","Document uploaded.");
}

export default async function DocumentsPage({searchParams}:{searchParams?:{kind?:string;msg?:string}}){
  const s=createClient();
  const [{data:projects},{data:documents,error}]=await Promise.all([
    s.from("projects").select("id,project_code,project_name").order("project_name"),
    s.from("documents").select("id,project_id,title,category,reference,document_date,notes,attachment_id,uploaded_at,projects(project_code,project_name)").order("uploaded_at",{ascending:false})
  ]);
  const attachmentIds=(documents??[]).map((d:any)=>d.attachment_id).filter(Boolean);
  const {data:attachments}=attachmentIds.length?await s.from("attachments").select("id,file_name,storage_path,mime_type").in("id",attachmentIds):{data:[] as any[]};
  const byId=new Map((attachments??[]).map((a:any)=>[a.id,a]));
  const rows=await Promise.all((documents??[]).map(async(d:any)=>{const a=byId.get(d.attachment_id);if(!a?.storage_path)return{...d,attachment:a,url:null};const {data}=await s.storage.from("project-documents").createSignedUrl(a.storage_path,3600);return{...d,attachment:a,url:data?.signedUrl??null}}));

  return <div className="min-w-0 space-y-6">
    <div><h1 className="text-xl font-semibold">Documents</h1><p className="mt-1 text-sm text-gray-500">Project document register for contracts, approvals, drawings, certificates and site records.</p></div>
    {searchParams?.msg&&<div className={`rounded-lg border px-4 py-3 text-sm ${searchParams.kind==="success"?"border-green-200 bg-green-50 text-green-800":"border-red-200 bg-red-50 text-red-700"}`}>{searchParams.msg}</div>}
    <section className="rounded-xl border border-border bg-white p-4">
      <h2 className="font-medium">Upload project document</h2><p className="mt-1 text-xs text-gray-500">PDF, JPG or PNG · maximum 10 MB.</p>
      <form action={uploadDocument} encType="multipart/form-data" className="mt-4 grid min-w-0 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <select required name="project_id" className="min-w-0 w-full rounded border border-border px-3 py-2 text-sm"><option value="">Select project</option>{(projects??[]).map((p:any)=><option key={p.id} value={p.id}>{p.project_code} — {p.project_name}</option>)}</select>
        <select required name="category" className="min-w-0 w-full rounded border border-border px-3 py-2 text-sm"><option value="">Select category</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select>
        <input required name="title" placeholder="Document title" className="min-w-0 w-full rounded border border-border px-3 py-2 text-sm"/>
        <input name="reference" placeholder="Reference / letter no." className="min-w-0 w-full rounded border border-border px-3 py-2 text-sm"/>
        <input name="document_date" type="date" className="min-w-0 w-full rounded border border-border px-3 py-2 text-sm"/>
        <input name="notes" placeholder="Notes (optional)" className="min-w-0 w-full rounded border border-border px-3 py-2 text-sm"/>
        <label className="min-w-0 rounded border border-dashed border-border bg-gray-50 px-3 py-2 text-sm"><span className="block text-xs font-medium">Document file</span><input required name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="mt-1 block w-full min-w-0 text-xs"/></label>
        <button className="rounded bg-active px-4 py-2 text-sm font-medium text-white">Upload document</button>
      </form>
    </section>
    <section className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="border-b border-border px-4 py-3 font-medium">Document register</div>
      {error&&<p className="p-4 text-sm text-danger">{error.message}</p>}
      <div className="space-y-3 p-3 md:hidden">{rows.map((d:any)=>{const p=Array.isArray(d.projects)?d.projects[0]:d.projects;return <div key={d.id} className="rounded-lg border border-border p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="font-medium">{d.title}</div><div className="truncate text-xs text-gray-500">{p?.project_code} — {p?.project_name}</div></div><span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[11px]">{d.category??"Other"}</span></div><div className="mt-2 text-xs text-gray-600">{d.document_date??"No document date"}{d.reference?" · "+d.reference:""}</div>{d.notes&&<div className="mt-1 text-xs text-gray-500">{d.notes}</div>}{d.url&&<a href={d.url} target="_blank" rel="noreferrer" className="mt-3 inline-block rounded border border-border px-3 py-1.5 text-xs font-medium text-active">View document</a>}</div>})}{!error&&!rows.length&&<p className="p-3 text-sm text-gray-500">No project documents uploaded yet.</p>}</div>
      <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[900px] text-sm"><thead className="bg-gray-50 text-left text-xs text-gray-500"><tr><th className="px-4 py-2">Date</th><th>Project</th><th>Category</th><th>Title</th><th>Reference</th><th>File</th><th className="pr-4">Action</th></tr></thead><tbody>{rows.map((d:any)=>{const p=Array.isArray(d.projects)?d.projects[0]:d.projects;return <tr key={d.id} className="border-t border-border"><td className="px-4 py-3">{d.document_date??"—"}</td><td>{p?.project_code} — {p?.project_name}</td><td>{d.category??"—"}</td><td className="font-medium">{d.title}</td><td>{d.reference??"—"}</td><td>{d.attachment?.file_name??"—"}</td><td className="pr-4">{d.url?<a href={d.url} target="_blank" rel="noreferrer" className="text-active hover:underline">View</a>:"—"}</td></tr>})}</tbody></table></div>
    </section>
  </div>
}

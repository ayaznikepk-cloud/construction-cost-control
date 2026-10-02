export const dynamic = "force-dynamic";

 import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import DocumentUploadForm from "@/components/documents/DocumentUploadForm";

const categories = ["Contract / Agreement","Tender / DNIT","Work Order","Drawing","Measurement / MB","RA Bill / Certificate","Correspondence","Approval / Sanction","Site Record","Other"] as const;
const tv=(f:FormData,n:string)=>{const v=String(f.get(n)??"").trim();return v||null};
type UploadState = { error: string | null; success: string | null };

async function uploadDocument(_state: UploadState, f: FormData): Promise<UploadState> {
  "use server";
  const s = createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return { error: "Your session has expired. Please sign in again.", success: null };

  const projectId = tv(f, "project_id"), title = tv(f, "title"), category = tv(f, "category"),
    reference = tv(f, "reference"), documentDate = tv(f, "document_date"), notes = tv(f, "notes");
  const raw = f.get("file");

  if (!projectId || !title || !category) return { error: "Select a project and category, and enter a document title.", success: null };
  if (!(raw instanceof File) || raw.size === 0) return { error: "Choose a document file to upload.", success: null };

  const file = raw;
  if (!["application/pdf","image/jpeg","image/png"].includes(file.type)) return { error: "Document must be PDF, JPG or PNG.", success: null };
  if (file.size > 10 * 1024 * 1024) return { error: "Document must be 10 MB or smaller.", success: null };

  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${user.id}/documents/${crypto.randomUUID()}-${safe}`;
  const { error: uploadError } = await s.storage.from("project-documents").upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: "Could not upload the file. Please try again.", success: null };

  const { data: attachment, error: attachmentError } = await s.from("attachments")
    .insert({ storage_path: storagePath, file_name: file.name, mime_type: file.type, uploaded_by: user.id })
    .select("id").single();

  if (attachmentError || !attachment) {
    await s.storage.from("project-documents").remove([storagePath]);
    return { error: "The file uploaded, but the document record could not be saved. Please try again.", success: null };
  }

  const { error } = await s.from("documents").insert({
    project_id: projectId, title, category, reference, document_date: documentDate,
    notes, attachment_id: attachment.id, uploaded_by: user.id
  });

  if (error) {
    await s.from("attachments").delete().eq("id", attachment.id);
    await s.storage.from("project-documents").remove([storagePath]);
    return { error: "Could not save the document. Your form entries have been kept.", success: null };
  }

  revalidatePath("/documents");
  return { error: null, success: "Document uploaded successfully." };
}

export default async function DocumentsPage(){
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
    <section className="rounded-xl border border-border bg-white p-4">
      <h2 className="font-medium">Upload project document</h2><p className="mt-1 text-xs text-gray-500">PDF, JPG or PNG · maximum 10 MB.</p>
      <DocumentUploadForm projects={projects ?? []} categories={categories} action={uploadDocument} />
    </section>
    <section className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="border-b border-border px-4 py-3 font-medium">Document register</div>
      {error&&<p className="p-4 text-sm text-danger">{error.message}</p>}
      <div className="space-y-3 p-3 md:hidden">{rows.map((d:any)=>{const p=Array.isArray(d.projects)?d.projects[0]:d.projects;return <div key={d.id} className="rounded-lg border border-border p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="font-medium">{d.title}</div><div className="truncate text-xs text-gray-500">{p?.project_code} — {p?.project_name}</div></div><span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[11px]">{d.category??"Other"}</span></div><div className="mt-2 text-xs text-gray-600">{d.document_date??"No document date"}{d.reference?" · "+d.reference:""}</div>{d.notes&&<div className="mt-1 text-xs text-gray-500">{d.notes}</div>}{d.url&&<a href={d.url} target="_blank" rel="noreferrer" className="mt-3 inline-block rounded border border-border px-3 py-1.5 text-xs font-medium text-active">View document</a>}</div>})}{!error&&!rows.length&&<p className="p-3 text-sm text-gray-500">No project documents uploaded yet.</p>}</div>
      <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[900px] text-sm"><thead className="bg-gray-50 text-left text-xs text-gray-500"><tr><th className="px-4 py-2">Date</th><th>Project</th><th>Category</th><th>Title</th><th>Reference</th><th>File</th><th className="pr-4">Action</th></tr></thead><tbody>{rows.map((d:any)=>{const p=Array.isArray(d.projects)?d.projects[0]:d.projects;return <tr key={d.id} className="border-t border-border"><td className="px-4 py-3">{d.document_date??"—"}</td><td>{p?.project_code} — {p?.project_name}</td><td>{d.category??"—"}</td><td className="font-medium">{d.title}</td><td>{d.reference??"—"}</td><td>{d.attachment?.file_name??"—"}</td><td className="pr-4">{d.url?<a href={d.url} target="_blank" rel="noreferrer" className="text-active hover:underline">View</a>:"—"}</td></tr>})}</tbody></table></div>
    </section>
  </div>
}

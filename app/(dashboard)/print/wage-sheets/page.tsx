export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import PrintDocument from "@/components/print/PrintDocument";
import { fmtDate, pkr, sumMoney } from "@/lib/format";

export default async function Page({searchParams}:{searchParams:{project?:string;status?:string}}) {
 const s=createClient();
 const {data:projects,error:projectsError}=await s.from("projects").select("id,project_name").order("project_name");
 const project=(projects??[]).some(p=>p.id===searchParams.project)?searchParams.project!:"all";
 const status=["draft","approved","reopened"].includes(searchParams.status??"")?searchParams.status!:"all";
 let q=s.from("wage_periods").select("id,project_id,status,period_start,period_end,projects(project_name),wage_sheets(wage_sheet_items(gross_wage,net_payable))").order("period_start",{ascending:false}).order("id");
 if(project!=="all")q=q.eq("project_id",project);
 if(status!=="all")q=q.eq("status",status);
 const rows:any[]=[];let errorMessage=projectsError?.message??"";
 if(!errorMessage) for(let offset=0;offset<100000;offset+=1000) {
  const {data,error}=await q.range(offset,offset+999);
  if(error){errorMessage=error.message;break;}
  rows.push(...(data??[]));
  if((data??[]).length<1000)break;
  if(offset===99000)errorMessage="Report too large. Narrow the filters.";
 }
 const sums=(p:any)=>{const items=(p.wage_sheets??[]).flatMap((x:any)=>x.wage_sheet_items??[]);return [sumMoney(items.map((x:any)=>x.gross_wage)),sumMoney(items.map((x:any)=>x.net_payable))];};
 const gross=sumMoney(rows.map(r=>sums(r)[0]));const net=sumMoney(rows.map(r=>sums(r)[1]));
 return <PrintDocument title="Wage Sheet Register" subtitle="Wage periods and payable totals · PKR" landscape>
 <form method="GET" className="no-print mb-4 flex flex-wrap items-center gap-2 text-sm">
 <label htmlFor="project">Project</label><select id="project" name="project" defaultValue={project} className="rounded border p-2"><option value="all">All projects</option>{(projects??[]).map(p=><option key={p.id} value={p.id}>{p.project_name}</option>)}</select>
 <label htmlFor="status">Status</label><select id="status" name="status" defaultValue={status} className="rounded border p-2"><option value="all">All</option><option value="draft">Draft</option><option value="approved">Approved</option><option value="reopened">Reopened</option></select>
 <button className="rounded border px-3 py-2">Apply filters</button></form>
 {errorMessage?<p role="alert">Unable to load wage sheet register: {errorMessage}</p>:<>
 <p className="mb-3 text-sm">{rows.length} wage period(s) · Gross {pkr(gross)} · Net payable {pkr(net)}</p>
 <table className="print-table w-full text-left text-xs"><thead><tr><th>Project</th><th>From</th><th>To</th><th>Status</th><th className="text-right">Gross</th><th className="text-right">Net payable</th></tr></thead><tbody>{rows.map(r=>{const [g,n]=sums(r);return <tr key={r.id}><td>{r.projects?.project_name??"—"}</td><td>{fmtDate(r.period_start)}</td><td>{fmtDate(r.period_end)}</td><td>{r.status}</td><td className="text-right">{pkr(g)}</td><td className="text-right">{pkr(n)}</td></tr>})}</tbody><tfoot><tr><th colSpan={4}>Total</th><th className="text-right">{pkr(gross)}</th><th className="text-right">{pkr(net)}</th></tr></tfoot></table></>}
 </PrintDocument>;
}
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DailyReportView({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: report } = await supabase.from("daily_site_reports")
    .select("id,project_id,report_date,weather,issues_delays,instructions_received,remarks")
    .eq("id", params.id).maybeSingle();
  if (!report) notFound();

  const { data: project } = await supabase.from("projects")
    .select("project_code,project_name,department,location").eq("id", report.project_id).maybeSingle();

  const [attendanceResult, materialResult, progressResult] = await Promise.all([
    supabase.from("attendance_entries")
      .select("status,overtime_hours,workers(trade),attendance_periods!inner(project_id)")
      .eq("attendance_date", report.report_date).eq("attendance_periods.project_id", report.project_id),
    supabase.from("stock_transactions")
      .select("txn_type,quantity,materials(name,units:base_unit_id(code))")
      .eq("project_id", report.project_id).eq("txn_date", report.report_date),
    supabase.from("progress_entries")
      .select("quantity_today,boq_items!inner(project_id,boq_number,description,units(code))")
      .eq("entry_date", report.report_date).eq("boq_items.project_id", report.project_id),
  ]);

  let present=0, half=0, overtime=0;
  const trades=new Map<string,number>();
  for(const a of attendanceResult.data??[]){
    const status=(a as any).status;
    if(status==="present") present++;
    if(status==="half_day") half++;
    overtime+=Number((a as any).overtime_hours??0);
    const w:any=Array.isArray((a as any).workers)?(a as any).workers[0]:(a as any).workers;
    const trade=w?.trade||"General";
    if(status==="present"||status==="half_day") trades.set(trade,(trades.get(trade)||0)+1);
  }
  const materials=(materialResult.data??[]).filter((t:any)=>String(t.txn_type??"").toLowerCase().includes("issue"));
  const works=progressResult.data??[];

  return <div className="mx-auto max-w-5xl space-y-5 print:max-w-none print:space-y-3">
    <div className="flex items-center justify-between print:hidden">
      <Link href="/daily-report" className="text-sm text-blue-600 hover:underline">← Back to Daily Site Report</Link>
      <button onClick={undefined} className="hidden">Print</button>
      <span className="text-sm text-gray-500">Use your browser Print command to print or save as PDF.</span>
    </div>

    <article className="rounded-xl border border-gray-300 bg-white p-6 print:border-0 print:p-0">
      <header className="border-b border-gray-300 pb-4 text-center">
        <h1 className="text-2xl font-bold">Daily Site Report</h1>
        <div className="mt-2 text-lg font-semibold">{project?.project_name ?? "Project"}</div>
        <div className="mt-1 text-sm text-gray-600">{project?.department ?? ""}{project?.location ? " · "+project.location : ""}</div>
      </header>

      <div className="grid grid-cols-2 gap-3 border-b border-gray-200 py-4 text-sm md:grid-cols-4">
        <Field label="Project Code" value={project?.project_code} />
        <Field label="Report Date" value={report.report_date} />
        <Field label="Weather" value={report.weather} />
        <Field label="Total Manpower" value={String(present+half)} />
      </div>

      <Section title="Labour / Manpower">
        <div className="grid gap-3 text-sm md:grid-cols-3">
          <Field label="Present" value={String(present)} /><Field label="Half Day" value={String(half)} /><Field label="Overtime" value={overtime.toLocaleString("en-PK")+" hrs"} />
        </div>
        {trades.size>0 && <div className="mt-3 text-sm"><span className="font-medium">Trades: </span>{Array.from(trades.entries()).map(([t,n])=>t+" "+n).join(" · ")}</div>}
      </Section>

      <Section title="Work Performed">
        {works.length ? <div className="space-y-3">{works.map((p:any,i:number)=>{
          const b:any=Array.isArray(p.boq_items)?p.boq_items[0]:p.boq_items;
          const u:any=Array.isArray(b?.units)?b.units[0]:b?.units;
          return <div key={i} className="border-b border-gray-100 pb-2 last:border-0"><div className="font-medium">BOQ {b?.boq_number??"—"} · {Number(p.quantity_today??0).toLocaleString("en-PK")} {u?.code??""}</div><div className="mt-1 text-sm leading-6 text-gray-700">{b?.description??"—"}</div></div>
        })}</div>:<Empty />}
      </Section>

      <Section title="Materials Issued / Consumed">
        {materials.length ? <table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="py-2">Material</th><th className="py-2 text-right">Quantity</th></tr></thead><tbody>{materials.map((t:any,i:number)=>{
          const m:any=Array.isArray(t.materials)?t.materials[0]:t.materials; const u:any=Array.isArray(m?.units)?m.units[0]:m?.units;
          return <tr key={i} className="border-b border-gray-100"><td className="py-2">{m?.name??"Material"}</td><td className="py-2 text-right">{Math.abs(Number(t.quantity??0)).toLocaleString("en-PK")} {u?.code??""}</td></tr>
        })}</tbody></table>:<Empty />}
      </Section>

      <div className="grid gap-4 md:grid-cols-3">
        <Narrative title="Issues / Delays" value={report.issues_delays}/><Narrative title="Instructions Received" value={report.instructions_received}/><Narrative title="Site Remarks / Summary" value={report.remarks}/>
      </div>
      <div className="mt-12 grid grid-cols-2 gap-16 text-sm"><div className="border-t border-gray-400 pt-2 text-center">Site Engineer / Supervisor</div><div className="border-t border-gray-400 pt-2 text-center">Project Manager / Authorized Person</div></div>
    </article>
  </div>;
}
function Section({title,children}:{title:string;children:React.ReactNode}){return <section className="border-b border-gray-200 py-4"><h2 className="mb-3 text-base font-semibold">{title}</h2>{children}</section>}
function Field({label,value}:{label:string;value:string|null|undefined}){return <div><div className="text-xs uppercase tracking-wide text-gray-500">{label}</div><div className="mt-1 font-medium">{value||"—"}</div></div>}
function Narrative({title,value}:{title:string;value:string|null}){return <section className="py-4"><h2 className="mb-2 font-semibold">{title}</h2><div className="min-h-16 whitespace-pre-wrap text-sm leading-6 text-gray-700">{value||"—"}</div></section>}
function Empty(){return <div className="text-sm text-gray-400">No activity recorded.</div>}

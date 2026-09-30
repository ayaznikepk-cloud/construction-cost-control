import { createClient } from "@/lib/supabase/server";
import { pkr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProjectLabour({ params }: { params: { projectId: string } }) {
  const s = createClient();
  const [{ data: workers }, { data: periods }, { data: payments }] = await Promise.all([
    s.from("worker_project_assignments").select("id,worker_id,workers(worker_code,name,trade,status)").eq("project_id", params.projectId),
    s.from("attendance_periods").select("id,period_start,period_end,status").eq("project_id", params.projectId).order("period_start",{ascending:false}).limit(10),
    s.from("labour_payments").select("id,payment_date,amount,payment_type,workers(name,worker_code)").eq("project_id", params.projectId).order("payment_date",{ascending:false}).limit(20)
  ]);
  const totalPaid=(payments??[]).reduce((n:any,p:any)=>n+Number(p.amount??0),0);
  return <div className="min-w-0 space-y-5">
    <div><h1 className="text-xl font-semibold">Project Labour</h1><p className="text-sm text-gray-500">Workers, attendance periods and labour payments for this project.</p></div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3"><Metric label="Assigned workers" value={String((workers??[]).length)}/><Metric label="Recent attendance periods" value={String((periods??[]).length)}/><Metric label="Recent labour paid" value={pkr(totalPaid)}/></div>
    <section className="rounded-xl border border-border bg-white"><div className="border-b px-4 py-3 font-semibold">Assigned workers</div><div className="divide-y">{(workers??[]).map((a:any)=><div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm"><div><div className="font-medium">{a.workers?.name??"Worker"}</div><div className="text-xs text-gray-500">{a.workers?.worker_code??"—"} · {a.workers?.trade??"Unspecified trade"}</div></div><span className="text-xs uppercase text-gray-500">{a.workers?.status??"—"}</span></div>)}{!(workers??[]).length&&<p className="p-4 text-sm text-gray-500">No workers assigned to this project.</p>}</div></section>
    <section className="rounded-xl border border-border bg-white"><div className="border-b px-4 py-3 font-semibold">Recent attendance periods</div><div className="divide-y">{(periods??[]).map((p:any)=><div key={p.id} className="flex justify-between px-4 py-3 text-sm"><span>{p.period_start}{p.period_end!==p.period_start?" — "+p.period_end:""}</span><span className="uppercase text-gray-500">{p.status}</span></div>)}{!(periods??[]).length&&<p className="p-4 text-sm text-gray-500">No attendance recorded for this project yet.</p>}</div></section>
  </div>;
}
function Metric({label,value}:{label:string,value:string}){return <div className="rounded-xl border border-border bg-white p-4"><div className="text-xs text-gray-500">{label}</div><div className="mt-1 text-lg font-semibold">{value}</div></div>}

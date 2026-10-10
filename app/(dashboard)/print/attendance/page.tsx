export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import PrintDocument from "@/components/print/PrintDocument";

export default async function AttendancePrint({ searchParams }: { searchParams: { project?: string; date?: string } }) {
  const s = createClient();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date ?? "") ? searchParams.date! : new Date().toISOString().slice(0, 10);
  const { data: projects } = await s.from("projects").select("id,project_name,project_code").order("project_name");
  const selected = (projects ?? []).some(p => p.id === searchParams.project) ? searchParams.project! : projects?.[0]?.id;
  const project = (projects ?? []).find(p => p.id === selected);
  const { data: period, error: periodError } = selected ? await s.from("attendance_periods").select("id,status").eq("project_id", selected).eq("period_start", date).eq("period_end", date).maybeSingle() : { data: null, error: null };
  const { data: entries, error: entriesError } = period ? await s.from("attendance_entries").select("worker_id,status,overtime_hours").eq("attendance_period_id", period.id) : { data: [], error: null };
  const { data: workers, error: workersError } = await s.from("workers").select("id,worker_code,name,trade").order("name");
  const byWorker = new Map((entries ?? []).map(e => [e.worker_id, e]));
  const recorded = (workers ?? []).filter(w => byWorker.has(w.id));
  const present = (entries ?? []).filter(e => e.status === "present").length;
  const absent = (entries ?? []).filter(e => e.status === "absent").length;
  const overtime = (entries ?? []).reduce((n, e) => n + Number(e.overtime_hours ?? 0), 0);
  return <PrintDocument title="Daily Labour Attendance" subtitle={project ? project.project_code + " — " + project.project_name + " · " + date : date}>
    <form method="GET" className="no-print mb-4 flex flex-wrap items-center gap-2"><label htmlFor="project">Project</label><select id="project" name="project" defaultValue={selected} className="rounded border p-2 text-sm">{(projects ?? []).map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}</select><label htmlFor="date">Date</label><input id="date" name="date" type="date" defaultValue={date} className="rounded border p-2 text-sm"/><button className="rounded border px-3 py-2">Apply</button></form>
    {periodError || entriesError || workersError ? <p role="alert">Unable to load attendance records.</p> : <>
      <p className="mb-3 text-sm">Period status: <strong>{period?.status ?? "Not recorded"}</strong> · Recorded: {recorded.length} · Present: {present} · Absent: {absent} · Overtime: {overtime} hours</p>
      <table className="print-table w-full text-left text-xs"><thead><tr><th>Worker code</th><th>Name</th><th>Trade</th><th>Status</th><th>Overtime hours</th></tr></thead><tbody>{recorded.map(w => { const entry = byWorker.get(w.id)!; return <tr key={w.id}><td>{w.worker_code}</td><td>{w.name}</td><td>{w.trade ?? "—"}</td><td>{entry.status}</td><td>{Number(entry.overtime_hours ?? 0)}</td></tr>; })}</tbody></table>
      {!recorded.length && <p className="mt-3 text-sm">No attendance entries recorded for this date.</p>}
      <div className="mt-12 grid grid-cols-3 gap-8 text-center text-xs"><span className="border-t pt-2">Prepared by</span><span className="border-t pt-2">Checked by</span><span className="border-t pt-2">Approved by</span></div>
    </>}
  </PrintDocument>;
}

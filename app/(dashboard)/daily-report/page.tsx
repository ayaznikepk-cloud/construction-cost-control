import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const textValue = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

async function saveDailyReport(formData: FormData) {
  "use server";
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const reportId = textValue(formData, "report_id");
  const projectId = textValue(formData, "project_id");
  const reportDate = textValue(formData, "report_date");
  if (!projectId || !reportDate) throw new Error("Project and report date are required.");

  const { data: profile } = await supabase.from("users").select("id").eq("id", user.id).single();
  const payload = {
    project_id: projectId,
    report_date: reportDate,
    weather: textValue(formData, "weather") || null,
    site_engineer_id: profile?.id ?? null,
    issues_delays: textValue(formData, "issues_delays") || null,
    instructions_received: textValue(formData, "instructions_received") || null,
    remarks: textValue(formData, "remarks") || null,
  };

  let error;
  if (reportId) {
    ({ error } = await supabase.from("daily_site_reports").update(payload).eq("id", reportId));
  } else {
    const { data: existing } = await supabase
      .from("daily_site_reports").select("id").eq("project_id", projectId).eq("report_date", reportDate).maybeSingle();
    if (existing) ({ error } = await supabase.from("daily_site_reports").update(payload).eq("id", existing.id));
    else ({ error } = await supabase.from("daily_site_reports").insert(payload));
  }
  if (error) throw new Error("Could not save daily report: " + error.message);
  revalidatePath("/daily-report");
}

export default async function DailyReportPage({ searchParams }: { searchParams?: { edit?: string } }) {
  const supabase = createClient();
  const [{ data: projects }, { data: reports }] = await Promise.all([
    supabase.from("projects").select("id, project_code, project_name").eq("status", "active").order("project_code"),
    supabase.from("daily_site_reports").select("id, project_id, report_date, weather, issues_delays, instructions_received, remarks").order("report_date", { ascending: false }).limit(50),
  ]);

  const allReports = reports ?? [];
  const projectIds = Array.from(new Set(allReports.map((r) => r.project_id)));
  const dates = allReports.map((r) => r.report_date).filter(Boolean);
  const minDate = dates.length ? [...dates].sort()[0] : "";
  const maxDate = dates.length ? [...dates].sort().at(-1)! : "";

  const [attendanceResult, materialResult, progressResult] = projectIds.length && minDate ? await Promise.all([
    supabase.from("attendance_entries")
      .select("status,overtime_hours,attendance_date,attendance_periods!inner(project_id)")
      .gte("attendance_date", minDate).lte("attendance_date", maxDate)
      .in("attendance_periods.project_id", projectIds),
    supabase.from("stock_transactions")
      .select("project_id,txn_date,txn_type,quantity,materials(name,units:base_unit_id(code))")
      .gte("txn_date", minDate).lte("txn_date", maxDate).in("project_id", projectIds),
    supabase.from("progress_entries")
      .select("entry_date,quantity_today,boq_items!inner(project_id,boq_number,description,units(code))")
      .gte("entry_date", minDate).lte("entry_date", maxDate).in("boq_items.project_id", projectIds),
  ]) : [{ data: [] }, { data: [] }, { data: [] }] as any;

  const key = (projectId: string, date: string) => projectId + "|" + date;
  const labour = new Map<string, { present: number; half: number; overtime: number }>();
  for (const a of attendanceResult.data ?? []) {
    const period: any = Array.isArray((a as any).attendance_periods) ? (a as any).attendance_periods[0] : (a as any).attendance_periods;
    if (!period?.project_id) continue;
    const k = key(period.project_id, (a as any).attendance_date);
    const row = labour.get(k) ?? { present: 0, half: 0, overtime: 0 };
    if ((a as any).status === "present") row.present += 1;
    if ((a as any).status === "half_day") row.half += 1;
    row.overtime += Number((a as any).overtime_hours ?? 0);
    labour.set(k, row);
  }

  const materialIssues = new Map<string, string[]>();
  for (const t of materialResult.data ?? []) {
    if (!String((t as any).txn_type ?? "").toLowerCase().includes("issue")) continue;
    const m: any = Array.isArray((t as any).materials) ? (t as any).materials[0] : (t as any).materials;
    const unit: any = Array.isArray(m?.units) ? m.units[0] : m?.units;
    const k = key((t as any).project_id, (t as any).txn_date);
    const rows = materialIssues.get(k) ?? [];
    rows.push(`${m?.name ?? "Material"}: ${Math.abs(Number((t as any).quantity ?? 0)).toLocaleString("en-PK")} ${unit?.code ?? ""}`.trim());
    materialIssues.set(k, rows);
  }

  const work = new Map<string, string[]>();
  for (const p of progressResult.data ?? []) {
    const b: any = Array.isArray((p as any).boq_items) ? (p as any).boq_items[0] : (p as any).boq_items;
    if (!b?.project_id) continue;
    const unit: any = Array.isArray(b.units) ? b.units[0] : b.units;
    const k = key(b.project_id, (p as any).entry_date);
    const rows = work.get(k) ?? [];
    rows.push(`${b.boq_number ?? "BOQ"}: ${Number((p as any).quantity_today ?? 0).toLocaleString("en-PK")} ${unit?.code ?? ""} — ${b.description ?? ""}`);
    work.set(k, rows);
  }

  const projectMap = new Map((projects ?? []).map((p) => [p.id, `${p.project_code} — ${p.project_name}`]));
  const editing = searchParams?.edit ? allReports.find((r) => r.id === searchParams.edit) : undefined;

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Daily Site Report</h1>
        <p className="text-sm text-gray-600">Site narrative plus an automatic operational snapshot from Labour, Materials and Work Progress.</p>
      </div>

      <form action={saveDailyReport} className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        {editing && <input type="hidden" name="report_id" value={editing.id} />}
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="font-semibold">{editing ? "Edit daily report" : "Create daily report"}</h2><p className="text-sm text-gray-600">One report per project and date. Saving the same project/date updates the existing report instead of creating a duplicate.</p></div>
          {editing && <Link href="/daily-report" className="text-sm text-blue-600 hover:underline">Cancel edit</Link>}
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <select name="project_id" required defaultValue={editing?.project_id ?? ""} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="">Select project</option>
            {(projects ?? []).map((p) => <option key={p.id} value={p.id}>{p.project_code} — {p.project_name}</option>)}
          </select>
          <input name="report_date" type="date" required defaultValue={editing?.report_date ?? ""} className="min-w-0 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <select name="weather" defaultValue={editing?.weather ?? ""} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="">Weather (optional)</option><option>Clear</option><option>Cloudy</option><option>Rain</option><option>Hot</option><option>Windy</option>
          </select>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <textarea name="issues_delays" rows={3} defaultValue={editing?.issues_delays ?? ""} placeholder="Issues / delays" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <textarea name="instructions_received" rows={3} defaultValue={editing?.instructions_received ?? ""} placeholder="Instructions received" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <textarea name="remarks" rows={3} defaultValue={editing?.remarks ?? ""} placeholder="Site remarks / work summary" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <button className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">{editing ? "Update daily report" : "Save daily report"}</button>
      </form>

      <div className="space-y-3">
        <h2 className="font-semibold">Daily report register</h2>
        {allReports.map((r) => {
          const k = key(r.project_id, r.report_date);
          const l = labour.get(k);
          const materials = materialIssues.get(k) ?? [];
          const works = work.get(k) ?? [];
          return <article key={r.id} className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="font-semibold">{r.report_date} · {projectMap.get(r.project_id) ?? "Project"}</div><div className="mt-1 text-sm text-gray-500">Weather: {r.weather || "—"}</div></div>
              <Link href={"/daily-report?edit=" + r.id} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">Edit report</Link>
              <Link href={"/daily-report/" + r.id} className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700">View / Print</Link>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Snapshot title="Labour" empty={!l} lines={l ? [`Present: ${l.present}`, `Half day: ${l.half}`, `Overtime: ${l.overtime.toLocaleString("en-PK")} hrs`] : []} />
              <Snapshot title="Materials issued" empty={!materials.length} lines={materials} />
              <Snapshot title="Work progress" empty={!works.length} lines={works} />
            </div>
            <div className="grid gap-3 border-t pt-3 text-sm md:grid-cols-3">
              <Note label="Issues / delays" value={r.issues_delays} />
              <Note label="Instructions" value={r.instructions_received} />
              <Note label="Remarks" value={r.remarks} />
            </div>
          </article>;
        })}
        {!allReports.length && <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">No daily site reports recorded yet.</div>}
      </div>
    </div>
  );
}

function Snapshot({ title, lines, empty }: { title: string; lines: string[]; empty: boolean }) {
  return <div className="rounded-lg bg-gray-50 p-3"><div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</div>{empty ? <div className="text-sm text-gray-400">No activity recorded</div> : <div className="space-y-1 text-sm">{lines.slice(0, 6).map((line, i) => <div key={i} className="whitespace-normal break-words leading-5" title={line}>{line}</div>)}{lines.length > 6 && <div className="text-xs text-gray-500">+ {lines.length - 6} more</div>}</div>}</div>;
}
function Note({ label, value }: { label: string; value: string | null }) {
  return <div><div className="text-xs font-medium text-gray-500">{label}</div><div className="mt-1 text-gray-800">{value || "—"}</div></div>;
}

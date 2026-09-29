import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function createDailyReport(formData: FormData) {
  "use server";
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const projectId = String(formData.get("project_id") || "");
  const reportDate = String(formData.get("report_date") || "");
  if (!projectId || !reportDate) return;

  const { data: profile } = await supabase.from("users").select("id").eq("id", user.id).single();
  const payload = {
    project_id: projectId,
    report_date: reportDate,
    weather: String(formData.get("weather") || "") || null,
    site_engineer_id: profile?.id ?? null,
    issues_delays: String(formData.get("issues_delays") || "") || null,
    instructions_received: String(formData.get("instructions_received") || "") || null,
    remarks: String(formData.get("remarks") || "") || null,
  };

  await supabase.from("daily_site_reports").insert(payload);
  revalidatePath("/daily-report");
}

export default async function DailyReportPage() {
  const supabase = createClient();
  const [{ data: projects }, { data: reports }] = await Promise.all([
    supabase.from("projects").select("id, project_code, project_name").eq("status", "active").order("project_code"),
    supabase.from("daily_site_reports").select("id, project_id, report_date, weather, issues_delays, instructions_received, remarks").order("report_date", { ascending: false }).limit(50),
  ]);

  const projectMap = new Map((projects ?? []).map((p) => [p.id, `${p.project_code} — ${p.project_name}`]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Daily Site Report</h1>
        <p className="text-sm text-gray-600">Record daily site conditions, instructions, delays and site remarks. Measured BOQ quantities remain in Work Progress.</p>
      </div>

      <form action={createDailyReport} className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <div>
          <h2 className="font-semibold">Create daily report</h2>
          <p className="text-sm text-gray-600">One report records the site narrative for a project and date.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <select name="project_id" required className="rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="">Select project</option>
            {(projects ?? []).map((p) => <option key={p.id} value={p.id}>{p.project_code} — {p.project_name}</option>)}
          </select>
          <input name="report_date" type="date" required className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <select name="weather" className="rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="">Weather (optional)</option><option>Clear</option><option>Cloudy</option><option>Rain</option><option>Hot</option><option>Windy</option>
          </select>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <textarea name="issues_delays" rows={3} placeholder="Issues / delays" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          <textarea name="instructions_received" rows={3} placeholder="Instructions received" className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <textarea name="remarks" rows={3} placeholder="Site remarks / work summary" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        <button className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Save daily report</button>
      </form>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4"><h2 className="font-semibold">Daily report register</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs text-gray-600"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Project</th><th className="px-4 py-3">Weather</th><th className="px-4 py-3">Issues / Delays</th><th className="px-4 py-3">Instructions</th><th className="px-4 py-3">Remarks</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {(reports ?? []).map((r) => <tr key={r.id}><td className="whitespace-nowrap px-4 py-3">{r.report_date}</td><td className="px-4 py-3">{projectMap.get(r.project_id) ?? "Project"}</td><td className="px-4 py-3">{r.weather || "—"}</td><td className="max-w-xs px-4 py-3">{r.issues_delays || "—"}</td><td className="max-w-xs px-4 py-3">{r.instructions_received || "—"}</td><td className="max-w-xs px-4 py-3">{r.remarks || "—"}</td></tr>)}
              {!reports?.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No daily site reports recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

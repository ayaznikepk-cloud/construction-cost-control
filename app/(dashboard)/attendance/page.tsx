export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import AttendanceForm from "@/components/labour/AttendanceForm";

async function saveAttendance(formData: FormData) {
  "use server";
  const supabase = createClient();

  const projectId = formData.get("project_id") as string;
  const date = formData.get("date") as string;
  const entries = JSON.parse(formData.get("entries") as string) as {
    worker_id: string;
    status: string;
    overtime_hours: number;
  }[];

  let { data: period } = await supabase
    .from("attendance_periods")
    .select("id, status")
    .eq("project_id", projectId)
    .eq("period_start", date)
    .eq("period_end", date)
    .maybeSingle();

  if (!period) {
    const { data: newPeriod, error: periodError } = await supabase
      .from("attendance_periods")
      .insert({ project_id: projectId, period_start: date, period_end: date })
      .select("id, status")
      .single();
    if (periodError) throw new Error(`Could not create attendance period: ${periodError.message}`);
    period = newPeriod;
  }

  if (period!.status === "approved") {
    throw new Error("This day's attendance is approved and locked. Reopen it before editing.");
  }

  const rows = entries.map((e) => ({
    attendance_period_id: period!.id,
    worker_id: e.worker_id,
    attendance_date: date,
    status: e.status,
    overtime_hours: e.overtime_hours || 0,
  }));

  if (rows.length > 0) {
    const { error: upsertError } = await supabase
      .from("attendance_entries")
      .upsert(rows, { onConflict: "attendance_period_id,worker_id,attendance_date" });
    if (upsertError) throw new Error(`Could not save attendance: ${upsertError.message}`);
  }

  revalidatePath("/attendance");
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: { project?: string; date?: string };
}) {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const date = searchParams.date ?? today;

  const { data: projects } = await supabase
    .from("projects")
    .select("id, project_code, project_name")
    .eq("status", "active")
    .order("project_name");

  const projectId = searchParams.project ?? projects?.[0]?.id;

  const { data: workers } = await supabase
    .from("workers")
    .select("id, worker_code, name, trade")
    .eq("status", "active")
    .order("name");

  const existing: Record<string, { status: any; overtime_hours: number }> = {};

  if (projectId) {
    const { data: period } = await supabase
      .from("attendance_periods")
      .select("id")
      .eq("project_id", projectId)
      .eq("period_start", date)
      .eq("period_end", date)
      .maybeSingle();

    if (period) {
      const { data: entries } = await supabase
        .from("attendance_entries")
        .select("worker_id, status, overtime_hours")
        .eq("attendance_period_id", period.id);

      entries?.forEach((e) => {
        existing[e.worker_id] = { status: e.status, overtime_hours: Number(e.overtime_hours) };
      });
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="text-lg font-semibold">Labour Attendance</h1>{projectId && <Link href={`/print/attendance?project=${encodeURIComponent(projectId)}&date=${encodeURIComponent(date)}`} className="rounded border px-3 py-2 text-sm font-medium">Print attendance / PDF</Link>}</div>

      <form method="GET" className="mb-4 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3">
        <select
          name="project"
          defaultValue={projectId}
          className="col-span-2 min-w-0 w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
        >
          {projects?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.project_code} — {p.project_name}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="date"
          defaultValue={date}
          className="min-w-0 w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
        />
        <button className="rounded-md bg-active px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          Go
        </button>
      </form>

      {!projectId ? (
        <div className="rounded-lg border border-border bg-white p-6 text-center text-sm text-gray-500">
          No active projects yet — add one under Projects first.
        </div>
      ) : (
        <AttendanceForm
          projectId={projectId}
          date={date}
          workers={workers ?? []}
          existing={existing}
          action={saveAttendance}
        />
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WageSheetReview from "@/components/labour/WageSheetReview";
import { fmtDate, type ActionResult } from "@/lib/format";

async function saveDeductions(
  rows: { id: string; recovery: number; other: number }[]
): Promise<ActionResult> {
  "use server";
  const supabase = createClient();
  for (const r of rows) {
    const { error } = await supabase.rpc("update_wage_deductions", {
      p_item: r.id,
      p_recovery: r.recovery,
      p_other: r.other,
    });
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true };
}

async function approve(periodId: string): Promise<ActionResult> {
  "use server";
  const supabase = createClient();
  const { error } = await supabase.rpc("approve_wage_sheet", { p_period: periodId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function discard(periodId: string): Promise<ActionResult> {
  "use server";
  const supabase = createClient();
  const { error } = await supabase.rpc("discard_wage_draft", { p_period: periodId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export default async function WageSheetDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: period } = await supabase
    .from("wage_periods")
    .select("id, status, period_start, period_end, approved_at, projects(project_name)")
    .eq("id", params.id)
    .maybeSingle();
  if (!period) notFound();

  const { data: sheet, error } = await supabase
    .from("wage_sheets")
    .select(
      "id, wage_sheet_items(id, worker_id, working_days, half_days, overtime_hours, basic_wages, overtime_amount, gross_wage, advance_recovery, other_deductions, net_payable, workers(name, worker_code))"
    )
    .eq("wage_period_id", params.id)
    .maybeSingle();

  const rawItems: any[] = sheet?.wage_sheet_items ?? [];
  const workerIds = rawItems.map((i) => i.worker_id);
  const { data: ledger } = workerIds.length
    ? await supabase.from("v_worker_payable").select("worker_id, outstanding_advance").in("worker_id", workerIds)
    : { data: [] as any[] };
  const advanceByWorker = new Map((ledger ?? []).map((l: any) => [l.worker_id, l.outstanding_advance]));

  const items = rawItems
    .map((i) => ({
      id: i.id,
      worker_name: i.workers?.name ?? "",
      worker_code: i.workers?.worker_code ?? "",
      working_days: i.working_days,
      half_days: i.half_days,
      overtime_hours: i.overtime_hours,
      basic_wages: i.basic_wages,
      overtime_amount: i.overtime_amount,
      gross_wage: i.gross_wage,
      advance_recovery: i.advance_recovery,
      other_deductions: i.other_deductions,
      net_payable: i.net_payable,
      outstanding_advance: Number(advanceByWorker.get(i.worker_id) ?? 0),
    }))
    .sort((a, b) => a.worker_name.localeCompare(b.worker_name));

  const projectName = (period as any).projects?.project_name;

  return (
    <div>
      <Link href="/labour-payments/wage-sheets" className="mb-3 inline-block text-sm text-active hover:underline">
        ← All wage sheets
      </Link>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-base font-semibold">
          {projectName}: {fmtDate(period.period_start)} to {fmtDate(period.period_end)}
        </h2>
        <Link href={`/print/wage-sheets/${period.id}`} className="ml-auto rounded border px-3 py-2 text-sm font-medium hover:bg-gray-50">Print wage sheet / PDF</Link>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
            period.status === "approved" ? "bg-green-50 text-positive" : "bg-amber-50 text-warning"
          }`}
        >
          {period.status}
        </span>
      </div>
      {period.status === "approved" && (
        <p className="mb-4 text-sm text-gray-500">
          Approved {fmtDate(period.approved_at)}. Attendance for this period is locked. Payments are recorded on the
          Worker Ledger tab.
        </p>
      )}
      {error && <div className="mb-4 text-sm text-danger">Could not load wage sheet: {error.message}</div>}
      <WageSheetReview
        periodId={period.id}
        status={period.status}
        items={items}
        saveDeductions={saveDeductions}
        approve={approve}
        discard={discard}
      />
    </div>
  );
}

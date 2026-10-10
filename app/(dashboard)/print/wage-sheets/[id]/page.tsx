export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrintDocument from "@/components/print/PrintDocument";
import { fmtDate, pkr, sumMoney } from "@/lib/format";

export default async function WageSheetPrint({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: period, error: periodError } = await supabase.from("wage_periods")
    .select("id,status,period_start,period_end,approved_at,projects(project_name)")
    .eq("id", params.id).maybeSingle();
  if (!period && !periodError) notFound();

  const { data: sheet, error: sheetError } = period ? await supabase.from("wage_sheets")
    .select("id,wage_sheet_items(id,worker_id,working_days,half_days,overtime_hours,basic_wages,overtime_amount,gross_wage,advance_recovery,other_deductions,net_payable,workers(name,worker_code))")
    .eq("wage_period_id", params.id).maybeSingle() : { data: null, error: null };
  const items: any[] = (sheet?.wage_sheet_items ?? []).sort((a: any,b: any) => String(a.workers?.name ?? "").localeCompare(String(b.workers?.name ?? "")));
  const total = (field: string) => sumMoney(items.map(i => i[field]));
  const subtitle = period ? `${(period as any).projects?.project_name ?? "Project"} · ${fmtDate(period.period_start)} to ${fmtDate(period.period_end)}` : "Wage sheet";
  return <PrintDocument title="Labour Wage Sheet" subtitle={subtitle} landscape>
    {periodError || sheetError ? <p role="alert" className="text-red-700">Unable to load wage sheet. Please retry.</p> : <>
      <div className="mb-4 flex flex-wrap gap-6 text-sm">
        <span>Status: <strong className="uppercase">{period?.status}</strong></span>
        {period?.approved_at && <span>Approved: {fmtDate(period.approved_at)}</span>}
        {period?.status !== "approved" && <strong className="text-amber-700">DRAFT / NOT APPROVED — values reflect saved records only</strong>}
      </div>
      <table className="print-table w-full text-right text-xs">
        <thead><tr><th className="text-left">Worker</th><th>Days</th><th>Half</th><th>OT hrs</th><th>Basic</th><th>OT amount</th><th>Gross</th><th>Advance recovery</th><th>Other deductions</th><th>Net payable</th></tr></thead>
        <tbody>{items.map(i => <tr key={i.id}><td className="text-left">{i.workers?.name ?? "—"}<div className="text-gray-500">{i.workers?.worker_code ?? ""}</div></td><td>{Number(i.working_days ?? 0)}</td><td>{Number(i.half_days ?? 0)}</td><td>{Number(i.overtime_hours ?? 0)}</td><td>{pkr(i.basic_wages)}</td><td>{pkr(i.overtime_amount)}</td><td>{pkr(i.gross_wage)}</td><td>{pkr(i.advance_recovery)}</td><td>{pkr(i.other_deductions)}</td><td className="font-semibold">{pkr(i.net_payable)}</td></tr>)}</tbody>
        <tfoot><tr><th className="text-left" colSpan={6}>Total</th><th>{pkr(total("gross_wage"))}</th><th>{pkr(total("advance_recovery"))}</th><th>{pkr(total("other_deductions"))}</th><th>{pkr(total("net_payable"))}</th></tr></tfoot>
      </table>
      {!items.length && <p className="mt-3 text-sm">No wage sheet items recorded.</p>}
      <div className="mt-12 grid grid-cols-3 gap-8 text-center text-xs"><span className="border-t pt-2">Prepared by</span><span className="border-t pt-2">Checked by</span><span className="border-t pt-2">Approved by</span></div>
    </>}
  </PrintDocument>;
}

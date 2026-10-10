export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import GenerateWageSheetForm from "@/components/labour/GenerateWageSheetForm";
import { fmtDate, pkr, sumMoney, type ActionResult } from "@/lib/format";

async function generateSheet(formData: FormData): Promise<ActionResult> {
  "use server";
  const supabase = createClient();
  const { data, error } = await supabase.rpc("generate_wage_sheet", {
    p_project_id: formData.get("project_id"),
    p_from: formData.get("from"),
    p_to: formData.get("to"),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data as string };
}

const statusTone: Record<string, string> = {
  draft: "bg-amber-50 text-warning",
  approved: "bg-green-50 text-positive",
  reopened: "bg-gray-100 text-gray-600",
};

export default async function WageSheetsPage() {
  const supabase = createClient();

  const [{ data: projects }, { data: periods, error }] = await Promise.all([
    supabase.from("projects").select("id, project_name").eq("status", "active").order("project_name"),
    supabase
      .from("wage_periods")
      .select("id, status, period_start, period_end, projects(project_name), wage_sheets(wage_sheet_items(gross_wage, net_payable))")
      .order("period_start", { ascending: false }),
  ]);

  return (
    <div>
      <div className="mb-4 flex justify-end"><Link href="/print/wage-sheets" className="rounded border px-3 py-2 text-sm font-medium hover:bg-gray-50">Print wage sheet register / PDF</Link></div>
      <GenerateWageSheetForm projects={projects ?? []} action={generateSheet} />

      <div className="rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-gray-500">
              <th className="px-4 py-2 font-medium">Project</th>
              <th className="px-4 py-2 font-medium">Period</th>
              <th className="px-4 py-2 text-right font-medium">Gross</th>
              <th className="px-4 py-2 text-right font-medium">Net Payable</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 text-right font-medium">Print</th>
            </tr>
          </thead>
          <tbody>
            {error && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-danger">
                  Could not load wage sheets: {error.message}
                </td>
              </tr>
            )}
            {periods?.map((p: any) => {
              const items = (p.wage_sheets ?? []).flatMap((s: any) => s.wage_sheet_items ?? []);
              return (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2">{p.projects?.project_name}</td>
                  <td className="px-4 py-2">
                    <Link href={`/labour-payments/wage-sheets/${p.id}`} className="text-active hover:underline">
                      {fmtDate(p.period_start)} to {fmtDate(p.period_end)}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{pkr(sumMoney(items.map((i: any) => i.gross_wage)))}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{pkr(sumMoney(items.map((i: any) => i.net_payable)))}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusTone[p.status] ?? ""}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right"><Link href={`/print/wage-sheets/${p.id}`} className="text-active hover:underline">Print / PDF</Link></td>
                </tr>
              );
            })}
            {!error && (periods ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                  No wage sheets yet. Record attendance first, then generate one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

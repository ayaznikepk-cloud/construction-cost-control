export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import LedgerForms from "@/components/labour/LedgerForms";
import { pkr, sumMoney, type ActionResult } from "@/lib/format";

async function giveAdvance(formData: FormData): Promise<ActionResult> {
  "use server";
  const supabase = createClient();
  const { error } = await supabase.rpc("record_worker_advance", {
    p_worker: formData.get("worker_id"),
    p_amount: Number(formData.get("amount")),
    p_date: formData.get("date"),
    p_remarks: (formData.get("remarks") as string) || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/labour-payments");
  return { ok: true };
}

async function payWages(formData: FormData): Promise<ActionResult> {
  "use server";
  const supabase = createClient();
  const { error } = await supabase.rpc("record_labour_payment", {
    p_worker: formData.get("worker_id"),
    p_amount: Number(formData.get("amount")),
    p_date: formData.get("date"),
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/labour-payments");
  return { ok: true };
}

export default async function WorkerLedgerPage() {
  const supabase = createClient();

  const [{ data: ledger, error }, { data: workers }] = await Promise.all([
    supabase.from("v_worker_payable").select("*").order("worker_name"),
    supabase.from("workers").select("id, name, worker_code").eq("status", "active").order("name"),
  ]);

  const totalPayable = sumMoney((ledger ?? []).map((l) => l.outstanding_wage_payable));
  const totalAdvance = sumMoney((ledger ?? []).map((l) => l.outstanding_advance));

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-white p-4">
          <div className="text-xs text-gray-500">Wages Payable (approved sheets)</div>
          <div className="mt-1 text-xl font-semibold text-danger">{pkr(totalPayable)}</div>
        </div>
        <div className="rounded-lg border border-border bg-white p-4">
          <div className="text-xs text-gray-500">Advances Outstanding</div>
          <div className="mt-1 text-xl font-semibold text-warning">{pkr(totalAdvance)}</div>
        </div>
      </div>

      <LedgerForms workers={workers ?? []} giveAdvance={giveAdvance} payWages={payWages} />

      <div className="rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-gray-500">
              <th className="px-4 py-2 font-medium">Worker</th>
              <th className="px-4 py-2 text-right font-medium">Wages Earned</th>
              <th className="px-4 py-2 text-right font-medium">Paid</th>
              <th className="px-4 py-2 text-right font-medium">Wages Payable</th>
              <th className="px-4 py-2 text-right font-medium">Advance Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {error && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-danger">
                  Could not load ledger: {error.message}
                </td>
              </tr>
            )}
            {ledger?.map((l) => (
              <tr key={l.worker_id} className="border-b border-border last:border-0">
                <td className="px-4 py-2">{l.worker_name}</td>
                <td className="px-4 py-2 text-right tabular-nums">{pkr(l.total_wages_earned)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{pkr(l.total_paid)}</td>
                <td className="px-4 py-2 text-right font-medium tabular-nums">{pkr(l.outstanding_wage_payable)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{pkr(l.outstanding_advance)}</td>
              </tr>
            ))}
            {!error && (ledger ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                  No workers yet — add them under Setup → Labour.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

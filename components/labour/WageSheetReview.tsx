"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { pkr, sumMoney, type ActionResult } from "@/lib/format";
import FormStatusMessage from "@/components/shared/FormStatusMessage";

type Item = {
  id: string;
  worker_name: string;
  worker_code: string;
  working_days: number;
  half_days: number;
  overtime_hours: number;
  basic_wages: number;
  overtime_amount: number;
  gross_wage: number;
  advance_recovery: number;
  other_deductions: number;
  net_payable: number;
  outstanding_advance: number;
};

export default function WageSheetReview({
  periodId,
  status,
  items,
  saveDeductions,
  approve,
  discard,
}: {
  periodId: string;
  status: string;
  items: Item[];
  saveDeductions: (rows: { id: string; recovery: number; other: number }[]) => Promise<ActionResult>;
  approve: (periodId: string) => Promise<ActionResult>;
  discard: (periodId: string) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const isDraft = status === "draft";
  const [edits, setEdits] = useState<Record<string, { recovery: string; other: string }>>(() =>
    Object.fromEntries(
      items.map((i) => [i.id, { recovery: String(i.advance_recovery ?? 0), other: String(i.other_deductions ?? 0) }])
    )
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const netFor = (i: Item) => {
    const e = edits[i.id];
    const paisa = Math.round(Number(i.gross_wage) * 100) - Math.round(Number(e.recovery || 0) * 100) - Math.round(Number(e.other || 0) * 100);
    return paisa / 100;
  };
  const dirty = items.some(
    (i) => Number(edits[i.id].recovery || 0) !== Number(i.advance_recovery) || Number(edits[i.id].other || 0) !== Number(i.other_deductions)
  );

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty || busy) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, busy]);

  async function run(fn: () => Promise<ActionResult>, ok: string, after?: () => void) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await fn();
      if (!result.ok) {
        setError(result.error);
        return false;
      }
      setMessage(ok);
      after?.();
      router.refresh();
      return true;
    } catch {
      setError("Could not complete this action. Your unsaved deductions have been kept.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const save = () =>
    run(
      () =>
        saveDeductions(
          items.map((i) => ({ id: i.id, recovery: Number(edits[i.id].recovery || 0), other: Number(edits[i.id].other || 0) }))
        ),
      "Deductions saved."
    );

  async function handleApprove() {
    if (dirty && !(await save())) return;
    if (!window.confirm(`Approve this wage sheet with a net payable of ${pkr(totalNet)}? Attendance for the period will be locked and advance recoveries will be booked.`)) return;
    run(() => approve(periodId), "Wage sheet approved.");
  }

  function handleDiscard() {
    if (!window.confirm("Discard this draft wage sheet? This removes the draft and cannot be undone from this screen.")) return;
    run(() => discard(periodId), "Discarded.", () => router.push("/labour-payments/wage-sheets"));
  }

  const totalGross = sumMoney(items.map((i) => i.gross_wage));
  const totalNet = sumMoney(items.map((i) => netFor(i)));

  return (
    <div>
      {error && <div className="mb-4"><FormStatusMessage kind="error">{error}</FormStatusMessage></div>}
      {message && !error && <div className="mb-4"><FormStatusMessage kind="success">{message}</FormStatusMessage></div>}
      {dirty && isDraft && !busy && <div className="mb-4"><FormStatusMessage kind="info">You have unsaved deduction changes.</FormStatusMessage></div>}

      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-gray-500">
              <th className="px-3 py-2 font-medium">Worker</th>
              <th className="px-3 py-2 text-right font-medium">Days</th>
              <th className="px-3 py-2 text-right font-medium">Half</th>
              <th className="px-3 py-2 text-right font-medium">OT hrs</th>
              <th className="px-3 py-2 text-right font-medium">Basic</th>
              <th className="px-3 py-2 text-right font-medium">OT amt</th>
              <th className="px-3 py-2 text-right font-medium">Gross</th>
              <th className="px-3 py-2 text-right font-medium">Advance recovery</th>
              <th className="px-3 py-2 text-right font-medium">Other deductions</th>
              <th className="px-3 py-2 text-right font-medium">Net payable</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2">
                  <div className="font-medium">{i.worker_name}</div>
                  <div className="text-xs text-gray-500">
                    {i.worker_code}
                    {isDraft && Number(i.outstanding_advance) > 0 ? ` · advance due ${pkr(i.outstanding_advance)}` : ""}
                  </div>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{Number(i.working_days)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{Number(i.half_days)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{Number(i.overtime_hours)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{pkr(i.basic_wages)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{pkr(i.overtime_amount)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{pkr(i.gross_wage)}</td>
                <td className="px-3 py-2 text-right">
                  {isDraft ? (
                    <input
                      type="number" min="0" step="0.01"
                      value={edits[i.id].recovery}
                      onChange={(e) => setEdits((p) => ({ ...p, [i.id]: { ...p[i.id], recovery: e.target.value } }))}
                      className="w-24 rounded-md border border-border px-2 py-1 text-right text-sm"
                    />
                  ) : (
                    <span className="tabular-nums">{pkr(i.advance_recovery)}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {isDraft ? (
                    <input
                      type="number" min="0" step="0.01"
                      value={edits[i.id].other}
                      onChange={(e) => setEdits((p) => ({ ...p, [i.id]: { ...p[i.id], other: e.target.value } }))}
                      className="w-24 rounded-md border border-border px-2 py-1 text-right text-sm"
                    />
                  ) : (
                    <span className="tabular-nums">{pkr(i.other_deductions)}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-medium tabular-nums">{pkr(isDraft ? netFor(i) : i.net_payable)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-gray-50 font-medium">
              <td className="px-3 py-2" colSpan={6}>Total</td>
              <td className="px-3 py-2 text-right tabular-nums">{pkr(totalGross)}</td>
              <td colSpan={2}></td>
              <td className="px-3 py-2 text-right tabular-nums">{pkr(isDraft ? totalNet : sumMoney(items.map((i) => i.net_payable)))}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {isDraft && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={save} disabled={busy || !dirty} className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
            {busy ? "Saving..." : "Save deductions"}
          </button>
          <button onClick={handleApprove} disabled={busy} className="rounded-md bg-positive px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
            {busy ? "Working..." : "Approve wage sheet"}
          </button>
          <button onClick={handleDiscard} disabled={busy} className="rounded-md px-4 py-2 text-sm font-medium text-danger hover:bg-red-50 disabled:opacity-50">
            {busy ? "Working..." : "Discard draft"}
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/format";
import { pkr } from "@/lib/format";
import FormStatusMessage from "@/components/shared/FormStatusMessage";

type WorkerOption = { id: string; name: string; worker_code: string };

function LedgerForm({
  title,
  buttonLabel,
  workers,
  action,
  showRemarks,
}: {
  title: string;
  buttonLabel: string;
  workers: WorkerOption[];
  action: (formData: FormData) => Promise<ActionResult>;
  showRemarks?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [workerId, setWorkerId] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  async function handleAction(formData: FormData) {
    const amount = Number(formData.get("amount") ?? 0);
    const worker = workers.find((w) => w.id === workerId);
    if (!worker) {
      setError("Select a worker before saving.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    const description = title === "Give advance" ? "advance" : "wage payment";
    if (!window.confirm(`Record ${description} of ${pkr(amount)} for ${worker.name} (${worker.worker_code})?`)) return;

    setPending(true);
    setError(null);
    setDone(false);
    try {
      const result = await action(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      setWorkerId("");
      setDone(true);
      router.refresh();
    } catch {
      setError("Could not save this transaction. Your entries have been kept so you can try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} action={handleAction} className="rounded-lg border border-border bg-white p-4">
      <div className="mb-3 text-sm font-medium">{title}</div>
      {error && <div className="mb-3"><FormStatusMessage kind="error">{error}</FormStatusMessage></div>}
      {done && !error && <div className="mb-3"><FormStatusMessage kind="success">Transaction saved successfully.</FormStatusMessage></div>}
      <div className="grid grid-cols-2 gap-2">
        <select name="worker_id" required value={workerId} onChange={(e)=>setWorkerId(e.target.value)} className="col-span-2 rounded-md border border-border px-3 py-2 text-sm">
          <option value="">Select worker</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} ({w.worker_code})
            </option>
          ))}
        </select>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          placeholder="Amount (Rs)"
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
        <input
          name="date"
          type="date"
          defaultValue={today}
          required
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
        {showRemarks && (
          <input
            name="remarks"
            placeholder="Remarks (optional)"
            className="col-span-2 rounded-md border border-border px-3 py-2 text-sm"
          />
        )}
      </div>
      <button
        disabled={pending}
        className="mt-2 w-full rounded-md bg-active px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Saving transaction..." : buttonLabel}
      </button>
      <p className="mt-2 text-center text-[11px] text-gray-500">You will be asked to confirm the worker and amount before saving.</p>
    </form>
  );
}

export default function LedgerForms({
  workers,
  giveAdvance,
  payWages,
}: {
  workers: WorkerOption[];
  giveAdvance: (formData: FormData) => Promise<ActionResult>;
  payWages: (formData: FormData) => Promise<ActionResult>;
}) {
  return (
    <div className="mb-6 grid gap-4 md:grid-cols-2">
      <LedgerForm title="Give advance" buttonLabel="Record advance" workers={workers} action={giveAdvance} showRemarks />
      <LedgerForm title="Pay wages" buttonLabel="Record payment" workers={workers} action={payWages} />
    </div>
  );
}

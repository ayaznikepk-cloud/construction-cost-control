"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/format";

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
  const today = new Date().toISOString().slice(0, 10);

  async function handleAction(formData: FormData) {
    setPending(true);
    setError(null);
    setDone(false);
    const result = await action(formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    formRef.current?.reset();
    setDone(true);
    router.refresh();
  }

  return (
    <form ref={formRef} action={handleAction} className="rounded-lg border border-border bg-white p-4">
      <div className="mb-3 text-sm font-medium">{title}</div>
      {error && <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-danger">{error}</div>}
      {done && !error && <div className="mb-3 rounded-md bg-green-50 px-3 py-2 text-sm text-positive">Saved.</div>}
      <div className="grid grid-cols-2 gap-2">
        <select name="worker_id" required className="col-span-2 rounded-md border border-border px-3 py-2 text-sm">
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
        {pending ? "Saving..." : buttonLabel}
      </button>
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

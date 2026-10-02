"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { pkr } from "@/lib/format";
import FormStatusMessage from "@/components/shared/FormStatusMessage";

type BillOption = {
  id: string;
  bill_number: string;
  outstanding: number;
  project_id: string;
  project_code: string;
  project_name: string;
};

type State = { error: string | null; success: string | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="rounded-md bg-active px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">
      {pending ? "Recording receipt..." : "Record receipt"}
    </button>
  );
}

export default function ReceiptEntryForm({
  bills,
  action,
}: {
  bills: BillOption[];
  action: (state: State, formData: FormData) => Promise<State>;
}) {
  const [state, formAction] = useFormState(action, { error: null, success: null });
  const ref = useRef<HTMLFormElement>(null);
  const [billId, setBillId] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const selected = useMemo(() => bills.find((b) => b.id === billId), [bills, billId]);

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      setBillId("");
    }
  }, [state.success]);

  function confirmSubmit(event: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(event.currentTarget);
    const amount = Number(fd.get("amount_received") ?? 0);
    const file = fd.get("payment_advice");

    if (!selected) return;
    if (amount > selected.outstanding + 0.000001) {
      event.preventDefault();
      window.alert(`Receipt cannot exceed the outstanding balance (${pkr(selected.outstanding)}).`);
      return;
    }
    if (file instanceof File && file.size > 10 * 1024 * 1024) {
      event.preventDefault();
      window.alert("Attachment must be 10 MB or smaller.");
      return;
    }
    if (!window.confirm(`Record receipt of ${pkr(amount)} against RA ${selected.bill_number} for ${selected.project_code} — ${selected.project_name}?`)) {
      event.preventDefault();
    }
  }

  return (
    <form ref={ref} action={formAction} onSubmit={confirmSubmit} encType="multipart/form-data" className="mt-4 grid min-w-0 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {state.error && <div className="md:col-span-2 lg:col-span-3"><FormStatusMessage kind="error">{state.error}</FormStatusMessage></div>}
      {state.success && <div className="md:col-span-2 lg:col-span-3"><FormStatusMessage kind="success">{state.success}</FormStatusMessage></div>}

      <select name="ra_bill_id" required value={billId} onChange={(e) => setBillId(e.target.value)} className="min-w-0 w-full rounded-md border border-border px-3 py-2 text-sm">
        <option value="">Select passed RA bill</option>
        {bills.map((bill) => (
          <option key={bill.id} value={bill.id}>
            {bill.project_code} — RA {bill.bill_number} — {pkr(bill.outstanding)} outstanding
          </option>
        ))}
      </select>

      <input type="hidden" name="project_id" value={selected?.project_id ?? ""} />

      <div className="rounded-md bg-gray-50 px-3 py-2 text-sm">
        <div className="text-xs text-gray-500">Project</div>
        <div className="font-medium">{selected ? `${selected.project_code} — ${selected.project_name}` : "Select an RA bill first"}</div>
      </div>

      <input name="receipt_date" required type="date" defaultValue={today} className="min-w-0 w-full rounded-md border border-border px-3 py-2 text-sm" />
      <input name="amount_received" required type="number" min="0.01" max={selected?.outstanding} step="0.01" placeholder="Amount received (Rs)" className="min-w-0 w-full rounded-md border border-border px-3 py-2 text-sm" />
      <input name="bank" placeholder="Bank / payment source" className="min-w-0 w-full rounded-md border border-border px-3 py-2 text-sm" />
      <input name="reference_number" placeholder="Reference / advice no." className="min-w-0 w-full rounded-md border border-border px-3 py-2 text-sm" />
      <input name="remarks" placeholder="Remarks" className="min-w-0 w-full rounded-md border border-border px-3 py-2 text-sm md:col-span-2" />

      <label className="min-w-0 rounded-md border border-dashed border-border bg-gray-50 px-3 py-2 text-sm text-gray-600">
        <span className="mb-1 block text-xs font-medium text-gray-700">Payment advice / proof (optional)</span>
        <input name="payment_advice" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="block w-full min-w-0 text-xs" />
        <span className="mt-1 block text-[11px] text-gray-500">PDF, JPG or PNG · max 10 MB</span>
      </label>

      <SubmitButton />
      {selected && <p className="text-xs text-gray-500 md:col-span-2 lg:col-span-3">Maximum receipt: {pkr(selected.outstanding)}. The project is selected automatically from the RA bill.</p>}
    </form>
  );
}

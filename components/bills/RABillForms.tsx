"use client";

import { useRef, useState } from "react";
import FormStatusMessage from "@/components/shared/FormStatusMessage";

type Action = (fd: FormData) => Promise<void>;
const cls = "min-w-0 w-full rounded-md border border-border px-3 py-2 text-sm";

export function CreateBillForm({ projectId, action }: { projectId: string; action: Action }) {
  const ref = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(fd: FormData) {
    setPending(true);
    setError(null);
    setSuccess(null);

    const from = String(fd.get("period_from") ?? "");
    const to = String(fd.get("period_to") ?? "");
    if (from && to && from > to) {
      setError("The period start date cannot be after the end date.");
      setPending(false);
      return;
    }

    try {
      await action(fd);
      ref.current?.reset();
      setSuccess("Draft RA bill created successfully.");
    } catch (e: any) {
      setError(e?.message ?? "Could not create the RA bill. Your entries have been kept.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={ref} action={submit} className="rounded-xl border border-border bg-white p-4">
      <div className="mb-1 font-medium">Create RA bill</div>
      <p className="mb-3 text-xs text-gray-500">Create a draft first. You can add claim items before submitting it for checking.</p>
      {error && <div className="mb-3"><FormStatusMessage kind="error">{error}</FormStatusMessage></div>}
      {success && <div className="mb-3"><FormStatusMessage kind="success">{success}</FormStatusMessage></div>}
      <input type="hidden" name="project_id" value={projectId} />
      <div className="grid min-w-0 gap-2 md:grid-cols-3">
        <input name="bill_number" required placeholder="RA Bill # e.g. 01" className={cls} />
        <label className="text-xs text-gray-500">
          Period from
          <input name="period_from" type="date" required className={"mt-1 " + cls} />
        </label>
        <label className="text-xs text-gray-500">
          Period to
          <input name="period_to" type="date" required className={"mt-1 " + cls} />
        </label>
      </div>
      <button disabled={pending} className="mt-3 w-full rounded-md bg-active px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">
        {pending ? "Creating draft..." : "Create draft RA bill"}
      </button>
    </form>
  );
}

export function BillItemForm({
  projectId,
  billId,
  items,
  action,
}: {
  projectId: string;
  billId: string;
  items: { id: string; label: string; available: number; unit: string }[];
  action: Action;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [itemId, setItemId] = useState("");

  const selected = items.find((item) => item.id === itemId);

  async function submit(fd: FormData) {
    setPending(true);
    setError(null);
    setSuccess(null);

    const qty = Number(fd.get("claimed_quantity") ?? 0);
    if (selected && qty > selected.available + 0.000001) {
      setError(`Claimed quantity cannot exceed the available measured quantity (${selected.available.toLocaleString()} ${selected.unit}).`);
      setPending(false);
      return;
    }

    try {
      await action(fd);
      ref.current?.reset();
      setItemId("");
      setSuccess("Claim item added successfully.");
    } catch (e: any) {
      setError(e?.message ?? "Could not add the claim item. Your entries have been kept.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={ref} action={submit} className="mt-3 min-w-0 rounded-lg bg-gray-50 p-3">
      {error && <div className="mb-3"><FormStatusMessage kind="error">{error}</FormStatusMessage></div>}
      {success && <div className="mb-3"><FormStatusMessage kind="success">{success}</FormStatusMessage></div>}
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="ra_bill_id" value={billId} />
      <div className="grid min-w-0 gap-2 md:grid-cols-3">
        <select name="boq_item_id" required value={itemId} onChange={(e) => setItemId(e.target.value)} className={cls}>
          <option value="">Select measured BOQ item</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.label} — available {i.available.toLocaleString()} {i.unit}
            </option>
          ))}
        </select>
        <input
          name="claimed_quantity"
          type="number"
          min="0.001"
          step="0.001"
          max={selected?.available}
          required
          placeholder="Current claimed quantity"
          className={cls}
        />
        <button disabled={pending} className="rounded-md bg-active px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? "Adding claim..." : "Add claim item"}
        </button>
      </div>
      {selected && <p className="mt-2 text-xs text-gray-500">Maximum available to claim: {selected.available.toLocaleString()} {selected.unit}</p>}
    </form>
  );
}

"use client";

import { useRef, useState } from "react";
import FormStatusMessage from "@/components/shared/FormStatusMessage";

const trades = [
  "Mason", "Helper", "Carpenter", "Steel Fixer", "Electrician", "Plumber",
  "Painter", "Tile/Marble Mason", "Welder", "Operator", "Chowkidar",
  "Site Staff", "Other",
];

export default function AddWorkerForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleAction(formData: FormData) {
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      await action(formData);
      formRef.current?.reset();
      setSuccess("Worker added successfully.");
    } catch (e: any) {
      const message = e?.message ?? "Something went wrong.";
      setError(
        message.includes("duplicate key")
          ? "That Worker ID is already in use — please pick a different one."
          : message
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} action={handleAction} className="mb-6 rounded-lg border border-border bg-white p-4">
      <div className="mb-3 text-sm font-medium">Add worker</div>
      {error && <div className="mb-3"><FormStatusMessage kind="error">{error}</FormStatusMessage></div>}
      {success && <div className="mb-3"><FormStatusMessage kind="success">{success}</FormStatusMessage></div>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <input
          name="worker_code"
          placeholder="Worker ID"
          required
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
        <input
          name="name"
          placeholder="Full name"
          required
          className="rounded-md border border-border px-3 py-2 text-sm md:col-span-2"
        />
        <input
          name="mobile"
          placeholder="Mobile"
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
        <select name="trade" required className="rounded-md border border-border px-3 py-2 text-sm">
          <option value="">Trade</option>
          {trades.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          name="daily_wage_rate"
          type="number"
          step="0.01"
          min="0"
          placeholder="Daily wage (Rs)"
          required
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
        <input
          name="overtime_rate"
          type="number"
          step="0.01"
          min="0"
          placeholder="OT rate / hour (Rs)"
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
        <button
          disabled={pending}
          className="col-span-2 rounded-md bg-active px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 md:col-span-3"
        >
          {pending ? "Adding..." : "Add worker"}
        </button>
      </div>
    </form>
  );
}

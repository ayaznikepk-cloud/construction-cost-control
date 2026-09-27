"use client";

import { useRef, useState } from "react";

export default function AddItemForm({
  projectId,
  sections,
  units,
  action,
}: {
  projectId: string;
  sections: { id: string; name: string }[];
  units: { id: string; code: string }[];
  action: (formData: FormData) => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleAction(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      await action(formData);
      formRef.current?.reset();
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} action={handleAction} className="rounded-lg border border-border bg-white p-4">
      <input type="hidden" name="project_id" value={projectId} />
      <div className="mb-3 text-sm font-medium">Add BOQ item</div>
      {error && <div className="mb-2 text-sm text-danger">{error}</div>}
      <div className="grid grid-cols-2 gap-2">
        <select name="section_id" className="rounded-md border border-border px-3 py-2 text-sm">
          <option value="">No section</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          name="boq_number"
          placeholder="BOQ #"
          required
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
        <input
          name="description"
          placeholder="Description"
          required
          className="col-span-2 rounded-md border border-border px-3 py-2 text-sm"
        />
        <input
          name="original_quantity"
          type="number"
          step="0.001"
          placeholder="Quantity"
          required
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
        <select name="unit_id" required className="rounded-md border border-border px-3 py-2 text-sm">
          <option value="">Unit</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.code}
            </option>
          ))}
        </select>
        <input
          name="mrs_rate"
          type="number"
          step="0.01"
          placeholder="MRS Rate"
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
        <input
          name="contract_rate"
          type="number"
          step="0.01"
          placeholder="Contract Rate"
          required
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>
      <button
        disabled={pending}
        className="mt-2 w-full rounded-md bg-active px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Adding..." : "Add item"}
      </button>
    </form>
  );
}

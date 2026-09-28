"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/format";

export default function GenerateWageSheetForm({
  projects,
  action,
}: {
  projects: { id: string; project_name: string }[];
  action: (formData: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleAction(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await action(formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/labour-payments/wage-sheets/${result.id}`);
  }

  return (
    <form action={handleAction} className="mb-6 rounded-lg border border-border bg-white p-4">
      <div className="mb-1 text-sm font-medium">Generate wage sheet</div>
      <p className="mb-3 text-xs text-gray-500">
        Builds a draft from the attendance already recorded for the period. You can review and adjust
        deductions before approving.
      </p>
      {error && <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-danger">{error}</div>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <select name="project_id" required className="col-span-2 rounded-md border border-border px-3 py-2 text-sm md:col-span-1">
          <option value="">Select project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.project_name}
            </option>
          ))}
        </select>
        <label className="text-xs text-gray-500">
          From
          <input name="from" type="date" required className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm text-gray-900" />
        </label>
        <label className="text-xs text-gray-500">
          To
          <input name="to" type="date" required className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm text-gray-900" />
        </label>
        <button
          disabled={pending}
          className="col-span-2 self-end rounded-md bg-active px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 md:col-span-1"
        >
          {pending ? "Generating..." : "Generate draft"}
        </button>
      </div>
    </form>
  );
}

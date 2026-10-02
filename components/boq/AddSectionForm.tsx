"use client";

import { useRef, useState } from "react";
import FormStatusMessage from "@/components/shared/FormStatusMessage";

export default function AddSectionForm({
  projectId,
  action,
}: {
  projectId: string;
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
      setSuccess("BOQ section added successfully.");
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} action={handleAction} className="rounded-lg border border-border bg-white p-4">
      <input type="hidden" name="project_id" value={projectId} />
      <div className="mb-3 text-sm font-medium">Add BOQ section / category</div>
      {error && <div className="mb-3"><FormStatusMessage kind="error">{error}</FormStatusMessage></div>}
      {success && <div className="mb-3"><FormStatusMessage kind="success">{success}</FormStatusMessage></div>}
      <div className="flex gap-2">
        <input
          name="name"
          placeholder="e.g. Foundation Works"
          required
          className="flex-1 rounded-md border border-border px-3 py-2 text-sm"
        />
        <button
          disabled={pending}
          className="rounded-md bg-active px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Adding section..." : "Add section"}
        </button>
      </div>
    </form>
  );
}

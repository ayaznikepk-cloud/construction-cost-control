"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import FormStatusMessage from "@/components/shared/FormStatusMessage";

type State = { error: string | null; success: string | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="rounded bg-active px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Uploading document..." : "Upload document"}</button>;
}

export default function DocumentUploadForm({
  projects,
  categories,
  action,
}: {
  projects: { id: string; project_code: string; project_name: string }[];
  categories: readonly string[];
  action: (state: State, formData: FormData) => Promise<State>;
}) {
  const [state, formAction] = useFormState(action, { error: null, success: null });
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) ref.current?.reset();
  }, [state.success]);

  function validate(event: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(event.currentTarget);
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) return;
    if (file.size > 10 * 1024 * 1024) {
      event.preventDefault();
      window.alert("Document must be 10 MB or smaller.");
    }
  }

  return (
    <form ref={ref} action={formAction} onSubmit={validate} encType="multipart/form-data" className="mt-4 grid min-w-0 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {state.error && <div className="md:col-span-2 lg:col-span-3"><FormStatusMessage kind="error">{state.error}</FormStatusMessage></div>}
      {state.success && <div className="md:col-span-2 lg:col-span-3"><FormStatusMessage kind="success">{state.success}</FormStatusMessage></div>}
      <select required name="project_id" defaultValue={projects.length === 1 ? projects[0].id : ""} className="min-w-0 w-full rounded border border-border px-3 py-2 text-sm"><option value="">Select project</option>{projects.map((p)=><option key={p.id} value={p.id}>{p.project_code} — {p.project_name}</option>)}</select>
      <select required name="category" className="min-w-0 w-full rounded border border-border px-3 py-2 text-sm"><option value="">Select category</option>{categories.map((c)=><option key={c} value={c}>{c}</option>)}</select>
      <input required name="title" placeholder="Document title" className="min-w-0 w-full rounded border border-border px-3 py-2 text-sm"/>
      <input name="reference" placeholder="Reference / letter no." className="min-w-0 w-full rounded border border-border px-3 py-2 text-sm"/>
      <input name="document_date" type="date" className="min-w-0 w-full rounded border border-border px-3 py-2 text-sm"/>
      <input name="notes" placeholder="Notes (optional)" className="min-w-0 w-full rounded border border-border px-3 py-2 text-sm"/>
      <label className="min-w-0 rounded border border-dashed border-border bg-gray-50 px-3 py-2 text-sm"><span className="block text-xs font-medium">Document file</span><input required name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="mt-1 block w-full min-w-0 text-xs"/><span className="mt-1 block text-[11px] text-gray-500">PDF, JPG or PNG · max 10 MB</span></label>
      <SubmitButton />
      <p className="text-[11px] text-gray-500 md:col-span-2 lg:col-span-3">The form is cleared only after the file and document record are both saved successfully.</p>
    </form>
  );
}

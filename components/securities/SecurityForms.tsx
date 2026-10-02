"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { pkr } from "@/lib/format";
import FormStatusMessage from "@/components/shared/FormStatusMessage";

export type SecurityState = { error: string | null; success: string | null };

function Submit({ idle, pending }: { idle: string; pending: string }) {
  const status = useFormStatus();
  return <button disabled={status.pending} className="rounded bg-active px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">{status.pending ? pending : idle}</button>;
}

export function CreateSecurityForm({
  projects,
  types,
  action,
}: {
  projects: { id: string; project_code: string; project_name: string }[];
  types: readonly (readonly [string, string])[];
  action: (state: SecurityState, formData: FormData) => Promise<SecurityState>;
}) {
  const [state, formAction] = useFormState(action, { error: null, success: null });
  const ref = useRef<HTMLFormElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (state.success) ref.current?.reset();
  }, [state.success]);

  function validate(event: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(event.currentTarget);
    const issue = String(fd.get("issue_date") ?? "");
    const expiry = String(fd.get("expiry_date") ?? "");
    const file = fd.get("attachment");
    if (issue && expiry && expiry < issue) {
      event.preventDefault();
      window.alert("Expiry date cannot be before the issue date.");
      return;
    }
    if (file instanceof File && file.size > 10 * 1024 * 1024) {
      event.preventDefault();
      window.alert("Attachment must be 10 MB or smaller.");
    }
  }

  return <form ref={ref} action={formAction} onSubmit={validate} encType="multipart/form-data" className="mt-4 grid min-w-0 gap-3 md:grid-cols-2 lg:grid-cols-3">
    {state.error && <div className="md:col-span-2 lg:col-span-3"><FormStatusMessage kind="error">{state.error}</FormStatusMessage></div>}
    {state.success && <div className="md:col-span-2 lg:col-span-3"><FormStatusMessage kind="success">{state.success}</FormStatusMessage></div>}
    <select required name="project_id" defaultValue={projects.length === 1 ? projects[0].id : ""} className="min-w-0 w-full rounded border border-border px-3 py-2 text-sm"><option value="">Select project</option>{projects.map((p)=><option key={p.id} value={p.id}>{p.project_code} — {p.project_name}</option>)}</select>
    <select required name="type" className="min-w-0 w-full rounded border border-border px-3 py-2 text-sm"><option value="">Select type</option>{types.map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
    <input required name="amount" type="number" min="0.01" step="0.01" placeholder="Security / advance amount (Rs)" className="min-w-0 rounded border border-border px-3 py-2 text-sm"/>
    <label className="text-xs text-gray-500">Issue date<input name="issue_date" type="date" defaultValue={today} className="mt-1 min-w-0 w-full rounded border border-border px-3 py-2 text-sm text-gray-900"/></label>
    <label className="text-xs text-gray-500">Expiry date<input name="expiry_date" type="date" className="mt-1 min-w-0 w-full rounded border border-border px-3 py-2 text-sm text-gray-900"/></label>
    <input name="reference" placeholder="Reference / guarantee no." className="min-w-0 rounded border border-border px-3 py-2 text-sm"/>
    <label className="min-w-0 rounded border border-dashed border-border bg-gray-50 px-3 py-2 text-sm"><span className="block text-xs font-medium">Supporting document (optional)</span><input name="attachment" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="mt-1 block w-full min-w-0 text-xs"/><span className="text-[11px] text-gray-500">PDF, JPG or PNG · max 10 MB</span></label>
    <Submit idle="Add item" pending="Saving item..." />
  </form>;
}

export function SecurityActionForm({
  id,
  max,
  action,
}: {
  id: string;
  max: number;
  action: (state: SecurityState, formData: FormData) => Promise<SecurityState>;
}) {
  const [state, formAction] = useFormState(action, { error: null, success: null });

  function confirm(event: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(event.currentTarget);
    const amount = Number(fd.get("amount") ?? 0);
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const kind = submitter?.value;
    if (amount > max + 0.000001) {
      event.preventDefault();
      window.alert(`Amount cannot exceed the remaining balance (${pkr(max)}).`);
      return;
    }
    const word = kind === "recover" ? "recover" : "release";
    if (!window.confirm(`Confirm ${word} of ${pkr(amount)}? Remaining before this action is ${pkr(max)}.`)) event.preventDefault();
  }

  return <div className="mt-2">
    <form action={formAction} onSubmit={confirm} className="flex min-w-[240px] gap-2">
      <input type="hidden" name="security_id" value={id}/>
      <input name="amount" required type="number" min="0.01" max={max} step="0.01" placeholder="Amount" className="min-w-0 w-24 flex-1 rounded border border-border px-2 py-1.5 text-xs"/>
      <button name="action" value="recover" className="rounded border px-2 py-1.5 text-xs">Recover</button>
      <button name="action" value="release" className="rounded bg-active px-2 py-1.5 text-xs text-white">Release</button>
    </form>
    {state.error && <div className="mt-2"><FormStatusMessage kind="error">{state.error}</FormStatusMessage></div>}
    {state.success && <div className="mt-2"><FormStatusMessage kind="success">{state.success}</FormStatusMessage></div>}
  </div>;
}

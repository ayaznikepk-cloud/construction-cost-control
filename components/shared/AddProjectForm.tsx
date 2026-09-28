"use client";

import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";

export default function AddProjectForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleAction(formData: FormData) {
    setPending(true); setError(null);
    try {
      await action(formData);
      formRef.current?.reset();
      setOpen(false);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong.");
    } finally { setPending(false); }
  }

  const input = "w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-active focus:ring-1 focus:ring-active";
  const label = "mb-1.5 block text-xs font-medium text-gray-600";

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-active px-4 py-2 text-sm font-medium text-white hover:opacity-90">
        <Plus size={16} /> Add project
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onMouseDown={() => !pending && setOpen(false)}>
          <div className="h-full w-full max-w-3xl overflow-y-auto bg-gray-50 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-4">
              <div><h2 className="font-semibold text-gray-900">New project</h2><p className="mt-0.5 text-xs text-gray-500">Set up the government contract master record.</p></div>
              <button onClick={() => setOpen(false)} disabled={pending} className="rounded-md p-2 text-gray-500 hover:bg-gray-100"><X size={18} /></button>
            </div>
            <form ref={formRef} action={handleAction} className="space-y-6 p-6">
              {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              <section className="rounded-xl border border-border bg-white p-5">
                <h3 className="mb-4 text-sm font-semibold">Project identity</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Project code"><input name="project_code" required className={input} /></Field>
                  <Field label="Project name"><input name="project_name" required className={input} /></Field>
                  <Field label="Scheme / work name" span><textarea name="scheme_work_name" rows={2} className={input} /></Field>
                  <Field label="Department"><input name="department" className={input} /></Field>
                  <Field label="Division / office"><input name="division_office" className={input} /></Field>
                  <Field label="Location" span><input name="location" className={input} /></Field>
                  <Field label="Agreement number"><input name="agreement_number" className={input} /></Field>
                  <Field label="Work order number"><input name="work_order_number" className={input} /></Field>
                </div>
              </section>
              <section className="rounded-xl border border-border bg-white p-5">
                <h3 className="mb-1 text-sm font-semibold">Government approvals & contract</h3>
                <p className="mb-4 text-xs text-gray-500">Technical Sanction, DNIT/MRS and contractor award are stored separately.</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Technical Sanction number"><input name="technical_sanction_number" className={input} /></Field>
                  <Field label="Technical Sanction date"><input name="technical_sanction_date" type="date" className={input} /></Field>
                  <Field label="Technical Sanction amount (Rs)"><input name="technical_sanction_amount" type="number" min="0" step="0.01" className={input} /></Field>
                  <Field label="Approved DNIT / MRS amount (Rs)"><input name="approved_dnit_mrs_amount" type="number" min="0" step="0.01" className={input} /></Field>
                  <Field label="Award / Agreement amount (Rs)"><input name="original_contract_amount" required type="number" min="0" step="0.01" className={input} /></Field>
                  <Field label="Bid % (+ above / − below)"><input name="bid_percentage" type="number" step="0.01" className={input} /></Field>
                  <Field label="Earnest money (Rs)"><input name="earnest_money" type="number" min="0" step="0.01" className={input} /></Field>
                  <Field label="Performance security (Rs)"><input name="performance_security" type="number" min="0" step="0.01" className={input} /></Field>
                  <Field label="Retention %"><input name="retention_percentage" type="number" min="0" step="0.01" className={input} /></Field>
                </div>
              </section>
              <section className="rounded-xl border border-border bg-white p-5">
                <h3 className="mb-4 text-sm font-semibold">Programme</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Tender date"><input name="tender_date" type="date" className={input} /></Field>
                  <Field label="Award date"><input name="award_date" type="date" className={input} /></Field>
                  <Field label="Commencement date"><input name="commencement_date" type="date" className={input} /></Field>
                  <Field label="Completion period (days)"><input name="completion_period_days" type="number" min="0" step="1" className={input} /></Field>
                  <Field label="Completion date"><input name="completion_date" type="date" className={input} /></Field>
                </div>
              </section>
              <div className="sticky bottom-0 flex justify-end gap-3 border-t border-border bg-gray-50 py-4">
                <button type="button" onClick={() => setOpen(false)} disabled={pending} className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium">Cancel</button>
                <button disabled={pending} className="rounded-md bg-active px-5 py-2 text-sm font-medium text-white disabled:opacity-50">{pending ? "Creating..." : "Create project"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, span = false, children }: { label: string; span?: boolean; children: React.ReactNode }) {
  return <label className={span ? "md:col-span-2" : ""}><span className="mb-1.5 block text-xs font-medium text-gray-600">{label}</span>{children}</label>;
}

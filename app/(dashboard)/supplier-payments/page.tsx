import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { pkr, fmtDate } from "@/lib/format";
import SupplierPaymentForm from "@/components/suppliers/SupplierPaymentForm";

export const dynamic = "force-dynamic";

async function recordPayment(formData: FormData) {
  "use server";
  const supabase = createClient();
  const projectId = String(formData.get("project_id") ?? "");
  const supplierId = String(formData.get("supplier_id") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const date = String(formData.get("payment_date") ?? "");
  const method = String(formData.get("payment_method") ?? "");
  const reference = String(formData.get("reference_number") ?? "");

  if (!projectId || !supplierId || !Number.isFinite(amount) || amount <= 0 || !date)
    return { ok: false as const, error: "Select project and supplier, enter payment date and an amount greater than zero." };

  const { error } = await supabase.rpc("record_supplier_payment", {
    p_project: projectId, p_supplier: supplierId, p_amount: amount,
    p_date: date, p_method: method, p_reference: reference,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/supplier-payments");
  revalidatePath("/purchases");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export default async function SupplierPaymentsPage() {
  const supabase = createClient();
  const [{ data: payables, error: payableError }, { data: projects }, { data: payments, error: paymentError }] = await Promise.all([
    supabase.from("v_supplier_payable").select("*").order("supplier_name"),
    supabase.from("projects").select("id,project_code,project_name").order("project_code"),
    supabase.from("supplier_payments").select("id,project_id,supplier_id,amount,payment_date,payment_method,reference_number,status,suppliers(name),projects(project_code,project_name)").order("payment_date",{ascending:false}).limit(100),
  ]);

  const outstanding=(payables??[]).filter((x:any)=>Number(x.outstanding_payable)>0);
  const projectLabel=(projectId:string)=>{
    const p=(projects??[]).find((x:any)=>x.id===projectId);
    return p ? `${p.project_code} — ${p.project_name}` : "Project";
  };
  const options=outstanding.map((x:any)=>({
    project_id:x.project_id,supplier_id:x.supplier_id,supplier_name:x.supplier_name,
    balance:Number(x.outstanding_payable),project_label:projectLabel(x.project_id)
  }));

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-semibold">Supplier Payments</h1><p className="text-sm text-slate-600">Pay supplier liabilities by project. Payments reduce supplier payable balances automatically.</p></div>
    {(payableError||paymentError)&&<div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{payableError?.message||paymentError?.message}</div>}
    <SupplierPaymentForm options={options} action={recordPayment}/>
    <section className="overflow-hidden rounded-xl border bg-white">
      <h2 className="border-b px-4 py-3 font-semibold">Outstanding supplier balances</h2>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left"><tr><th className="px-4 py-2">Project</th><th>Supplier</th><th className="text-right">Purchased</th><th className="text-right">Paid</th><th className="pr-4 text-right">Balance</th></tr></thead>
      <tbody>{outstanding.length?outstanding.map((r:any)=><tr key={r.project_id+r.supplier_id} className="border-t"><td className="px-4 py-2">{projectLabel(r.project_id)}</td><td>{r.supplier_name}</td><td className="text-right">{pkr(r.total_purchased)}</td><td className="text-right">{pkr(r.total_paid)}</td><td className="pr-4 text-right font-semibold">{pkr(r.outstanding_payable)}</td></tr>):<tr><td colSpan={5} className="p-8 text-center text-slate-500">No outstanding supplier balances.</td></tr>}</tbody></table></div>
    </section>
    <section className="overflow-hidden rounded-xl border bg-white">
      <h2 className="border-b px-4 py-3 font-semibold">Payment register</h2>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left"><tr><th className="px-4 py-2">Date</th><th>Project</th><th>Supplier</th><th>Method</th><th>Reference</th><th className="pr-4 text-right">Amount</th></tr></thead>
      <tbody>{(payments??[]).length?(payments??[]).map((r:any)=><tr key={r.id} className="border-t"><td className="px-4 py-2">{fmtDate(r.payment_date)}</td><td>{r.projects?.project_code??"—"}</td><td>{r.suppliers?.name??"—"}</td><td>{r.payment_method||"—"}</td><td>{r.reference_number||"—"}</td><td className="pr-4 text-right font-semibold">{pkr(r.amount)}</td></tr>):<tr><td colSpan={6} className="p-8 text-center text-slate-500">No supplier payments recorded yet.</td></tr>}</tbody></table></div>
    </section>
  </div>;
}

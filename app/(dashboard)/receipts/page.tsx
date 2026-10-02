export const dynamic = "force-dynamic";

import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { pkr } from "@/lib/format";
import ReceiptEntryForm from "@/components/receipts/ReceiptEntryForm";

const textValue = (f: FormData, n: string) => {
  const v = String(f.get(n) ?? "").trim();
  return v || null;
};
const numberValue = (f: FormData, n: string) => {
  const raw = String(f.get(n) ?? "").trim();
  const v = Number(raw);
  return raw && Number.isFinite(v) ? v : null;
};

type ReceiptState = { error: string | null; success: string | null };

async function recordReceipt(_state: ReceiptState, formData: FormData): Promise<ReceiptState> {
  "use server";
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your session has expired. Please sign in again.", success: null };

  const projectId = textValue(formData, "project_id");
  const billId = textValue(formData, "ra_bill_id");
  const date = textValue(formData, "receipt_date");
  const bank = textValue(formData, "bank");
  const reference = textValue(formData, "reference_number");
  const remarks = textValue(formData, "remarks");
  const amount = numberValue(formData, "amount_received");
  const attachment = formData.get("payment_advice");
  const file = attachment instanceof File && attachment.size > 0 ? attachment : null;
  if (file && !["application/pdf", "image/jpeg", "image/png"].includes(file.type)) return { error: "Attachment must be PDF, JPG or PNG.", success: null };
  if (file && file.size > 10 * 1024 * 1024) return { error: "Attachment must be 10 MB or smaller.", success: null };
  if (!projectId || !billId || !date || amount === null || amount <= 0) {
    return { error: "Select an RA bill, enter the receipt date and an amount greater than zero.", success: null };
  }

  const { data: bill } = await supabase
    .from("ra_bills")
    .select("id,project_id,status,net_payable")
    .eq("id", billId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (!bill || !["passed", "payment_authorized", "partially_received"].includes(bill.status)) {
    return { error: "This RA bill is no longer available for receipt entry. Refresh the page and try again.", success: null };
  }

  const { data: existing } = await supabase
    .from("government_receipts")
    .select("amount_received")
    .eq("ra_bill_id", billId);

  const received = (existing ?? []).reduce((sum, row) => sum + Number(row.amount_received ?? 0), 0);
  const net = Number(bill.net_payable ?? 0);
  if (received + amount > net + 0.000001) {
    return { error: "Receipt exceeds the outstanding amount for this RA bill.", success: null };
  }

  let attachmentId: string | null = null;
  if (file) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${user.id}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("project-documents").upload(storagePath, file, { contentType: file.type, upsert: false });
    if (uploadError) return { error: "Could not upload the attachment. Please try again.", success: null };
    const { data: savedAttachment, error: attachmentError } = await supabase.from("attachments").insert({ storage_path: storagePath, file_name: file.name, mime_type: file.type, uploaded_by: user.id }).select("id").single();
    if (attachmentError) { await supabase.storage.from("project-documents").remove([storagePath]); return { error: "The attachment uploaded, but could not be saved. Please try again.", success: null }; }
    attachmentId = savedAttachment.id;
  }

  const { error } = await supabase.from("government_receipts").insert({
    project_id: projectId,
    ra_bill_id: billId,
    receipt_date: date,
    amount_received: amount,
    bank,
    reference_number: reference,
    remarks,
    payment_advice_attachment_id: attachmentId,
    created_by: user.id,
  });
  if (error) {
    if (attachmentId) {
      const { data: saved } = await supabase.from("attachments").select("storage_path").eq("id", attachmentId).maybeSingle();
      if (saved?.storage_path) await supabase.storage.from("project-documents").remove([saved.storage_path]);
      await supabase.from("attachments").delete().eq("id", attachmentId);
    }
    return { error: "Could not record the receipt. Your entries have been kept so you can try again.", success: null };
  }

  const totalReceived = received + amount;
  const status = totalReceived + 0.000001 >= net ? "fully_received" : "partially_received";
  const { error: statusError } = await supabase.from("ra_bills").update({ status }).eq("id", billId);
  if (statusError) return { error: "Receipt was saved, but the RA bill status could not be refreshed. Please refresh the page.", success: null };

  revalidatePath("/receipts");
  revalidatePath("/projects/" + projectId + "/bills");
  revalidatePath("/dashboard");
  return { error: null, success: "Government receipt recorded successfully." };
}

export default async function ReceiptsPage() {
  const supabase = createClient();
  const [{ data: bills, error: billsError }, { data: receipts, error: receiptsError }] = await Promise.all([
    supabase
      .from("ra_bills")
      .select("id,bill_number,status,net_payable,projects(id,project_code,project_name),government_receipts(amount_received)")
      .in("status", ["passed", "payment_authorized", "partially_received"])
      .order("created_at", { ascending: false }),
    supabase
      .from("government_receipts")
      .select("id,project_id,ra_bill_id,receipt_date,amount_received,bank,reference_number,remarks,payment_advice_attachment_id,attachments!government_receipts_payment_advice_attachment_id_fkey(file_name,storage_path,mime_type),projects(project_code,project_name),ra_bills(bill_number)")
      .order("receipt_date", { ascending: false }),
  ]);

  const outstanding = (bills ?? []).map((bill: any) => {
    const received = (bill.government_receipts ?? []).reduce((sum: number, row: any) => sum + Number(row.amount_received ?? 0), 0);
    const net = Number(bill.net_payable ?? 0);
    return { ...bill, received, outstanding: Math.max(0, net - received) };
  }).filter((bill: any) => bill.outstanding > 0.000001);

  const receiptRows = await Promise.all((receipts ?? []).map(async (row: any) => {
    const attachment = Array.isArray(row.attachments) ? row.attachments[0] : row.attachments;
    if (!attachment?.storage_path) return { ...row, attachmentUrl: null };
    const { data } = await supabase.storage.from("project-documents").createSignedUrl(attachment.storage_path, 3600);
    return { ...row, attachmentUrl: data?.signedUrl ?? null };
  }));
  const totalReceived = receiptRows.reduce((sum: number, row: any) => sum + Number(row.amount_received ?? 0), 0);
  const totalOutstanding = outstanding.reduce((sum: number, row: any) => sum + row.outstanding, 0);

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Government Receipts</h1>
        <p className="mt-1 text-sm text-gray-500">Collections against passed RA bills. Partial receipts remain linked to the originating bill.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Bills awaiting collection" value={String(outstanding.length)} />
        <Metric label="Outstanding receivable" value={pkr(totalOutstanding)} />
        <Metric label="Total received" value={pkr(totalReceived)} />
        <Metric label="Receipt entries" value={String(receipts?.length ?? 0)} />
      </div>

      <section className="rounded-xl border border-border bg-white p-4">
        <h2 className="font-medium">Record government receipt</h2>
        <p className="mt-1 text-xs text-gray-500">Only passed RA bills with an outstanding balance are available.</p>
        {billsError && <p className="mt-3 text-sm text-danger">Could not load outstanding bills: {billsError.message}</p>}
        {!billsError && outstanding.length === 0 ? (
          <p className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-500">No passed RA bills currently have an outstanding balance.</p>
        ) : (
          <ReceiptEntryForm
            bills={outstanding.map((bill: any) => {
              const project = Array.isArray(bill.projects) ? bill.projects[0] : bill.projects;
              return {
                id: bill.id,
                bill_number: bill.bill_number,
                outstanding: bill.outstanding,
                project_id: project?.id ?? "",
                project_code: project?.project_code ?? "Project",
                project_name: project?.project_name ?? "",
              };
            })}
            action={recordReceipt}
          />
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="border-b border-border px-4 py-3 font-medium">Outstanding passed bills</div>
        <div className="space-y-3 p-3 md:hidden">
          {outstanding.map((bill: any) => {
            const project = Array.isArray(bill.projects) ? bill.projects[0] : bill.projects;
            return <Link key={bill.id} href={`/projects/${project?.id}/bills`} className="block rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="font-medium">RA {bill.bill_number}</div><div className="truncate text-xs text-gray-500">{project?.project_code} — {project?.project_name}</div></div><span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">{bill.status.replaceAll("_", " ")}</span></div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs"><Mini label="Net" value={pkr(Number(bill.net_payable ?? 0))}/><Mini label="Received" value={pkr(bill.received)}/><Mini label="Outstanding" value={pkr(bill.outstanding)}/></div>
            </Link>;
          })}
          {!outstanding.length && <p className="p-3 text-sm text-gray-500">Nothing outstanding.</p>}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] text-sm"><thead className="bg-gray-50 text-left text-xs text-gray-500"><tr><th className="px-4 py-2">Project</th><th>RA Bill</th><th className="text-right">Net Payable</th><th className="text-right">Received</th><th className="pr-4 text-right">Outstanding</th></tr></thead>
          <tbody>{outstanding.map((bill: any) => { const project=Array.isArray(bill.projects)?bill.projects[0]:bill.projects; return <tr key={bill.id} className="border-t border-border"><td className="px-4 py-2"><Link className="text-active hover:underline" href={`/projects/${project?.id}/bills`}>{project?.project_code} — {project?.project_name}</Link></td><td>{bill.bill_number}</td><td className="text-right">{pkr(Number(bill.net_payable??0))}</td><td className="text-right">{pkr(bill.received)}</td><td className="pr-4 text-right font-medium">{pkr(bill.outstanding)}</td></tr>})}</tbody></table>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="border-b border-border px-4 py-3 font-medium">Receipt register</div>
        {receiptsError && <p className="p-4 text-sm text-danger">Could not load receipts: {receiptsError.message}</p>}
        <div className="space-y-3 p-3 md:hidden">
          {receiptRows.map((row: any) => { const project=Array.isArray(row.projects)?row.projects[0]:row.projects; const bill=Array.isArray(row.ra_bills)?row.ra_bills[0]:row.ra_bills; return <div key={row.id} className="rounded-lg border border-border p-3"><div className="flex justify-between gap-3"><div><div className="font-medium">{project?.project_code} · RA {bill?.bill_number}</div><div className="text-xs text-gray-500">{row.receipt_date}</div></div><div className="font-semibold">{pkr(Number(row.amount_received))}</div></div><div className="mt-2 text-xs text-gray-600">{row.bank??"—"}{row.reference_number?" · "+row.reference_number:""}</div>{row.remarks&&<div className="mt-1 text-xs text-gray-500">{row.remarks}</div>}{row.attachmentUrl&&<a href={row.attachmentUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-medium text-active hover:underline">📎 {row.attachments?.file_name??"View attachment"}</a>}</div>})}
          {!receiptsError && !receiptRows.length && <p className="p-3 text-sm text-gray-500">No government receipts recorded yet.</p>}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[820px] text-sm"><thead className="bg-gray-50 text-left text-xs text-gray-500"><tr><th className="px-4 py-2">Date</th><th>Project</th><th>RA Bill</th><th>Bank / Source</th><th>Reference</th><th>Attachment</th><th className="pr-4 text-right">Amount</th></tr></thead><tbody>
          {receiptRows.map((row: any) => {const project=Array.isArray(row.projects)?row.projects[0]:row.projects;const bill=Array.isArray(row.ra_bills)?row.ra_bills[0]:row.ra_bills;return <tr key={row.id} className="border-t border-border"><td className="px-4 py-2">{row.receipt_date}</td><td>{project?.project_code} — {project?.project_name}</td><td>{bill?.bill_number}</td><td>{row.bank??"—"}</td><td>{row.reference_number??"—"}</td><td>{row.attachmentUrl?<a href={row.attachmentUrl} target="_blank" rel="noreferrer" className="text-active hover:underline">📎 View</a>:"—"}</td><td className="pr-4 text-right font-medium">{pkr(Number(row.amount_received))}</td></tr>})}
          </tbody></table>
        </div>
      </section>
    </div>
  );
}

function Metric({label,value}:{label:string;value:string}){return <div className="rounded-xl border border-border bg-white p-3 sm:p-4"><div className="text-xs text-gray-500">{label}</div><div className="mt-1 text-base font-semibold sm:text-lg">{value}</div></div>}
function Mini({label,value}:{label:string;value:string}){return <div><div className="text-gray-500">{label}</div><div className="mt-1 font-medium text-gray-900">{value}</div></div>}

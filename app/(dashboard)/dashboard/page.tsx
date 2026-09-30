export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import MetricCard from "@/components/shared/MetricCard";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = createClient();
  const [{ data: projects, error }, { data: bills }, { data: securities }] = await Promise.all([
    supabase.from("v_project_financial_summary").select("*"),
    supabase.from("ra_bills").select("id,status").in("status", ["submitted","under_checking","verified"]),
    supabase.from("securities").select("id,expiry_date,status").eq("status","active").not("expiry_date","is",null),
  ]);

  const totals = (projects ?? []).reduce(
    (acc, p) => ({
      contract: acc.contract + Number(p.contract_value ?? 0),
      executed: acc.executed + Number(p.work_executed_value ?? 0),
      cost: acc.cost + Number(p.actual_cost ?? 0),
      received: acc.received + Number(p.amount_received ?? 0),
      receivable: acc.receivable + Number(p.receivable ?? 0),
      payable: acc.payable + Number(p.supplier_payable ?? 0),
    }),
    { contract: 0, executed: 0, cost: 0, received: 0, receivable: 0, payable: 0 }
  );

  const now=Date.now(), soon=now+30*86400000;
  const expiring=(securities??[]).filter((x:any)=>{const t=new Date(x.expiry_date).getTime();return t>=now&&t<=soon});
  const alerts=[
    ...(totals.receivable>0?[{label:"Government receivables",detail:`Rs ${totals.receivable.toLocaleString("en-PK")} outstanding across projects.`,href:"/receipts"}]:[]),
    ...(totals.payable>0?[{label:"Supplier payables",detail:`Rs ${totals.payable.toLocaleString("en-PK")} outstanding to suppliers.`,href:"/supplier-payments"}]:[]),
    ...((bills??[]).length?[{label:"RA bills awaiting action",detail:`${(bills??[]).length} bill(s) remain in checking / approval workflow.`,href:"/projects"}]:[]),
    ...(expiring.length?[{label:"Securities expiring soon",detail:`${expiring.length} active item(s) expire within 30 days.`,href:"/securities"}]:[])
  ];

  return (
    <div className="min-w-0">
      <h1 className="mb-4 text-xl font-semibold sm:mb-6">Dashboard</h1>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Active Projects" value={projects?.length ?? 0} currency={false} />
        <MetricCard label="Total Contract Value" value={totals.contract} />
        <MetricCard label="Work Executed" value={totals.executed} />
        <MetricCard label="Actual Cost" value={totals.cost} tone="warning" />
        <MetricCard label="Amount Received" value={totals.received} tone="positive" />
        <MetricCard label="Total Receivable" value={totals.receivable} tone="warning" />
        <MetricCard label="Supplier Payable" value={totals.payable} tone="danger" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]"><div className="overflow-hidden rounded-lg border border-border bg-white">
        <div className="border-b border-border px-4 py-3 text-sm font-medium">Projects</div>

        {error && <div className="p-4 text-sm text-danger">Could not load projects: {error.message}</div>}

        {!error && (projects?.length ?? 0) === 0 && (
          <div className="p-4 text-sm text-gray-500">
            No projects yet.{" "}
            <Link href="/projects" className="text-active underline">Add your first project</Link>.
          </div>
        )}

        <div className="divide-y divide-border md:hidden">{projects?.map((p:any)=><Link key={p.project_id} href={`/projects/${p.project_id}/overview`} className="block p-4"><div className="font-medium">{p.project_name}</div><div className="mt-3 grid grid-cols-2 gap-3 text-xs"><div><div className="text-gray-500">Executed</div><div className="font-medium">Rs {Number(p.work_executed_value??0).toLocaleString("en-PK")}</div></div><div><div className="text-gray-500">Actual Cost</div><div className="font-medium">Rs {Number(p.actual_cost??0).toLocaleString("en-PK")}</div></div><div><div className="text-gray-500">Received</div><div className="font-medium">Rs {Number(p.amount_received??0).toLocaleString("en-PK")}</div></div><div><div className="text-gray-500">Receivable</div><div className="font-medium">Rs {Number(p.receivable??0).toLocaleString("en-PK")}</div></div></div></Link>)}</div>
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-[720px] w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-gray-500">
                <th className="px-4 py-2 font-medium">Project</th>
                <th className="px-4 py-2 font-medium">Contract Value</th>
                <th className="px-4 py-2 font-medium">Executed Value</th>
                <th className="px-4 py-2 font-medium">Received</th>
                <th className="px-4 py-2 font-medium">Receivable</th>
              </tr>
            </thead>
            <tbody>
              {projects?.map((p) => (
                <tr key={p.project_id} className="border-b border-border last:border-0">
                  <td className="max-w-[260px] px-4 py-2">{p.project_name}</td>
                  <td className="whitespace-nowrap px-4 py-2">Rs {Number(p.contract_value).toLocaleString("en-PK")}</td>
                  <td className="whitespace-nowrap px-4 py-2">Rs {Number(p.work_executed_value).toLocaleString("en-PK")}</td>
                  <td className="whitespace-nowrap px-4 py-2">Rs {Number(p.amount_received).toLocaleString("en-PK")}</td>
                  <td className="whitespace-nowrap px-4 py-2">Rs {Number(p.receivable).toLocaleString("en-PK")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-white"><div className="border-b border-border px-4 py-3 text-sm font-medium">Attention Required</div>{alerts.length?<div className="divide-y divide-border">{alerts.map((a,i)=><Link key={i} href={a.href} className="block px-4 py-3 hover:bg-gray-50"><div className="text-sm font-medium">{a.label}</div><div className="mt-1 text-xs text-gray-500">{a.detail}</div></Link>)}</div>:<div className="p-4 text-sm text-gray-500">No current portfolio alerts.</div>}</div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import MetricCard from "@/components/shared/MetricCard";
import Link from "next/link";

const money=(v:unknown)=>Number(v??0).toLocaleString("en-PK",{maximumFractionDigits:0});

export default async function ProjectOverviewPage({params}:{params:{projectId:string}}){
  const supabase=createClient();
  const [{data:summary},{data:bills},{data:purchases},{data:securities}]=await Promise.all([
    supabase.from("v_project_financial_summary").select("*").eq("project_id",params.projectId).single(),
    supabase.from("ra_bills").select("id,bill_number,status,gross_claimed_amount,passed_amount,created_at").eq("project_id",params.projectId).order("created_at",{ascending:false}).limit(5),
    supabase.from("purchases").select("id,invoice_number,invoice_date,status,created_at").eq("project_id",params.projectId).order("created_at",{ascending:false}).limit(5),
    supabase.from("securities").select("id,type,amount,expiry_date,status").eq("project_id",params.projectId)
  ]);
  const s=summary??{contract_value:0,work_executed_value:0,actual_cost:0,amount_passed:0,amount_received:0,receivable:0,supplier_payable:0};
  const activity=[
    ...(bills??[]).map((b:any)=>({date:b.created_at,label:`RA Bill ${b.bill_number} · ${String(b.status??"draft").replaceAll("_"," ")}`,amount:Number(b.passed_amount??b.gross_claimed_amount??0),href:`/projects/${params.projectId}/bills`})),
    ...(purchases??[]).map((p:any)=>({date:p.created_at,label:`Purchase ${p.invoice_number||"invoice"} · ${p.status??"recorded"}`,amount:null,href:"/purchases"}))
  ].sort((a,b)=>new Date(b.date??0).getTime()-new Date(a.date??0).getTime()).slice(0,5);
  const alerts:{label:string;detail:string;href:string}[]=[];
  if(Number(s.receivable??0)>0)alerts.push({label:"Government receivable outstanding",detail:`Rs ${money(s.receivable)} remains to be collected.`,href:"/receipts"});
  if(Number(s.supplier_payable??0)>0)alerts.push({label:"Supplier payable outstanding",detail:`Rs ${money(s.supplier_payable)} remains payable.`,href:"/supplier-payments"});
  const pending=(bills??[]).filter((b:any)=>["submitted","under_checking","verified"].includes(b.status));
  if(pending.length)alerts.push({label:"RA bills awaiting completion",detail:`${pending.length} bill${pending.length===1?"":"s"} still in checking / approval workflow.`,href:`/projects/${params.projectId}/bills`});
  const now=Date.now(), soon=now+30*86400000;
  const expiring=(securities??[]).filter((x:any)=>x.expiry_date&&new Date(x.expiry_date).getTime()>=now&&new Date(x.expiry_date).getTime()<=soon&&x.status!=="released");
  if(expiring.length)alerts.push({label:"Security / guarantee expiring",detail:`${expiring.length} item${expiring.length===1?"":"s"} expire within 30 days.`,href:"/securities"});

  return <div className="min-w-0">
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
      <MetricCard label="Contract Value" value={Number(s.contract_value)} />
      <MetricCard label="Work Executed" value={Number(s.work_executed_value)} />
      <MetricCard label="Actual Cost" value={Number(s.actual_cost)} tone="warning" />
      <MetricCard label="Amount Passed" value={Number(s.amount_passed)} />
      <MetricCard label="Amount Received" value={Number(s.amount_received)} tone="positive" />
      <MetricCard label="Receivable" value={Number(s.receivable)} tone="warning" />
      <MetricCard label="Supplier Payable" value={Number(s.supplier_payable)} tone="danger" />
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="border-b border-border px-4 py-3"><div className="font-medium">Recent Activity</div><div className="mt-1 text-xs text-gray-500">Latest RA bill and purchase activity for this project.</div></div>
        {activity.length===0?<div className="p-4 text-sm text-gray-500">No recent bill or purchase activity.</div>:<div className="divide-y divide-border">{activity.map((a:any,i)=><Link key={a.date+"-"+i} href={a.href} className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-gray-50"><div className="min-w-0"><div className="text-sm font-medium capitalize">{a.label}</div><div className="mt-1 text-xs text-gray-500">{a.date?new Date(a.date).toLocaleDateString("en-PK"):""}</div></div>{a.amount!==null&&<div className="whitespace-nowrap text-sm font-semibold">Rs {money(a.amount)}</div>}</Link>)}</div>}
      </section>
      <section className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="border-b border-border px-4 py-3"><div className="font-medium">Attention Required</div><div className="mt-1 text-xs text-gray-500">Current financial and control items needing follow-up.</div></div>
        {alerts.length===0?<div className="p-4 text-sm text-gray-500">No current alerts for this project.</div>:<div className="divide-y divide-border">{alerts.map((a,i)=><Link key={i} href={a.href} className="block px-4 py-3 hover:bg-gray-50"><div className="text-sm font-medium">{a.label}</div><div className="mt-1 text-xs text-gray-500">{a.detail}</div></Link>)}</div>}
      </section>
    </div>
  </div>
}

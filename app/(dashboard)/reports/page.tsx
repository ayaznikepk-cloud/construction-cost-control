export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";

const money=(v:unknown)=>Number(v??0).toLocaleString("en-PK",{maximumFractionDigits:0});
const pct=(v:number)=>Number.isFinite(v)?v.toFixed(1)+"%":"—";

export default async function ReportsPage(){
  const s=createClient();
  const [{data:projects,error},{data:suppliers},{data:workers},{data:boq}]=await Promise.all([
    s.from("v_project_financial_summary").select("*").order("project_name"),
    s.from("v_supplier_payable").select("*"),
    s.from("v_worker_payable").select("*"),
    s.from("v_boq_cost_summary").select("project_id,contract_value,earned_value,material_cost,direct_labour_cost,labour_contractor_cost,subcontractor_cost_project_level,machinery_cost,direct_expense_cost")
  ]);

  const totals=(projects??[]).reduce((a:any,p:any)=>({
    contract:a.contract+Number(p.contract_value??0),executed:a.executed+Number(p.work_executed_value??0),
    cost:a.cost+Number(p.actual_cost??0),passed:a.passed+Number(p.amount_passed??0),
    received:a.received+Number(p.amount_received??0),receivable:a.receivable+Number(p.receivable??0),
    supplier:a.supplier+Number(p.supplier_payable??0)
  }),{contract:0,executed:0,cost:0,passed:0,received:0,receivable:0,supplier:0});
  const workerPayable=(workers??[]).reduce((n:any,w:any)=>n+Number(w.outstanding_wage_payable??0),0);
  const supplierPayable=(suppliers??[]).reduce((n:any,x:any)=>n+Number(x.outstanding_payable??0),0);
  const boqCost=(boq??[]).reduce((n:any,x:any)=>n+Number(x.material_cost??0)+Number(x.direct_labour_cost??0)+Number(x.labour_contractor_cost??0)+Number(x.machinery_cost??0)+Number(x.direct_expense_cost??0),0);

  return <div className="min-w-0 space-y-6">
    <div><h1 className="text-xl font-semibold">Reports</h1><p className="mt-1 text-sm text-gray-500">Project cost, progress, receivable and payable control summaries derived from posted project transactions.</p></div>
    {error&&<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">Could not load project reports: {error.message}</div>}

    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card label="Contract value" value={"Rs "+money(totals.contract)}/>
      <Card label="Work executed" value={"Rs "+money(totals.executed)}/>
      <Card label="Actual cost" value={"Rs "+money(totals.cost)}/>
      <Card label="Amount received" value={"Rs "+money(totals.received)}/>
      <Card label="Receivable" value={"Rs "+money(totals.receivable)}/>
      <Card label="Supplier payable" value={"Rs "+money(supplierPayable)}/>
      <Card label="Labour payable" value={"Rs "+money(workerPayable)}/>
      <Card label="Direct BOQ cost" value={"Rs "+money(boqCost)}/>
    </section>

    <section className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="border-b border-border px-4 py-3"><h2 className="font-medium">Project financial summary</h2><p className="mt-1 text-xs text-gray-500">Executed, cost, billing and collection remain separate control stages.</p></div>
      <div className="hidden overflow-x-auto md:block"><table className="min-w-[1050px] w-full text-sm"><thead><tr className="border-b border-border text-left text-xs text-gray-500">{["Project","Contract","Executed","Actual cost","Passed","Received","Receivable","Supplier payable","Cost / executed"].map(h=><th key={h} className="px-4 py-2 font-medium">{h}</th>)}</tr></thead>
      <tbody>{(projects??[]).map((p:any)=>{const ex=Number(p.work_executed_value??0),cost=Number(p.actual_cost??0);return <tr key={p.project_id} className="border-b border-border last:border-0"><td className="max-w-[280px] px-4 py-3 font-medium">{p.project_name}</td>{[p.contract_value,p.work_executed_value,p.actual_cost,p.amount_passed,p.amount_received,p.receivable,p.supplier_payable].map((v,i)=><td key={i} className="whitespace-nowrap px-4 py-3">Rs {money(v)}</td>)}<td className="whitespace-nowrap px-4 py-3">{ex>0?pct(cost/ex*100):"—"}</td></tr>})}</tbody></table></div>
      <div className="divide-y divide-border md:hidden">{(projects??[]).map((p:any)=>{const ex=Number(p.work_executed_value??0),cost=Number(p.actual_cost??0);return <div key={p.project_id} className="p-4"><div className="mb-3 font-medium">{p.project_name}</div><div className="grid grid-cols-2 gap-3 text-sm"><Mini l="Contract" v={p.contract_value}/><Mini l="Executed" v={p.work_executed_value}/><Mini l="Actual cost" v={p.actual_cost}/><Mini l="Passed" v={p.amount_passed}/><Mini l="Received" v={p.amount_received}/><Mini l="Receivable" v={p.receivable}/><Mini l="Supplier payable" v={p.supplier_payable}/><div><div className="text-xs text-gray-500">Cost / executed</div><div className="font-medium">{ex>0?pct(cost/ex*100):"—"}</div></div></div></div>})}</div>
      {!error&&(projects?.length??0)===0&&<div className="p-4 text-sm text-gray-500">No project data available yet.</div>}
    </section>

    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border border-border bg-white"><div className="border-b border-border px-4 py-3 font-medium">Supplier payables</div><div className="divide-y divide-border">{(suppliers??[]).filter((x:any)=>Number(x.outstanding_payable??0)!==0).map((x:any)=><div key={x.project_id+"-"+x.supplier_id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm"><div className="min-w-0"><div className="truncate font-medium">{x.supplier_name}</div><div className="text-xs text-gray-500">Purchased Rs {money(x.total_purchased)} · Paid Rs {money(x.total_paid)}</div></div><div className="whitespace-nowrap font-semibold">Rs {money(x.outstanding_payable)}</div></div>)}{!(suppliers??[]).some((x:any)=>Number(x.outstanding_payable??0)!==0)&&<div className="p-4 text-sm text-gray-500">No supplier balances outstanding.</div>}</div></section>
      <section className="rounded-xl border border-border bg-white"><div className="border-b border-border px-4 py-3 font-medium">Labour payables</div><div className="divide-y divide-border">{(workers??[]).filter((x:any)=>Number(x.outstanding_wage_payable??0)!==0).map((x:any)=><div key={x.worker_id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm"><div className="min-w-0"><div className="truncate font-medium">{x.worker_name}</div><div className="text-xs text-gray-500">Earned Rs {money(x.total_wages_earned)} · Paid Rs {money(x.total_paid)}</div></div><div className="whitespace-nowrap font-semibold">Rs {money(x.outstanding_wage_payable)}</div></div>)}{!(workers??[]).some((x:any)=>Number(x.outstanding_wage_payable??0)!==0)&&<div className="p-4 text-sm text-gray-500">No labour balances outstanding.</div>}</div></section>
    </div>
  </div>
}
function Card({label,value}:{label:string,value:string}){return <div className="rounded-xl border border-border bg-white p-4"><div className="text-xs text-gray-500">{label}</div><div className="mt-2 text-lg font-semibold">{value}</div></div>}
function Mini({l,v}:{l:string,v:unknown}){return <div><div className="text-xs text-gray-500">{l}</div><div className="font-medium">Rs {money(v)}</div></div>}

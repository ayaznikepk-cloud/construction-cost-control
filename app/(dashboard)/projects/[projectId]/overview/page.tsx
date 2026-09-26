import { createClient } from "@/lib/supabase/server";
import MetricCard from "@/components/shared/MetricCard";

export default async function ProjectOverviewPage({
  params,
}: {
  params: { projectId: string };
}) {
  const supabase = createClient();

  const { data: summary } = await supabase
    .from("v_project_financial_summary")
    .select("*")
    .eq("project_id", params.projectId)
    .single();

  const s = summary ?? {
    contract_value: 0,
    work_executed_value: 0,
    actual_cost: 0,
    amount_passed: 0,
    amount_received: 0,
    receivable: 0,
    supplier_payable: 0,
  };

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Contract Value" value={Number(s.contract_value)} />
        <MetricCard label="Work Executed" value={Number(s.work_executed_value)} />
        <MetricCard label="Actual Cost" value={Number(s.actual_cost)} tone="warning" />
        <MetricCard label="Amount Received" value={Number(s.amount_received)} tone="positive" />
        <MetricCard label="Receivable" value={Number(s.receivable)} tone="warning" />
        <MetricCard label="Payable" value={Number(s.supplier_payable)} tone="danger" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-white p-4">
          <div className="mb-3 text-sm font-medium">Recent Activity</div>
          <p className="text-sm text-gray-500">
            Nothing recorded yet — activity will appear here as progress, purchases, and
            bills are entered.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-white p-4">
          <div className="mb-3 text-sm font-medium">Attention Required</div>
          <p className="text-sm text-gray-500">
            No alerts yet — this will surface overdue payments, pending bills, and
            expiring guarantees once those modules are built.
          </p>
        </div>
      </div>
    </div>
  );
}

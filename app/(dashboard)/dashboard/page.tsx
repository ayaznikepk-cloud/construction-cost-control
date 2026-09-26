import { createClient } from "@/lib/supabase/server";
import MetricCard from "@/components/shared/MetricCard";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: projects, error } = await supabase
    .from("v_project_financial_summary")
    .select("*");

  const totals = (projects ?? []).reduce(
    (acc, p) => ({
      contract: acc.contract + Number(p.contract_value ?? 0),
      receivable: acc.receivable + Number(p.receivable ?? 0),
      payable: acc.payable + Number(p.supplier_payable ?? 0),
    }),
    { contract: 0, receivable: 0, payable: 0 }
  );

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Dashboard</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Active Projects" value={projects?.length ?? 0} />
        <MetricCard label="Total Contract Value" value={totals.contract} />
        <MetricCard label="Total Receivable" value={totals.receivable} tone="warning" />
        <MetricCard label="Total Payables" value={totals.payable} tone="danger" />
      </div>

      <div className="rounded-lg border border-border bg-white">
        <div className="border-b border-border px-4 py-3 text-sm font-medium">
          Projects
        </div>

        {error && (
          <div className="p-4 text-sm text-danger">
            Could not load projects: {error.message}
          </div>
        )}

        {!error && (projects?.length ?? 0) === 0 && (
          <div className="p-4 text-sm text-gray-500">
            No projects yet.{" "}
            <Link href="/projects" className="text-active underline">
              Add your first project
            </Link>
            .
          </div>
        )}

        <table className="w-full text-sm">
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
                <td className="px-4 py-2">{p.project_name}</td>
                <td className="px-4 py-2">
                  Rs {Number(p.contract_value).toLocaleString("en-PK")}
                </td>
                <td className="px-4 py-2">
                  Rs {Number(p.work_executed_value).toLocaleString("en-PK")}
                </td>
                <td className="px-4 py-2">
                  Rs {Number(p.amount_received).toLocaleString("en-PK")}
                </td>
                <td className="px-4 py-2">
                  Rs {Number(p.receivable).toLocaleString("en-PK")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

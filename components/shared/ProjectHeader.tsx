function formatPKR(amount: number) {
  if (Math.abs(amount) >= 1_000_000) return `Rs ${(amount / 1_000_000).toFixed(2)}m`;
  return `Rs ${amount.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

export default function ProjectHeader({
  project,
}: {
  project: {
    project_name: string;
    department: string | null;
    location: string | null;
    status: string;
    original_contract_amount: number;
    completion_date: string | null;
    project_manager_name?: string | null;
  };
}) {
  const statusTone: Record<string, string> = {
    active: "bg-blue-50 text-active",
    completed: "bg-green-50 text-positive",
    suspended: "bg-amber-50 text-warning",
    closed: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="mb-4 rounded-lg border border-border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">{project.project_name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {project.department}
            {project.location ? ` · ${project.location}` : ""}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
            statusTone[project.status] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {project.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm md:grid-cols-4">
        <div>
          <div className="text-xs text-gray-500">Contract Value</div>
          <div className="font-medium">{formatPKR(project.original_contract_amount)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Completion Date</div>
          <div className="font-medium">{project.completion_date ?? "—"}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Project Manager</div>
          <div className="font-medium">{project.project_manager_name ?? "—"}</div>
        </div>
      </div>
    </div>
  );
}

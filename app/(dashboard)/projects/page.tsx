export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import AddProjectForm from "@/components/shared/AddProjectForm";

function textValue(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  return value || null;
}

function numberValue(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function createProject(formData: FormData) {
  "use server";

  const supabase = createClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) throw new Error("You must be signed in.");

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("org_id")
    .eq("id", userData.user.id)
    .single();

  if (userError || !userRow?.org_id) throw new Error("Your organization could not be determined.");

  const projectCode = textValue(formData, "project_code");
  const projectName = textValue(formData, "project_name");
  const contractAmount = numberValue(formData, "original_contract_amount");

  if (!projectCode || !projectName) throw new Error("Project code and project name are required.");
  if (contractAmount === null || contractAmount < 0) throw new Error("Award / agreement amount must be zero or greater.");

  const nonNegativeFields = [
    "technical_sanction_amount", "approved_dnit_mrs_amount", "earnest_money",
    "performance_security", "retention_percentage", "completion_period_days",
  ];
  for (const field of nonNegativeFields) {
    const value = numberValue(formData, field);
    if (value !== null && value < 0) throw new Error("Amounts, percentages and completion period cannot be negative.");
  }

  const { error } = await supabase.from("projects").insert({
    org_id: userRow.org_id,
    project_code: projectCode,
    project_name: projectName,
    department: textValue(formData, "department"),
    division_office: textValue(formData, "division_office"),
    scheme_work_name: textValue(formData, "scheme_work_name"),
    location: textValue(formData, "location"),
    agreement_number: textValue(formData, "agreement_number"),
    work_order_number: textValue(formData, "work_order_number"),
    tender_date: textValue(formData, "tender_date"),
    award_date: textValue(formData, "award_date"),
    commencement_date: textValue(formData, "commencement_date"),
    completion_period_days: numberValue(formData, "completion_period_days"),
    completion_date: textValue(formData, "completion_date"),
    technical_sanction_number: textValue(formData, "technical_sanction_number"),
    technical_sanction_date: textValue(formData, "technical_sanction_date"),
    technical_sanction_amount: numberValue(formData, "technical_sanction_amount"),
    approved_dnit_mrs_amount: numberValue(formData, "approved_dnit_mrs_amount"),
    original_contract_amount: contractAmount,
    bid_percentage: numberValue(formData, "bid_percentage"),
    earnest_money: numberValue(formData, "earnest_money"),
    performance_security: numberValue(formData, "performance_security"),
    retention_percentage: numberValue(formData, "retention_percentage"),
    status: "active",
    created_by: userData.user.id,
    updated_by: userData.user.id,
  });

  if (error) {
    throw new Error(error.code === "23505" ? "That project code is already in use." : `Could not add project: ${error.message}`);
  }
  revalidatePath("/projects");
}

function money(value: unknown) {
  return `Rs ${Number(value ?? 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

export default async function ProjectsPage() {
  const supabase = createClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, project_code, project_name, department, location, original_contract_amount, status")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">Government works, contract values and project status.</p>
        </div>
        <AddProjectForm action={createProject} />
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</div>}

      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <div className="font-medium text-gray-900">Project portfolio</div>
          <div className="mt-1 text-xs text-gray-500">{projects?.length ?? 0} project{projects?.length === 1 ? "" : "s"}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-gray-50">
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3 font-medium">Project</th>
                <th className="px-5 py-3 font-medium">Department</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 text-right font-medium">Award / Agreement</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {projects?.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <Link href={`/projects/${p.id}`} className="font-medium text-gray-900 hover:text-active">
                      {p.project_name}
                    </Link>
                    <div className="mt-1 text-xs text-gray-500">{p.project_code}</div>
                  </td>
                  <td className="px-5 py-4 text-gray-700">{p.department || "—"}</td>
                  <td className="px-5 py-4 text-gray-700">{p.location || "—"}</td>
                  <td className="px-5 py-4 text-right font-medium tabular-nums">{money(p.original_contract_amount)}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium capitalize text-green-700">{p.status}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/projects/${p.id}`} className="text-sm font-medium text-active hover:underline">Open project →</Link>
                  </td>
                </tr>
              ))}
              {!projects?.length && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-500">No projects yet. Add the first project to begin.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

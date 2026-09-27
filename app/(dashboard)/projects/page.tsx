export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import Link from "next/link";

async function createProject(formData: FormData) {
  "use server";

  const supabase = createClient();

  const { data: userData } = await supabase.auth.getUser();
  const { data: userRow } = await supabase
    .from("users")
    .select("org_id")
    .eq("id", userData.user?.id)
    .single();

  const { error } = await supabase.from("projects").insert({
    org_id: userRow?.org_id,
    project_code: formData.get("project_code"),
    project_name: formData.get("project_name"),
    department: formData.get("department"),
    location: formData.get("location"),
    original_contract_amount: Number(formData.get("original_contract_amount")),
    status: "active",
  });

  if (error) {
    throw new Error(`Could not add project: ${error.message}`);
  }

  revalidatePath("/projects");
}

export default async function ProjectsPage() {
  const supabase = createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Projects</h1>

      <div className="mb-6 rounded-lg border border-border bg-white p-4">
        <div className="mb-3 text-sm font-medium">Add project</div>
        <form action={createProject} className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <input
            name="project_code"
            placeholder="Project code"
            required
            className="rounded-md border border-border px-3 py-2 text-sm"
          />
          <input
            name="project_name"
            placeholder="Project name"
            required
            className="rounded-md border border-border px-3 py-2 text-sm md:col-span-2"
          />
          <input
            name="department"
            placeholder="Department"
            className="rounded-md border border-border px-3 py-2 text-sm"
          />
          <input
            name="location"
            placeholder="Location"
            className="rounded-md border border-border px-3 py-2 text-sm"
          />
          <input
            name="original_contract_amount"
            type="number"
            step="0.01"
            placeholder="Contract amount (Rs)"
            required
            className="rounded-md border border-border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="col-span-2 rounded-md bg-active px-4 py-2 text-sm font-medium text-white hover:opacity-90 md:col-span-3"
          >
            Add project
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-gray-500">
              <th className="px-4 py-2 font-medium">Code</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Department</th>
              <th className="px-4 py-2 font-medium">Contract Amount</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {projects?.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2">{p.project_code}</td>
                <td className="px-4 py-2">
                  <Link href={`/projects/${p.id}`} className="text-active hover:underline">
                    {p.project_name}
                  </Link>
                </td>
                <td className="px-4 py-2">{p.department}</td>
                <td className="px-4 py-2">
                  Rs {Number(p.original_contract_amount).toLocaleString("en-PK")}
                </td>
                <td className="px-4 py-2 capitalize">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

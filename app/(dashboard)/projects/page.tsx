export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import AddProjectForm from "@/components/shared/AddProjectForm";

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

      <AddProjectForm action={createProject} />

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

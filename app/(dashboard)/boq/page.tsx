export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = createClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id,project_code,project_name,status")
    .order("project_name");

  if (!error && projects?.length === 1) {
    redirect(`/projects/${projects[0].id}/boq`);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">BOQ & Variations</h1>
        <p className="mt-1 text-sm text-gray-500">Choose a project to manage its bill of quantities and variations.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Could not load projects: {error.message}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="border-b border-border px-5 py-4">
          <div className="font-medium text-gray-900">Select a project</div>
          <div className="mt-1 text-xs text-gray-500">Project-specific records open inside the project workspace.</div>
        </div>

        <div className="divide-y">
          {(projects ?? []).map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}/boq`}
              className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50"
            >
              <div className="min-w-0">
                <div className="font-medium text-gray-900">{project.project_name}</div>
                <div className="mt-1 text-xs text-gray-500">{project.project_code}</div>
              </div>
              <span className="shrink-0 text-sm font-medium text-active">Open →</span>
            </Link>
          ))}

          {!(projects ?? []).length && !error && (
            <div className="px-5 py-10 text-center text-sm text-gray-500">No accessible projects are available.</div>
          )}
        </div>
      </div>
    </div>
  );
}

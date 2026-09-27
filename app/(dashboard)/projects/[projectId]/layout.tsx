export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import ProjectHeader from "@/components/shared/ProjectHeader";
import Link from "next/link";
import { notFound } from "next/navigation";

const tabs = [
  { href: "overview", label: "Overview" },
  { href: "boq", label: "BOQ" },
  { href: "costs", label: "Costs" },
  { href: "labour", label: "Labour" },
  { href: "materials", label: "Materials" },
  { href: "progress", label: "Progress" },
  { href: "bills", label: "Bills" },
  { href: "documents", label: "Documents" },
];

export default async function ProjectWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { projectId: string };
}) {
  const supabase = createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.projectId)
    .single();

  if (!project) notFound();

  return (
    <div>
      <ProjectHeader project={project} />

      <div className="mb-6 flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={`/projects/${params.projectId}/${tab.href}`}
            className="border-b-2 border-transparent px-4 py-2 text-sm text-gray-600 hover:border-active hover:text-active"
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {children}
    </div>
  );
}

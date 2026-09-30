export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import ProjectHeader from "@/components/shared/ProjectHeader";
import ProjectTabs from "@/components/shared/ProjectTabs";
import { notFound } from "next/navigation";

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
    <div className="min-w-0">
      <ProjectHeader project={project} />
      <ProjectTabs projectId={params.projectId} />
      {children}
    </div>
  );
}

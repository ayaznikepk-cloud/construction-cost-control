export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import ProjectHeader from "@/components/shared/ProjectHeader";
import Link from "next/link";
import { notFound } from "next/navigation";

const tabs = [
  { href: "overview", label: "Overview" },
  { href: "boq", label: "BOQ" },
  { href: "progress", label: "Progress" },
  { href: "bills", label: "Bills" },
  { href: "/materials", label: "Materials", global: true },
  { href: "/labour", label: "Labour", global: true },
  { href: "/expenses", label: "Costs", global: true },
  { href: "/documents", label: "Documents", global: true },
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
    <div className="min-w-0">
      <ProjectHeader project={project} />

      <div className="relative mb-6 min-w-0 border-b border-border">
        <div
          className="flex w-full max-w-full gap-1 overflow-x-auto overscroll-x-contain scroll-smooth pb-px pr-12 touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Project sections"
        >
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.global ? tab.href : `/projects/${params.projectId}/${tab.href}`}
              className="shrink-0 whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm text-gray-600 hover:border-active hover:text-active md:px-4"
            >
              {tab.label}
            </Link>
          ))}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 flex w-12 items-center justify-end bg-gradient-to-l from-gray-50 via-gray-50/95 to-transparent pr-1 text-gray-400 md:hidden"
        >
          <span className="rounded-full bg-white/90 px-1.5 py-0.5 text-xs shadow-sm">›</span>
        </div>
      </div>

      {children}
    </div>
  );
}

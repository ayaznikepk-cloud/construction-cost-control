"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { segment: "overview", label: "Overview" },
  { segment: "boq", label: "BOQ" },
  { segment: "progress", label: "Progress" },
  { segment: "bills", label: "Bills" },
  { segment: "materials", label: "Materials" },
  { segment: "labour", label: "Labour" },
  { segment: "costs", label: "Costs" },
  { segment: "documents", label: "Documents" },
];

export default function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  return (
    <div className="relative mb-6 min-w-0 border-b border-border">
      <nav className="flex w-full max-w-full gap-1 overflow-x-auto overscroll-x-contain scroll-smooth pb-px pr-12 touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Project sections">
        {tabs.map((tab) => {
          const href = `/projects/${projectId}/${tab.segment}`;
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={tab.segment}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm md:px-4 ${active ? "border-active font-medium text-active" : "border-transparent text-gray-600 hover:border-active hover:text-active"}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 flex w-12 items-center justify-end bg-gradient-to-l from-gray-50 via-gray-50/95 to-transparent pr-1 text-gray-400 md:hidden">
        <span className="rounded-full bg-white/90 px-1.5 py-0.5 text-xs shadow-sm">›</span>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Menu, X } from "lucide-react";

const sections = [
  { label: "PROJECTS", links: [
    { href: "/projects", label: "Projects" }, { href: "/boq", label: "BOQ & Variations" },
    { href: "/progress", label: "Work Progress" }, { href: "/ra-bills", label: "Running Bills" },
  ]},
  { label: "SITE OPERATIONS", links: [
    { href: "/attendance", label: "Labour Attendance" }, { href: "/materials", label: "Materials" },
    { href: "/daily-report", label: "Daily Site Report" }, { href: "/machinery", label: "Machinery" },
  ]},
  { label: "FINANCE", links: [
    { href: "/expenses", label: "Expenses" }, { href: "/purchases", label: "Purchases" },
    { href: "/supplier-payments", label: "Supplier Payments" }, { href: "/labour-payments", label: "Labour Payments" },
    { href: "/subcontractors", label: "Subcontractors" }, { href: "/receipts", label: "Receipts" },
  ]},
  { label: "CONTROL", links: [
    { href: "/securities", label: "Securities & Recoveries" }, { href: "/documents", label: "Documents" },
    { href: "/reports", label: "Reports" },
  ]},
  { label: "SETUP", links: [
    { href: "/setup/suppliers", label: "Suppliers" }, { href: "/setup/materials", label: "Materials" },
    { href: "/setup/labour", label: "Labour" }, { href: "/setup/users", label: "Users" },
    { href: "/setup/settings", label: "Settings" },
  ]},
];

function Navigation({ close }: { close?: () => void }) {
  return <>
    <Link href="/dashboard" onClick={close} className="mx-3 mb-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white hover:bg-navyLight">
      <LayoutDashboard size={16} /> Dashboard
    </Link>
    <nav className="flex-1 overflow-y-auto px-3 pb-6">
      {sections.map(section => <div key={section.label} className="mt-4">
        <div className="mb-1 px-3 text-[11px] font-medium tracking-wide text-gray-500">{section.label}</div>
        {section.links.map(link => <Link key={link.href} href={link.href} onClick={close}
          className="block rounded-md px-3 py-1.5 text-sm hover:bg-navyLight hover:text-white">{link.label}</Link>)}
      </div>)}
    </nav>
  </>;
}

export default function AppSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return <>
    <aside className="hidden w-64 flex-shrink-0 bg-navy text-gray-300 md:flex md:flex-col">
      <div className="px-5 py-5 text-sm font-semibold text-white">Construction Cost Control</div>
      <Navigation />
    </aside>

    <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b bg-white px-4 md:hidden">
      <button type="button" aria-label="Open navigation" onClick={() => setOpen(true)}
        className="rounded-md border p-2 text-gray-700"><Menu size={20} /></button>
      <span className="truncate text-sm font-semibold text-gray-900">Construction Cost Control</span>
    </header>

    {open && <div className="fixed inset-0 z-40 md:hidden">
      <button aria-label="Close navigation" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <aside className="relative flex h-full w-[82vw] max-w-72 flex-col bg-navy text-gray-300 shadow-xl">
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-sm font-semibold text-white">Construction Cost Control</span>
          <button type="button" aria-label="Close navigation" onClick={() => setOpen(false)}
            className="rounded-md p-2 text-gray-300 hover:bg-navyLight hover:text-white"><X size={20} /></button>
        </div>
        <Navigation close={() => setOpen(false)} />
      </aside>
    </div>}
  </>;
}

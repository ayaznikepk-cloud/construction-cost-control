import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  HardHat,
  Wallet,
  ShieldCheck,
  Settings,
} from "lucide-react";

const sections = [
  {
    label: "PROJECTS",
    icon: Building2,
    links: [
      { href: "/projects", label: "Projects" },
      { href: "/boq", label: "BOQ & Variations" },
      { href: "/progress", label: "Work Progress" },
      { href: "/ra-bills", label: "Running Bills" },
    ],
  },
  {
    label: "SITE OPERATIONS",
    icon: HardHat,
    links: [
      { href: "/attendance", label: "Labour Attendance" },
      { href: "/materials", label: "Materials" },
      { href: "/daily-report", label: "Daily Site Report" },
      { href: "/machinery", label: "Machinery" },
    ],
  },
  {
    label: "FINANCE",
    icon: Wallet,
    links: [
      { href: "/expenses", label: "Expenses" },
      { href: "/purchases", label: "Purchases" },
      { href: "/supplier-payments", label: "Supplier Payments" },
      { href: "/labour-payments", label: "Labour Payments" },
      { href: "/subcontractors", label: "Subcontractors" },
      { href: "/receipts", label: "Receipts" },
    ],
  },
  {
    label: "CONTROL",
    icon: ShieldCheck,
    links: [
      { href: "/securities", label: "Securities & Recoveries" },
      { href: "/documents", label: "Documents" },
      { href: "/reports", label: "Reports" },
    ],
  },
  {
    label: "SETUP",
    icon: Settings,
    links: [
      { href: "/setup/suppliers", label: "Suppliers" },
      { href: "/setup/materials", label: "Materials" },
      { href: "/setup/labour", label: "Labour" },
      { href: "/setup/users", label: "Users" },
      { href: "/setup/settings", label: "Settings" },
    ],
  },
];

export default function AppSidebar() {
  return (
    <aside className="hidden w-64 flex-shrink-0 bg-navy text-gray-300 md:flex md:flex-col">
      <div className="px-5 py-5 text-sm font-semibold text-white">
        Construction Cost Control
      </div>

      <Link
        href="/dashboard"
        className="mx-3 mb-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white hover:bg-navyLight"
      >
        <LayoutDashboard size={16} /> Dashboard
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        {sections.map((section) => (
          <div key={section.label} className="mt-4">
            <div className="mb-1 px-3 text-[11px] font-medium tracking-wide text-gray-500">
              {section.label}
            </div>
            {section.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-md px-3 py-1.5 text-sm hover:bg-navyLight hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

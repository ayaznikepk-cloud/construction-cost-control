import AppSidebar from "@/components/shared/AppSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen min-w-0">
      <AppSidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 pt-[4.5rem] sm:p-6 sm:pt-[4.5rem] lg:pt-6">{children}</main>
    </div>
  );
}

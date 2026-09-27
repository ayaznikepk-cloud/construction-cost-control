export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const trades = [
  "Mason", "Helper", "Carpenter", "Steel Fixer", "Electrician", "Plumber",
  "Painter", "Tile/Marble Mason", "Welder", "Operator", "Chowkidar",
  "Site Staff", "Other",
];

async function addWorker(formData: FormData) {
  "use server";
  const supabase = createClient();

  const { data: userData } = await supabase.auth.getUser();
  const { data: userRow } = await supabase
    .from("users")
    .select("org_id")
    .eq("id", userData.user?.id)
    .single();

  const { error } = await supabase.from("workers").insert({
    org_id: userRow?.org_id,
    worker_code: formData.get("worker_code"),
    name: formData.get("name"),
    mobile: formData.get("mobile"),
    trade: formData.get("trade"),
    daily_wage_rate: Number(formData.get("daily_wage_rate")),
    overtime_rate: formData.get("overtime_rate") ? Number(formData.get("overtime_rate")) : null,
    status: "active",
  });

  if (error) throw new Error(`Could not add worker: ${error.message}`);
  revalidatePath("/setup/labour");
}

export default async function LabourSetupPage() {
  const supabase = createClient();
  const { data: workers } = await supabase
    .from("workers")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Labour</h1>

      <form action={addWorker} className="mb-6 rounded-lg border border-border bg-white p-4">
        <div className="mb-3 text-sm font-medium">Add worker</div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <input
            name="worker_code"
            placeholder="Worker ID"
            required
            className="rounded-md border border-border px-3 py-2 text-sm"
          />
          <input
            name="name"
            placeholder="Full name"
            required
            className="rounded-md border border-border px-3 py-2 text-sm md:col-span-2"
          />
          <input
            name="mobile"
            placeholder="Mobile"
            className="rounded-md border border-border px-3 py-2 text-sm"
          />
          <select name="trade" required className="rounded-md border border-border px-3 py-2 text-sm">
            <option value="">Trade</option>
            {trades.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            name="daily_wage_rate"
            type="number"
            step="0.01"
            placeholder="Daily wage (Rs)"
            required
            className="rounded-md border border-border px-3 py-2 text-sm"
          />
          <input
            name="overtime_rate"
            type="number"
            step="0.01"
            placeholder="OT rate / hour (Rs)"
            className="rounded-md border border-border px-3 py-2 text-sm"
          />
          <button className="col-span-2 rounded-md bg-active px-4 py-2 text-sm font-medium text-white hover:opacity-90 md:col-span-3">
            Add worker
          </button>
        </div>
      </form>

      <div className="rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-gray-500">
              <th className="px-4 py-2 font-medium">ID</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Trade</th>
              <th className="px-4 py-2 font-medium">Daily Wage</th>
              <th className="px-4 py-2 font-medium">OT Rate</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {workers?.map((w) => (
              <tr key={w.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2">{w.worker_code}</td>
                <td className="px-4 py-2">{w.name}</td>
                <td className="px-4 py-2">{w.trade}</td>
                <td className="px-4 py-2">Rs {Number(w.daily_wage_rate).toLocaleString()}</td>
                <td className="px-4 py-2">
                  {w.overtime_rate ? `Rs ${Number(w.overtime_rate).toLocaleString()}` : "—"}
                </td>
                <td className="px-4 py-2 capitalize">{w.status}</td>
              </tr>
            ))}
            {(workers ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                  No workers yet — add your first one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

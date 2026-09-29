export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const value = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

async function addSupplier(formData: FormData) {
  "use server";
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in required.");

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (userError || !userRow?.org_id) throw new Error("Could not determine your organization.");

  const name = value(formData, "name");
  if (!name) throw new Error("Supplier name is required.");

  const optional = (key: string) => value(formData, key) || null;
  const { error } = await supabase.from("suppliers").insert({
    org_id: userRow.org_id,
    name,
    contact_person: optional("contact_person"),
    phone: optional("phone"),
    address: optional("address"),
    tax_registration: optional("tax_registration"),
    status: "active",
  });

  if (error) throw new Error(`Could not add supplier: ${error.message}`);
  revalidatePath("/setup/suppliers");
  revalidatePath("/purchases");
}

async function setSupplierStatus(formData: FormData) {
  "use server";
  const supabase = createClient();
  const id = value(formData, "id");
  const status = value(formData, "status");
  if (!id || !["active", "inactive"].includes(status)) throw new Error("Invalid supplier status.");

  const { error } = await supabase.from("suppliers").update({ status }).eq("id", id);
  if (error) throw new Error(`Could not update supplier: ${error.message}`);
  revalidatePath("/setup/suppliers");
  revalidatePath("/purchases");
}

export default async function SuppliersPage() {
  const supabase = createClient();
  const { data: suppliers, error } = await supabase
    .from("suppliers")
    .select("id,name,contact_person,phone,address,tax_registration,status")
    .order("name");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Suppliers</h1>
        <p className="text-sm text-gray-500">Maintain suppliers used for material purchases and supplier payments.</p>
      </div>

      <form action={addSupplier} className="rounded-xl border border-border bg-white p-4">
        <div className="mb-4">
          <h2 className="font-semibold">Add supplier</h2>
          <p className="text-sm text-gray-500">Active suppliers become available immediately in Purchases.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <input name="name" required placeholder="Supplier name *" className="rounded-md border border-border px-3 py-2 text-sm" />
          <input name="contact_person" placeholder="Contact person" className="rounded-md border border-border px-3 py-2 text-sm" />
          <input name="phone" placeholder="Mobile / phone" className="rounded-md border border-border px-3 py-2 text-sm" />
          <input name="tax_registration" placeholder="NTN / tax registration" className="rounded-md border border-border px-3 py-2 text-sm" />
          <input name="address" placeholder="Address" className="rounded-md border border-border px-3 py-2 text-sm md:col-span-2" />
        </div>
        <button className="mt-3 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white">Add supplier</button>
      </form>

      <section className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="border-b border-border px-4 py-3 font-semibold">Supplier register</div>
        {error ? (
          <p className="p-4 text-sm text-red-600">Could not load suppliers: {error.message}</p>
        ) : (suppliers ?? []).length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-500">No suppliers yet — add your first supplier above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-left text-xs text-gray-500">
                  <th className="px-4 py-2 font-medium">Supplier</th>
                  <th className="px-4 py-2 font-medium">Contact</th>
                  <th className="px-4 py-2 font-medium">Phone</th>
                  <th className="px-4 py-2 font-medium">NTN / Tax Reg.</th>
                  <th className="px-4 py-2 font-medium">Address</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {(suppliers ?? []).map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3">{s.contact_person || "—"}</td>
                    <td className="px-4 py-3">{s.phone || "—"}</td>
                    <td className="px-4 py-3">{s.tax_registration || "—"}</td>
                    <td className="max-w-xs px-4 py-3">{s.address || "—"}</td>
                    <td className="px-4 py-3 capitalize">{s.status}</td>
                    <td className="px-4 py-3">
                      <form action={setSupplierStatus}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="status" value={s.status === "active" ? "inactive" : "active"} />
                        <button className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-gray-50">
                          {s.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

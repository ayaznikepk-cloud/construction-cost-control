export const dynamic = "force-dynamic";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import CreateUserForm from "@/components/users/CreateUserForm";

const value = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

async function updateAssignments(formData: FormData) {
  "use server";
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in required.");

  const { data: isAdmin, error: adminError } = await supabase.rpc("auth_is_admin");
  if (adminError || !isAdmin) throw new Error("Owner administrator access required.");

  const userId = value(formData, "user_id");
  const roleId = value(formData, "role_id");
  const projectIds = formData.getAll("project_ids").map(String).filter(Boolean);

  if (!userId || !roleId) throw new Error("User and role are required.");

  const [{ data: me }, { data: target }, { data: role }] = await Promise.all([
    supabase.from("users").select("org_id").eq("id", user.id).single(),
    supabase.from("users").select("id,org_id").eq("id", userId).single(),
    supabase.from("roles").select("id,name,org_id").eq("id", roleId).single(),
  ]);

  if (!me?.org_id || !target || target.org_id !== me.org_id || !role || role.org_id !== me.org_id) {
    throw new Error("Invalid user or role.");
  }

  if (userId === user.id && role.name !== "owner_admin") {
    throw new Error("You cannot remove your own owner administrator role.");
  }

  if (role.name !== "owner_admin") {
    if (!projectIds.length) throw new Error("Select at least one project.");
    const { data: validProjects, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .in("id", projectIds);
    if (projectError || (validProjects ?? []).length !== new Set(projectIds).size) {
      throw new Error("One or more selected projects are invalid.");
    }
  }

  const { error: roleInsertError } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role_id: roleId }, { onConflict: "user_id,role_id" });
  if (roleInsertError) throw new Error(roleInsertError.message);

  const { error: roleDeleteError } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .neq("role_id", roleId);
  if (roleDeleteError) throw new Error(roleDeleteError.message);

  const { error: clearAccessError } = await supabase
    .from("user_project_access")
    .delete()
    .eq("user_id", userId);
  if (clearAccessError) throw new Error(clearAccessError.message);

  if (role.name !== "owner_admin" && projectIds.length) {
    const { error: accessError } = await supabase.from("user_project_access").insert(
      Array.from(new Set(projectIds)).map((project_id) => ({ user_id: userId, project_id }))
    );
    if (accessError) throw new Error(accessError.message);
  }

  revalidatePath("/setup/users");
}

export default async function Page() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div className="rounded-xl border bg-white p-6 text-sm text-gray-600">Sign in required.</div>;

  const { data: isAdmin } = await supabase.rpc("auth_is_admin");
  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Users</h1>
          <p className="mt-1 text-sm text-gray-500">User accounts, roles and project access.</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Owner administrator access is required to manage users.
        </div>
      </div>
    );
  }

  const { data: me } = await supabase.from("users").select("org_id").eq("id", user.id).single();
  if (!me?.org_id) return <div className="rounded-xl border bg-white p-6 text-sm text-red-700">Could not determine your organization.</div>;

  const [
    { data: users, error: usersError },
    { data: roles, error: rolesError },
    { data: projects, error: projectsError },
    { data: userRoles },
    { data: accessRows },
  ] = await Promise.all([
    supabase.from("users").select("id,full_name,email,status").eq("org_id", me.org_id).order("full_name"),
    supabase.from("roles").select("id,name,description").eq("org_id", me.org_id).order("name"),
    supabase.from("projects").select("id,project_code,project_name,status").eq("org_id", me.org_id).order("project_name"),
    supabase.from("user_roles").select("user_id,role_id"),
    supabase.from("user_project_access").select("user_id,project_id"),
  ]);

  const activeProjects = (projects ?? []).filter((project) => project.status === "active");
  const roleById = new Map((roles ?? []).map((role) => [role.id, role]));
  const rolesByUser = new Map<string, string[]>();
  const projectsByUser = new Map<string, string[]>();

  for (const row of userRoles ?? []) {
    rolesByUser.set(row.user_id, [...(rolesByUser.get(row.user_id) ?? []), row.role_id]);
  }
  for (const row of accessRows ?? []) {
    projectsByUser.set(row.user_id, [...(projectsByUser.get(row.user_id) ?? []), row.project_id]);
  }

  return (
    <div className="min-w-0 space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Users</h1>
        <p className="mt-1 text-sm text-gray-500">Create login accounts, assign roles and control project access.</p>
      </div>

      {(usersError || rolesError || projectsError) && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Could not load user setup data: {usersError?.message ?? rolesError?.message ?? projectsError?.message}
        </div>
      )}

      <CreateUserForm roles={roles ?? []} projects={activeProjects} />

      <section className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-semibold">User register</h2>
          <p className="mt-1 text-xs text-gray-500">Owner administrators have all-project access automatically. Other roles require explicit project access.</p>
        </div>

        <div className="divide-y">
          {(users ?? []).map((row) => {
            const assignedRoleIds = rolesByUser.get(row.id) ?? [];
            const assignedRole = assignedRoleIds.map((id) => roleById.get(id)).find(Boolean);
            const assignedProjects = projectsByUser.get(row.id) ?? [];
            const currentAccount = row.id === user.id;

            return (
              <div key={row.id} className="p-4">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <div className="font-medium">{row.full_name}</div>
                    <div className="break-all text-sm text-gray-500">{row.email}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {currentAccount && <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">Current account</span>}
                    <span className={`rounded-full px-2 py-1 ${row.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>{row.status}</span>
                  </div>
                </div>

                <form action={updateAssignments} className="mt-4 grid gap-3 lg:grid-cols-[240px_1fr_auto] lg:items-start">
                  <input type="hidden" name="user_id" value={row.id} />
                  <label className="text-xs font-medium text-gray-600">
                    Role
                    <select
                      name="role_id"
                      required
                      defaultValue={assignedRole?.id ?? ""}
                      disabled={currentAccount}
                      className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm text-gray-900 disabled:bg-gray-50"
                    >
                      <option value="">Select role</option>
                      {(roles ?? []).map((role) => (
                        <option key={role.id} value={role.id}>{role.name.replaceAll("_", " ")}</option>
                      ))}
                    </select>
                    {currentAccount && <input type="hidden" name="role_id" value={assignedRole?.id ?? ""} />}
                    {assignedRole?.description && <span className="mt-1 block text-[11px] font-normal text-gray-500">{assignedRole.description}</span>}
                  </label>

                  <div>
                    <div className="text-xs font-medium text-gray-600">Project access</div>
                    {assignedRole?.name === "owner_admin" ? (
                      <div className="mt-1 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">All projects</div>
                    ) : (
                      <div className="mt-1 grid gap-2 md:grid-cols-2">
                        {activeProjects.map((project) => (
                          <label key={project.id} className="flex items-start gap-2 rounded-md border border-border p-2 text-sm">
                            <input
                              type="checkbox"
                              name="project_ids"
                              value={project.id}
                              defaultChecked={assignedProjects.includes(project.id)}
                              disabled={currentAccount}
                              className="mt-0.5"
                            />
                            <span><b>{project.project_code}</b> — {project.project_name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {!currentAccount ? (
                    <button className="h-10 rounded-md border border-active px-4 text-sm font-medium text-active lg:mt-5">Save access</button>
                  ) : (
                    <div className="text-xs text-gray-500 lg:mt-7">Protected from self-demotion.</div>
                  )}
                </form>
              </div>
            );
          })}
          {!(users ?? []).length && <div className="p-6 text-sm text-gray-500">No users found.</div>}
        </div>
      </section>
    </div>
  );
}

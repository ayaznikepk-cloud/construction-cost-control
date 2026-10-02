export const dynamic = "force-dynamic";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import CreateUserForm from "@/components/users/CreateUserForm";
import UserAccessForm, { type AssignmentState } from "@/components/users/UserAccessForm";

const value = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

async function updateAssignments(_state: AssignmentState, formData: FormData): Promise<AssignmentState> {
  "use server";
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your session has expired. Please sign in again.", success: null };

  const { data: isAdmin, error: adminError } = await supabase.rpc("auth_is_admin");
  if (adminError || !isAdmin) return { error: "Only the owner administrator can change user access.", success: null };

  const userId = value(formData, "user_id");
  const roleId = value(formData, "role_id");
  const projectIds = formData.getAll("project_ids").map(String).filter(Boolean);

  if (!userId || !roleId) return { error: "Select a user role before saving.", success: null };

  const [{ data: me }, { data: target }, { data: role }] = await Promise.all([
    supabase.from("users").select("org_id").eq("id", user.id).single(),
    supabase.from("users").select("id,org_id").eq("id", userId).single(),
    supabase.from("roles").select("id,name,org_id").eq("id", roleId).single(),
  ]);

  if (!me?.org_id || !target || target.org_id !== me.org_id || !role || role.org_id !== me.org_id) {
    return { error: "That user or role is no longer available. Refresh the page and try again.", success: null };
  }

  if (userId === user.id && role.name !== "owner_admin") {
    return { error: "Your own owner administrator role is protected and cannot be removed here.", success: null };
  }

  if (role.name !== "owner_admin" && projectIds.length) {
    const uniqueProjectIds = Array.from(new Set(projectIds));
    const { data: validProjects, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("org_id", me.org_id)
      .in("id", uniqueProjectIds);

    if (projectError || (validProjects ?? []).length !== uniqueProjectIds.length) {
      return { error: "One of the selected projects is no longer available. Refresh the page and try again.", success: null };
    }
  }

  const { error: roleInsertError } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role_id: roleId }, { onConflict: "user_id,role_id" });
  if (roleInsertError) return { error: "Could not save the user's role. Please try again.", success: null };

  const { error: roleDeleteError } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .neq("role_id", roleId);
  if (roleDeleteError) return { error: "Could not update the user's role. Please try again.", success: null };

  const { error: clearAccessError } = await supabase
    .from("user_project_access")
    .delete()
    .eq("user_id", userId);
  if (clearAccessError) return { error: "Could not update project access. Please try again.", success: null };

  if (role.name !== "owner_admin" && projectIds.length) {
    const { error: accessError } = await supabase.from("user_project_access").insert(
      Array.from(new Set(projectIds)).map((project_id) => ({ user_id: userId, project_id }))
    );
    if (accessError) return { error: "Could not grant project access. Please try again.", success: null };
  }

  revalidatePath("/setup/users");
  return { error: null, success: projectIds.length ? "Access updated successfully." : "Project access revoked successfully." };
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

                <UserAccessForm
                  userId={row.id}
                  currentAccount={currentAccount}
                  assignedRole={assignedRole}
                  assignedProjects={assignedProjects}
                  roles={roles ?? []}
                  projects={activeProjects}
                  action={updateAssignments}
                />
              </div>
            );
          })}
          {!(users ?? []).length && <div className="p-6 text-sm text-gray-500">No users found.</div>}
        </div>
      </section>
    </div>
  );
}

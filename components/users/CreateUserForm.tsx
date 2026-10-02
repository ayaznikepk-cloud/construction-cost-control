"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Role = { id: string; name: string; description: string | null };
type Project = { id: string; project_code: string; project_name: string };

export default function CreateUserForm({ roles, projects }: { roles: Role[]; projects: Project[] }) {
  const router = useRouter();
  const [roleId, setRoleId] = useState("");
  const [projectIds, setProjectIds] = useState<string[]>(projects.length === 1 ? [projects[0].id] : []);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const selectedRole = useMemo(() => roles.find((role) => role.id === roleId), [roles, roleId]);
  const isAdmin = selectedRole?.name === "owner_admin";

  function toggleProject(id: string) {
    setProjectIds((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;

    setPending(true);
    setMessage(null);

    try {
      const form = new FormData(formElement);
      const full_name = String(form.get("full_name") ?? "").trim();
      const email = String(form.get("email") ?? "").trim();
      const password = String(form.get("password") ?? "");

      if (!roleId) {
        setMessage({ kind: "error", text: "Select a role." });
        return;
      }

      if (!isAdmin && projectIds.length === 0) {
        setMessage({ kind: "error", text: "Select at least one project." });
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: { full_name, email, password, role_id: roleId, project_ids: isAdmin ? [] : projectIds },
      });

      if (error || data?.error) {
        setMessage({ kind: "error", text: data?.error ?? error?.message ?? "Could not create user." });
        return;
      }

      formElement.reset();
      setRoleId("");
      setProjectIds(projects.length === 1 ? [projects[0].id] : []);
      setMessage({ kind: "success", text: "User created successfully. They can now sign in with the email and temporary password." });
      router.refresh();
    } catch (error) {
      console.error("Create user failed:", error);
      setMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "Could not create user.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-white p-4">
      <div>
        <h2 className="font-semibold">Create user</h2>
        <p className="mt-1 text-sm text-gray-500">Create the login, assign one role and grant project access.</p>
      </div>

      {message && (
        <div className={`mt-4 rounded-md px-3 py-2 text-sm ${message.kind === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {message.text}
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-xs font-medium text-gray-600">
          Full name
          <input name="full_name" required autoComplete="name" className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm text-gray-900" />
        </label>
        <label className="text-xs font-medium text-gray-600">
          Email
          <input name="email" required type="email" autoComplete="email" className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm text-gray-900" />
        </label>
        <label className="text-xs font-medium text-gray-600">
          Temporary password
          <input name="password" required type="password" minLength={8} autoComplete="new-password" className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm text-gray-900" />
          <span className="mt-1 block text-[11px] font-normal text-gray-500">Minimum 8 characters. Share it privately with the user.</span>
        </label>
        <label className="text-xs font-medium text-gray-600">
          Role
          <select value={roleId} onChange={(event) => setRoleId(event.target.value)} required className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm text-gray-900">
            <option value="">Select role</option>
            {roles.map((role) => <option key={role.id} value={role.id}>{role.name.replaceAll("_", " ")}</option>)}
          </select>
          {selectedRole?.description && <span className="mt-1 block text-[11px] font-normal text-gray-500">{selectedRole.description}</span>}
        </label>
      </div>

      <div className="mt-4">
        <div className="text-xs font-medium text-gray-600">Project access</div>
        {isAdmin ? (
          <div className="mt-2 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">Owner administrators automatically have access to all projects.</div>
        ) : (
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {projects.map((project) => (
              <label key={project.id} className="flex items-start gap-2 rounded-md border border-border p-3 text-sm">
                <input type="checkbox" checked={projectIds.includes(project.id)} onChange={() => toggleProject(project.id)} className="mt-0.5" />
                <span><b>{project.project_code}</b> — {project.project_name}</span>
              </label>
            ))}
            {!projects.length && <div className="text-sm text-gray-500">No projects available.</div>}
          </div>
        )}
      </div>

      <button disabled={pending} className="mt-4 w-full rounded-md bg-active px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
        {pending ? "Creating user..." : "Create user"}
      </button>
    </form>
  );
}

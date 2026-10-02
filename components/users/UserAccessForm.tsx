"use client";

import { useFormState, useFormStatus } from "react-dom";
import FormStatusMessage from "@/components/shared/FormStatusMessage";

type Role = {
  id: string;
  name: string;
  description: string | null;
};

type Project = {
  id: string;
  project_code: string;
  project_name: string;
};

export type AssignmentState = {
  error: string | null;
  success: string | null;
};

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending}
      className="h-10 rounded-md border border-active px-4 text-sm font-medium text-active disabled:cursor-not-allowed disabled:opacity-50 lg:mt-5"
    >
      {pending ? "Saving..." : "Save access"}
    </button>
  );
}

export default function UserAccessForm({
  userId,
  currentAccount,
  assignedRole,
  assignedProjects,
  roles,
  projects,
  action,
}: {
  userId: string;
  currentAccount: boolean;
  assignedRole: Role | undefined;
  assignedProjects: string[];
  roles: Role[];
  projects: Project[];
  action: (state: AssignmentState, formData: FormData) => Promise<AssignmentState>;
}) {
  const [state, formAction] = useFormState(action, { error: null, success: null });

  return (
    <form action={formAction} className="mt-4">
      <input type="hidden" name="user_id" value={userId} />

      <div className="grid gap-3 lg:grid-cols-[240px_1fr_auto] lg:items-start">
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
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          {currentAccount && <input type="hidden" name="role_id" value={assignedRole?.id ?? ""} />}
          {assignedRole?.description && (
            <span className="mt-1 block text-[11px] font-normal text-gray-500">
              {assignedRole.description}
            </span>
          )}
        </label>

        <div>
          <div className="text-xs font-medium text-gray-600">Project access</div>
          {assignedRole?.name === "owner_admin" ? (
            <div className="mt-1 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
              All projects
            </div>
          ) : (
            <>
              <div className="mt-1 grid gap-2 md:grid-cols-2">
                {projects.map((project) => (
                  <label
                    key={project.id}
                    className="flex items-start gap-2 rounded-md border border-border p-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="project_ids"
                      value={project.id}
                      defaultChecked={assignedProjects.includes(project.id)}
                      disabled={currentAccount}
                      className="mt-0.5 h-4 w-4"
                    />
                    <span>
                      <b>{project.project_code}</b> — {project.project_name}
                    </span>
                  </label>
                ))}
              </div>
              {!currentAccount && (
                <p className="mt-2 text-[11px] text-gray-500">
                  Leave all projects unchecked to revoke this user's project access while keeping the account active.
                </p>
              )}
            </>
          )}
        </div>

        {!currentAccount ? (
          <SaveButton />
        ) : (
          <div className="text-xs text-gray-500 lg:mt-7">Protected from self-demotion.</div>
        )}
      </div>

      {(state.error || state.success) && (
        <div className="mt-3">
          <FormStatusMessage kind={state.error ? "error" : "success"}>
            {state.error ?? state.success}
          </FormStatusMessage>
        </div>
      )}
    </form>
  );
}

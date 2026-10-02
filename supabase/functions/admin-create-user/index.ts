import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type CreateUserPayload = {
  full_name?: string;
  email?: string;
  password?: string;
  role_id?: string;
  project_ids?: string[];
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization") ?? "";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "Server configuration is incomplete." }, 500);
  }
  if (!authHeader.startsWith("Bearer ")) {
    return json({ error: "Authentication required." }, 401);
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) return json({ error: "Authentication required." }, 401);

  const { data: caller, error: callerError } = await admin
    .from("users")
    .select("id,org_id,status")
    .eq("id", user.id)
    .single();

  if (callerError || !caller || caller.status !== "active") {
    return json({ error: "Active application user required." }, 403);
  }

  const { data: adminRole, error: adminRoleError } = await admin
    .from("roles")
    .select("id")
    .eq("org_id", caller.org_id)
    .eq("name", "owner_admin")
    .single();

  if (adminRoleError || !adminRole) {
    return json({ error: "Administrator role is not configured." }, 500);
  }

  const { data: callerRole } = await admin
    .from("user_roles")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("role_id", adminRole.id)
    .maybeSingle();

  if (!callerRole) return json({ error: "Owner administrator access required." }, 403);

  let payload: CreateUserPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const fullName = String(payload.full_name ?? "").trim().replace(/\s+/g, " ");
  const email = String(payload.email ?? "").trim().toLowerCase();
  const password = String(payload.password ?? "");
  const roleId = String(payload.role_id ?? "").trim();
  const projectIds = Array.from(new Set((payload.project_ids ?? []).map(String).filter(Boolean)));

  if (!fullName) return json({ error: "Full name is required." }, 400);
  if (!email || !email.includes("@")) return json({ error: "A valid email address is required." }, 400);
  if (password.length < 8) return json({ error: "Temporary password must be at least 8 characters." }, 400);
  if (!roleId) return json({ error: "Role is required." }, 400);

  const { data: role, error: roleError } = await admin
    .from("roles")
    .select("id,name")
    .eq("id", roleId)
    .eq("org_id", caller.org_id)
    .single();

  if (roleError || !role) return json({ error: "Selected role is invalid." }, 400);

  if (role.name !== "owner_admin" && projectIds.length === 0) {
    return json({ error: "Select at least one project for this user." }, 400);
  }

  if (projectIds.length) {
    const { data: validProjects, error: projectError } = await admin
      .from("projects")
      .select("id")
      .eq("org_id", caller.org_id)
      .in("id", projectIds);

    if (projectError || (validProjects ?? []).length !== projectIds.length) {
      return json({ error: "One or more selected projects are invalid." }, 400);
    }
  }

  const { data: existingProfile } = await admin
    .from("users")
    .select("id")
    .eq("org_id", caller.org_id)
    .ilike("email", email)
    .maybeSingle();

  if (existingProfile) return json({ error: "A user with this email already exists." }, 409);

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError || !created.user) {
    return json({ error: createError?.message ?? "Could not create login account." }, 400);
  }

  const userId = created.user.id;

  const cleanup = async () => {
    await admin.from("user_project_access").delete().eq("user_id", userId);
    await admin.from("user_roles").delete().eq("user_id", userId);
    await admin.from("users").delete().eq("id", userId);
    await admin.auth.admin.deleteUser(userId);
  };

  const { error: profileError } = await admin.from("users").insert({
    id: userId,
    org_id: caller.org_id,
    full_name: fullName,
    email,
    status: "active",
  });

  if (profileError) {
    await cleanup();
    return json({ error: profileError.message }, 400);
  }

  const { error: userRoleError } = await admin.from("user_roles").insert({
    user_id: userId,
    role_id: roleId,
  });

  if (userRoleError) {
    await cleanup();
    return json({ error: userRoleError.message }, 400);
  }

  if (role.name !== "owner_admin" && projectIds.length) {
    const { error: accessError } = await admin.from("user_project_access").insert(
      projectIds.map((project_id) => ({ user_id: userId, project_id }))
    );
    if (accessError) {
      await cleanup();
      return json({ error: accessError.message }, 400);
    }
  }

  return json({
    ok: true,
    user: { id: userId, full_name: fullName, email, role: role.name },
  });
});

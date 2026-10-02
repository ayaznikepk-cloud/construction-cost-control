-- Security hardening for project-scoped access.
-- Prepared for review only; do not apply to production until approved.

begin;

-- Ensure the BOQ cost summary view evaluates underlying RLS as the caller,
-- not as the view owner.
alter view public.v_boq_cost_summary
  set (security_invoker = true);

-- RA bills: preserve existing allowed role (accountant + owner admin through
-- auth_has_role), but require project access for reads/writes/deletes made
-- through this ALL policy.
drop policy if exists ra_bills_write on public.ra_bills;

create policy ra_bills_write
on public.ra_bills
for all
to authenticated
using (
  public.auth_has_project_access(project_id)
  and public.auth_has_role(array['accountant']::text[])
)
with check (
  public.auth_has_project_access(project_id)
  and public.auth_has_role(array['accountant']::text[])
);

-- Projects: a project manager may update only projects they are explicitly
-- assigned to. Owner administrators continue to pass auth_has_project_access().
drop policy if exists projects_upd on public.projects;

create policy projects_upd
on public.projects
for update
to authenticated
using (
  org_id = public.auth_org_id()
  and public.auth_has_project_access(id)
  and public.auth_has_role(array['project_manager']::text[])
)
with check (
  org_id = public.auth_org_id()
  and public.auth_has_project_access(id)
  and public.auth_has_role(array['project_manager']::text[])
);

-- These SECURITY DEFINER helpers are internal authorization helpers.
-- Remove anonymous/public RPC exposure while retaining execution for
-- authenticated app sessions and the Supabase service role.
revoke all on function public.auth_org_id() from public;
grant execute on function public.auth_org_id() to authenticated, service_role;

revoke all on function public.auth_is_admin() from public;
grant execute on function public.auth_is_admin() to authenticated, service_role;

revoke all on function public.auth_has_role(text[]) from public;
grant execute on function public.auth_has_role(text[]) to authenticated, service_role;

revoke all on function public.auth_has_project_access(uuid) from public;
grant execute on function public.auth_has_project_access(uuid) to authenticated, service_role;

revoke all on function public.ensure_store(uuid) from public;
grant execute on function public.ensure_store(uuid) to authenticated, service_role;

commit;

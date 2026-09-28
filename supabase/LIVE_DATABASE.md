# Live Supabase database reference

This repository uses the hosted Supabase database as the authoritative database while the project is being brought under migration source control.

Snapshot reviewed: 2026-09-28.

## Current database surface

The public schema includes the application's core domains: organizations and users, roles and project access, projects, BOQ sections/items/variations/extra items, labour attendance and payroll, purchases and stock, expenses, subcontracting, progress/measurements, RA bills and government receipts, securities/recoveries, documents, equipment, audit history, and supporting lookup tables.

Current financial/operational views:
- `v_boq_cost_summary`
- `v_project_financial_summary`
- `v_stock_balance`
- `v_supplier_payable`
- `v_worker_payable`

Generated API types are committed at `lib/database.types.ts`. Regenerate them from the connected live project whenever the schema changes.

## Database integrity already present

The live database contains guard functions for BOQ locking, attendance locking, posted-record immutability, and RA-bill item independence. These are important business controls and should be preserved when future migrations are written.

RLS is enabled on the application tables and policies use organization/project access plus role checks.

## Security review items

The following helper functions currently run as `SECURITY DEFINER` and should receive a dedicated grant/search-path review before permissions are tightened:

- `auth_org_id()`
- `auth_is_admin()`
- `auth_has_role(text[])`
- `auth_has_project_access(uuid)`
- `ensure_store(uuid)`

Do not change these blindly because the first four are used by RLS policies.

Supabase also reports leaked-password protection as disabled. That is an Auth configuration task rather than an application schema change.

## Development rule from this point

1. Do not make undocumented production schema changes.
2. Design each database change as a timestamped SQL migration in GitHub.
3. Review the migration and its RLS impact.
4. Apply the reviewed migration to Supabase.
5. Regenerate `lib/database.types.ts` from the live database.
6. Commit the migration and refreshed types together.

No production table rows, passwords, API keys, access tokens, or service-role secrets belong in Git.

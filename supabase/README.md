# Supabase source-control workflow

The live Supabase database is the current source of the application's database structure. This repository should keep a reproducible migration history and generated TypeScript types alongside the application code.

## First-time setup

Install/use the Supabase CLI, authenticate, initialize the repo if needed, and link this checkout to the correct remote project:

```bash
npx supabase login
npx supabase init
npx supabase link --project-ref <project-ref>
```

The link command may prompt locally for the database password. Never put that password, an access token, a service-role key, or any other secret in Git.

## Capture the existing live schema

For an existing hosted project, Supabase recommends `db pull`. It creates a migration representing the remote schema and records that migration as already applied remotely.

```bash
npx supabase db pull
```

Review the generated migration before committing it. It is a schema baseline, not a production-data export.

## Generate application types

```bash
npx supabase gen types typescript --linked --schema public > lib/database.types.ts
```

Or run both operations through:

```bash
bash scripts/sync-supabase-schema.sh
```

## Daily workflow

Make database changes as new timestamped migrations. Verify them locally with `npx supabase db reset`, regenerate `lib/database.types.ts`, and commit the migration and generated types together. Before deploying, use `npx supabase db push --dry-run` and review the result.

Do not edit an already-deployed migration to represent a new change.

## Current live-database review

The connected live project currently has RLS enabled across the application tables and includes the main construction-control domains: organizations/users/roles, projects, BOQ and variations, labour/payroll, procurement/stock, subcontracting, progress/measurements, RA bills/receipts, documents, equipment, audit/approval records, and financial summary views.

Supabase's security advisor currently flags broad execution grants on five `SECURITY DEFINER` functions: `auth_org_id()`, `auth_is_admin()`, `auth_has_role(text[])`, `auth_has_project_access(uuid)`, and `ensure_store(uuid)`. Do not change these blindly because several appear to support RLS; review their intended callers and grants first.

The security advisor also reports leaked-password protection as disabled. The performance advisor reports many foreign keys without covering indexes. Those are separate hardening tasks and are intentionally not modified by this setup commit.

# Construction Cost Control

Production application for construction project cost control, site operations, labour, materials, purchasing, subcontractors, receipts, securities, documents, reporting and project progress.

## Production requirements

- Node.js compatible with Next.js 14
- Supabase project with the application's schema, RLS policies and functions deployed
- Supabase Edge Function `admin-create-user` deployed with:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Application environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Copy `.env.example` to `.env.local` for local development. Never commit real credentials.

## Local verification

```bash
npm install
npm run lint
npm run build
npm start
```

Before deploying, verify login, project access, role restrictions, data-entry workflows and print/PDF screens using production-like data.

## Deployment

The app is suitable for deployment to Vercel or another Node.js host that supports Next.js.

1. Configure the two application environment variables in the hosting platform.
2. Deploy the latest production-approved branch.
3. Confirm Supabase Auth redirect/domain settings include the production hostname.
4. Confirm the `admin-create-user` Edge Function and database migrations are deployed.
5. Run a post-deploy smoke test covering login, dashboard, core write operations, user administration and printing.

## Security notes

- Authentication is enforced by middleware.
- Database access relies on Supabase Row Level Security and application role checks.
- Elevated Supabase service-role access is confined to the server-side Edge Function used for administrator-created accounts. Do not expose the service-role key to the browser.
- Baseline response security headers are configured in `next.config.js`.

# Construction Cost Control

This folder is the beginning of the app: authentication, sidebar navigation,
a dashboard pulling from `v_project_financial_summary`, and a working
Projects screen (list + add).

## What's real right now
- Login (Supabase Auth)
- Role-gated route protection (middleware redirects to /login if not signed in)
- Dashboard reading live data from your Supabase database
- Projects: list existing + add new (writes to the real `projects` table)

## What's not built yet
Everything else in the navigation (BOQ, Attendance, Materials, RA Bills, etc.)
is listed in the sidebar but has no page yet — clicking those links will 404
until we build each one in the coming phases.

## Before this works, you need one manual step

Your database has RLS enabled, meaning **only authenticated users tied to
your organization can see any data**. Right now there is no user yet. Create
one:

1. In Supabase, go to Authentication → Users → "Add user"
2. Create yourself with an email + password
3. Go to Table Editor → `organizations`, add one row (any name)
4. Go to Table Editor → `users`, add a row with the same `id` as your new
   auth user (copy it from the Authentication page) and the `org_id` from
   step 3

I'll turn this into a proper onboarding screen in a later phase — for now
it's a one-time manual step to get your first login working.

## Deployment (Vercel)

1. Push this folder to a new GitHub repository
2. Go to vercel.com, sign in with GitHub, click "Add New Project"
3. Import the repository
4. In the environment variables section, add the two values from your
   `.env.local` file
5. Click Deploy — you'll get a live `.vercel.app` URL in about a minute

#!/usr/bin/env bash
set -euo pipefail

# Sync the linked Supabase project's schema and generated TypeScript types.
# This script never dumps production table data.
#
# First-time setup:
#   npx supabase login
#   npx supabase link --project-ref <your-project-ref>
#
# Then:
#   bash scripts/sync-supabase-schema.sh

mkdir -p supabase/migrations lib

echo "Pulling remote schema into a migration..."
npx supabase db pull

echo "Generating TypeScript database types..."
npx supabase gen types typescript --linked --schema public > lib/database.types.ts

echo
echo "Done."
echo "Review the new migration and lib/database.types.ts before committing."
echo "Do not commit .env files, access tokens, database passwords, or production data."

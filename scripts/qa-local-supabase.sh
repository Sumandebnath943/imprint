#!/usr/bin/env bash
# Bootstrap a new disposable Supabase Docker project without linking a remote.
set -euo pipefail
repo=$(cd -- "$(dirname -- "$0")/.." && pwd)
cli=${QA_SUPABASE_CLI:-supabase}
port=${QA_DB_PORT_PREFIX:-5436}
app_port=${QA_PORT:-3479}
confirm=${QA_EMAIL_CONFIRMATIONS:-true}
out=${QA_SUPABASE_ENV:-"$repo/node_modules/.cache/imprint-e2e/confirmation-supabase.env"}
[[ "$port" =~ ^[1-5][0-9]{3}$ && "$app_port" =~ ^[0-9]{4,5}$ && "$confirm" =~ ^(true|false)$ ]]
project="imprint-qa-$port"
work=$(mktemp -d)
cd "$work"
"$cli" init >/dev/null
config=supabase/config.toml
sed -i -E "s/5432([0-9])/$port\1/g; s/^project_id = .*/project_id = \"$project\"/; s/sign_in_sign_ups = 30/sign_in_sign_ups = 300/g" "$config"
sed -i -E '/^\[auth\]$/,/^\[/ { s|^site_url = .*|site_url = "http://127.0.0.1:'"$app_port"'"|; s|^additional_redirect_urls = .*|additional_redirect_urls = ["http://127.0.0.1:'"$app_port"'/auth/callback", "http://127.0.0.1:'"$app_port"'/auth/reset-password"]|; }' "$config"
sed -i -E '/^\[auth.email\]$/,/^\[/ { s/^enable_confirmations = .*/enable_confirmations = '"$confirm"'/; }' "$config"

# Run managed-schema migrations before loading the repository history. In a
# running Supabase image storage.objects already has RLS, and is owned by the
# managed Storage role. Migration 005 also creates policies, which needs the
# owner's DDL authority. Use the local bootstrap principal on this stack only.
mkdir -p "$(dirname -- "$out")"
"$cli" start -x realtime,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor > "$work/start.log" 2>&1 || {
  printf 'Supabase start failed. Inspect the local log at %s\n' "$work/start.log" >&2
  exit 1
}
container="supabase_db_$project"
sql() {
  docker exec -i "$container" sh -c 'export PGPASSWORD="$POSTGRES_PASSWORD"; exec psql -X -w -v ON_ERROR_STOP=1 -U supabase_admin -d postgres "$@"' sh "$@"
}
test "$(sql -Atc "select relrowsecurity from pg_class where oid = 'storage.objects'::regclass")" = t
test "$(sql -Atc "select to_regclass('public.profiles') is null")" = t
for file in "$repo"/supabase/migrations/*.sql; do
  name=$(basename -- "$file")
  echo "Applying $name on $project"
  sql -1 -q < "$file"
  if [[ "$name" == 010_* && -n "${QA_UPGRADE_FIXTURE:-}" ]]; then
    sql -1 -q < "$QA_UPGRADE_FIXTURE"
  fi
done
sql -qc "notify pgrst, 'reload schema'"
"$cli" status -o env > "$out"
printf 'Local QA ready on port %s. Project directory %s\n' "${port}1" "$work"

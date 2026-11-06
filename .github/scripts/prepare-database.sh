#!/usr/bin/env bash
# Prepares one Azure SQL database for the app: (optionally) creates it, then runs
# migrations, seeds sample stories (never in prod) and ensures the API's contained user.
# Used by the dev deploy and by per-PR preview environments.
#
# Required env: RG, SQL_SERVER_NAME, SQL_DATABASE, APP_DB_PASSWORD, APP_ENVIRONMENT
# Optional env: CREATE_IF_MISSING=true  (previews: create a free-offer serverless DB)
#               APP_DB_USER (default api_app)
set -euo pipefail
: "${RG:?}" "${SQL_SERVER_NAME:?}" "${SQL_DATABASE:?}" "${APP_DB_PASSWORD:?}" "${APP_ENVIRONMENT:?}"

if [ "${CREATE_IF_MISSING:-false}" = "true" ] &&
   ! az sql db show -g "$RG" -s "$SQL_SERVER_NAME" -n "$SQL_DATABASE" -o none 2>/dev/null; then
  echo "Creating database $SQL_DATABASE (free offer, serverless, auto-pause)…"
  if ! az sql db create -g "$RG" -s "$SQL_SERVER_NAME" -n "$SQL_DATABASE" -o none \
      --edition GeneralPurpose --family Gen5 --capacity 2 --compute-model Serverless \
      --min-capacity 0.5 --auto-pause-delay 60 --max-size 32GB \
      --backup-storage-redundancy Local \
      --use-free-limit true --free-limit-exhaustion-behavior AutoPause \
      --tags app=testimony-site purpose=pr-preview; then
    echo "::error::Could not create $SQL_DATABASE. The subscription may be out of free SQL databases (max 10): close stale PRs or delete leftover testimony-pr-* databases."
    exit 1
  fi
fi

rule="gh-runner-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}"
close_firewall() {
  az sql server firewall-rule delete -g "$RG" -s "$SQL_SERVER_NAME" -n "$rule" -o none 2>/dev/null || true
}
trap close_firewall EXIT

ip=$(curl -fsS https://api.ipify.org)
az sql server firewall-rule create -g "$RG" -s "$SQL_SERVER_NAME" -n "$rule" \
  --start-ip-address "$ip" --end-ip-address "$ip" -o none

export SQL_SERVER="$SQL_SERVER_NAME.database.windows.net"
export SQL_DATABASE APP_ENVIRONMENT APP_DB_PASSWORD
export APP_DB_USER="${APP_DB_USER:-api_app}"
SQL_ACCESS_TOKEN=$(az account get-access-token --resource https://database.windows.net/ --query accessToken -o tsv)
echo "::add-mask::$SQL_ACCESS_TOKEN"
export SQL_ACCESS_TOKEN

npm run migrate -w db
if [ "$APP_ENVIRONMENT" != "prod" ]; then
  npm run seed:samples -w db   # also refuses prod by itself
fi
npm run ensure-app-user -w db

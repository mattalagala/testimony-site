#!/usr/bin/env bash
# One-time setup per environment: resource group, GitHub OIDC identity, SQL admin group,
# and GitHub environment variables. Everything after this is deployed by the pipeline.
#
# Usage:  az login && gh auth login
#         ./infra/bootstrap.sh dev "<subscription id or name>"
# Safe to re-run: existing resources are reused.
set -euo pipefail

ENV_NAME=${1:?environment name (dev|prod)}
SUBSCRIPTION=${2:?subscription id or name}
REPO=${REPO:-mattalagala/testimony-site}
LOC=${LOC:-centralus}
RG=rg-testimony-$ENV_NAME
APP_NAME=gh-testimony-site-$ENV_NAME
GROUP_NAME=sg-testimony-sql-admins-$ENV_NAME

az account set --subscription "$SUBSCRIPTION"
SUB_ID=$(az account show --query id -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)

echo "Resource group $RG ($LOC)"
az group create -n "$RG" -l "$LOC" -o none
RG_ID=$(az group show -n "$RG" --query id -o tsv)

echo "App registration $APP_NAME"
APP_ID=$(az ad app list --display-name "$APP_NAME" --query "[0].appId" -o tsv)
[ -z "$APP_ID" ] && APP_ID=$(az ad app create --display-name "$APP_NAME" --query appId -o tsv)
SP_OID=$(az ad sp show --id "$APP_ID" --query id -o tsv 2>/dev/null || az ad sp create --id "$APP_ID" --query id -o tsv)

# GitHub may send either subject format in the OIDC token: the classic name-based one,
# or the newer ID-based one (owner@ownerId/repo@repoId). Register both.
OWNER=${REPO%%/*}; NAME=${REPO#*/}
OWNER_ID=$(gh api "users/$OWNER" --jq .id)
REPO_ID=$(gh api "repos/$REPO" --jq .id)
add_credential() { # name subject
  if [ -z "$(az ad app federated-credential list --id "$APP_ID" --query "[?name=='$1'].name" -o tsv)" ]; then
    az ad app federated-credential create --id "$APP_ID" -o none --parameters "{
      \"name\": \"$1\",
      \"issuer\": \"https://token.actions.githubusercontent.com\",
      \"subject\": \"$2\",
      \"audiences\": [\"api://AzureADTokenExchange\"]
    }"
  fi
}
add_credential "gh-env-$ENV_NAME" "repo:$REPO:environment:$ENV_NAME"
add_credential "gh-env-$ENV_NAME-ids" "repo:$OWNER@$OWNER_ID/$NAME@$REPO_ID:environment:$ENV_NAME"

# Contributor only: the templates create no role assignments (SWA managed functions
# can't use managed identity), so the pipeline doesn't need RBAC-admin rights.
echo "Contributor on $RG"
az role assignment create --assignee-object-id "$SP_OID" --assignee-principal-type ServicePrincipal \
  --role "Contributor" --scope "$RG_ID" -o none

echo "SQL admin group $GROUP_NAME"
GRP_ID=$(az ad group list --display-name "$GROUP_NAME" --query "[0].id" -o tsv)
[ -z "$GRP_ID" ] && GRP_ID=$(az ad group create --display-name "$GROUP_NAME" --mail-nickname "$GROUP_NAME" --query id -o tsv)
ME=$(az ad signed-in-user show --query id -o tsv)
for MEMBER in "$ME" "$SP_OID"; do
  [ "$(az ad group member check --group "$GRP_ID" --member-id "$MEMBER" --query value -o tsv)" = "true" ] ||
    az ad group member add --group "$GRP_ID" --member-id "$MEMBER"
done

echo "GitHub environment '$ENV_NAME' + variables"
gh api -X PUT "repos/$REPO/environments/$ENV_NAME" --silent
gh variable set AZURE_CLIENT_ID       --env "$ENV_NAME" --repo "$REPO" --body "$APP_ID"
gh variable set AZURE_TENANT_ID       --env "$ENV_NAME" --repo "$REPO" --body "$TENANT_ID"
gh variable set AZURE_SUBSCRIPTION_ID --env "$ENV_NAME" --repo "$REPO" --body "$SUB_ID"
gh variable set AZURE_RG              --env "$ENV_NAME" --repo "$REPO" --body "$RG"
gh variable set SQL_ADMIN_GROUP_ID    --env "$ENV_NAME" --repo "$REPO" --body "$GRP_ID"
gh variable set SQL_ADMIN_GROUP_NAME  --env "$ENV_NAME" --repo "$REPO" --body "$GROUP_NAME"

echo
echo "SQL admin group members:"
# `az ad group member list` only shows users; ask Graph for all members (incl. the pipeline SP).
az rest --method GET --url "https://graph.microsoft.com/v1.0/groups/$GRP_ID/members?\$select=displayName" \
  --query "value[].displayName" -o tsv | sed 's/^/  - /'
echo
echo "Done. To switch on Azure jobs:  gh variable set AZURE_ENABLED --repo $REPO --body true"

# CLAUDE.md

Guidance for Claude (Claude Code and the claude.ai project chat) working in this repo.
**Keep this file current:** any PR that changes a convention, command, or rule below updates this file in the same PR.

## What this is and why

A Christian testimony and prayer-request site. Goals, in priority order:
1. Bring people to Jesus
2. Build faith in Christians
3. Evangelize the gospel

Every feature should serve those goals. Every story and prayer page carries a clear next step for someone who doesn't know Jesus yet (the `NextStep` component, linking to `/know-jesus`). If a change doesn't serve the goals, or adds complexity before the MVP ships, raise it rather than building it.

Product decisions, scope, and open questions live in the **project brief** (claude.ai Project, `claude/project-brief.md`). This file holds the parts needed to work in the code. If they conflict, the brief wins: flag the conflict and fix this file.

## Working with Matt

- Matt is a Microsoft technical consultant (Azure, DevOps, AI tooling). Skip beginner explanations and default to Azure services.
- Build in small, working increments. Confirm scope before writing a lot of code.
- Matt approves merges to `main` (each merge deploys), all public-facing content (gospel page, statement of faith), and anything that costs money or can't be undone in Azure.
- `main` is protected by a ruleset: changes land only through a PR with these checks green: lint/typecheck/unit/build, DB tests, and local e2e. The repo is public, so never commit secrets or real user data.

## Non-negotiable rules for user content

- **Moderation before publishing.** Public endpoints return only `Status = 'approved'` rows with `PublishedAt <= now`. This is enforced by `PUBLIC_FILTER` in `api/src/data/sql-repository.ts` and mirrored in the in-memory repo. New public queries must use it.
- **Never expose emails, submitter IDs, manage tokens, or moderation details publicly.** Public shapes live in `shared/src/index.ts`, and a test asserts the exact public fields. Add fields there deliberately.
- **Display names:** `anonymous` | `first` | `full`, resolved by `resolveDisplayName`. Store only the name as it may be shown.
- **Render user text as plain text, never HTML.**
- **Crisis content** (self-harm and similar) goes to `needs_care` status, is never published, and the submitter is shown 988 and crisis resources.
- **Sample content** is labelled "SAMPLE CONTENT", lives in `shared/src/seed.ts`, and is seeded only in dev, local, and CI. The seeder refuses prod. Never fabricate testimonies for production.

## Architecture

| Path | Notes |
| --- | --- |
| `web/` | React 19 + TS + Vite + Tailwind v4 + React Router. Design tokens are in `web/src/index.css` (`night`, `dawn`, and others). `dawn` is reserved for next-step actions. Public URLs use "stories" (`/stories/:slug`). |
| `api/` | Azure Functions v4 (Node 22), deployed as **SWA managed functions** (not a linked Function App, so PR previews get a full stack). Handlers in `api/src/http/handlers.ts` are framework-agnostic; `api/src/functions/*` adapts them for Functions, and `api/src/local/server.ts` for local dev. Bundled with esbuild into `api/.deploy`. |
| `shared/` | API contract types and helpers, categories, sample data, SQL connection config. Consumed as TS source. |
| `db/` | Numbered migrations in `db/migrations/NNN_name.sql`. **Never edit an applied migration;** the runner rejects checksum changes, so add a new one. `GO` separates batches. |
| `infra/` | `main.bicep` and `<env>.bicepparam`. No portal changes. `bootstrap.sh` handles one-time identity setup per environment. |
| `e2e/` | Playwright tests tagged `@smoke`. They run locally, against PR previews, and after deploy, so assert structure, not specific stories. |

- **Data access:** the API connects to Azure SQL as contained user `api_app` (`db_datareader` + `db_datawriter`). The password lives only in SWA app settings, set by the pipeline. Migrations run with an Entra token as a member of `sg-testimony-sql-admins-<env>`.
- **PR previews** each get their own database, `testimony-pr-<number>`, on the dev SQL server (free offer, auto-pause). It's created and migrated with the PR's own migrations, seeded with samples, and dropped when the PR closes. Dependabot PRs skip previews. Preview data is throwaway: never point a preview at the dev database. `.github/scripts/prepare-database.sh` prepares any database, for deploys and previews alike.
- **Secrets:** never commit them. Managed functions can't use Key Vault or managed identity, so the pipeline sets secrets as SWA app settings.

## Commands

```bash
npm install
npm run dev                      # web :5173 + API :7071 with in-memory sample data (no Azure needed)
npm run lint && npm run typecheck && npm test
npm run build                    # api bundle + web build
npx playwright test              # e2e against a local build (set PW_EXECUTABLE_PATH to use a system Chrome)
npm run test:db                  # migration + SQL repo tests; needs SQL Server via SQL_* env vars
npm run format                   # Prettier
```

Run lint, typecheck, unit tests, and build before pushing. CI runs all of the above plus DB tests in a SQL Server container. Once Azure is enabled, CI also runs a Bicep what-if, deploys a preview environment, and runs e2e against it.

## Git and PRs

- Branch from `main` (`feat/…`, `fix/…`) and open a PR. Never push to `main` directly; merging deploys to dev.
- Keep PRs to one increment or one concern. The description says what changed, what was verified, and what needs Matt.
- Tests accompany behavior changes, especially anything touching visibility, privacy, or moderation.

## Build increments

1. Foundation: read-only feed, gospel page, infra, CI/CD.
2. Submission + moderation queue + admin sign-in + transactional email (ACS), split into GitHub issues:
   - 2a: testimony submission, manage-link token (stored hashed), confirmation email, honeypot, rate limits.
   - 2b: moderator sign-in through Entra ID app roles (SWA custom provider) + moderation queue.
   - 2c: AI screening: Content Safety (crisis content goes to `needs_care`) and PII flagging via AI Language (flag only, no auto-redaction).
3. Prayer requests + "I'm praying" counter.
4. Launch hardening: Turnstile, OG tags/sitemap, privacy policy, statement of faith, alerts.

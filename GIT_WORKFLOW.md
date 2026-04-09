# Git & GitHub Workflow — Bord Cadre Films

Team reference for branching, commits, PRs, and CI/CD.

---

## Branch Model

```
main          ← production-ready, auto-deploys to bordcadrefilms.com
 └─ develop   ← integration branch, auto-deploys to staging
     └─ feat/*, fix/*, chore/*   ← short-lived feature/fix branches
```

| Branch | Purpose | Protected | Deploys to |
|---|---|---|---|
| `main` | Production release | Yes — PR only, CI must pass | bordcadrefilms.com |
| `develop` | Next release staging | Yes — PR only, CI must pass | staging.bordcadrefilms.com |
| `feat/*` | New features | No | — |
| `fix/*` | Bug fixes | No | — |
| `chore/*` | Tooling, deps, config | No | — |
| `docs/*` | Documentation only | No | — |

---

## Connecting to GitHub (first time)

```bash
# 1. Add remote (only once per machine)
git remote add origin https://github.com/memoways/bordcadrefilms-site.git

# 2. Verify
git remote -v

# 3. Push all existing branches
git push -u origin main
git push -u origin develop
```

**Authentication:** GitHub no longer accepts password auth. Use either:
- **HTTPS + Personal Access Token** — generate at github.com → Settings → Developer settings → Personal access tokens (classic). Scope: `repo`. Use token as password when prompted.
- **SSH key** — preferred for daily use. Generate: `ssh-keygen -t ed25519 -C "email@example.com"`, add public key to GitHub → Settings → SSH keys. Then change remote: `git remote set-url origin git@github.com:memoways/bordcadrefilms-site.git`

---

## Daily Development Flow

### 1. Start a new feature

```bash
# Always branch from develop, never from main
git checkout develop
git pull origin develop

git checkout -b feat/my-feature-name
# naming: feat/, fix/, chore/, docs/ + short kebab-case description
# examples: feat/news-detail-page, fix/film-card-image, chore/update-deps
```

### 2. Work on the branch

```bash
# Stage specific files — never blindly git add -A
git add app/components/MyComponent.tsx app/lib/myHelper.ts

# Commit with Conventional Commits format
git commit -m "feat(news): add news detail page with Airtable data"
```

### 3. Keep the branch up to date

```bash
# While working, sync with develop regularly to avoid large merge conflicts
git fetch origin
git rebase origin/develop   # preferred over merge — keeps history linear
```

### 4. Open a Pull Request

```bash
git push -u origin feat/my-feature-name
# Then open PR on GitHub: feat/my-feature-name → develop
```

### 5. After PR is merged — clean up

```bash
git checkout develop
git pull origin develop
git branch -d feat/my-feature-name          # delete local branch
git push origin --delete feat/my-feature-name  # delete remote branch
```

---

## Commit Message Format (Conventional Commits)

```
<type>(<scope>): <short description>

[optional body — the "why", not the "what"]

[optional footer — Co-Authored-By, Closes #123]
```

### Types

| Type | When to use |
|---|---|
| `feat` | New user-visible feature |
| `fix` | Bug fix |
| `refactor` | Code restructuring — no behavior change |
| `docs` | Documentation only |
| `chore` | Build, deps, config — no production code |
| `style` | Formatting, whitespace — no logic change |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `ci` | CI/CD workflow changes |

### Scope (optional but recommended)

Use when the change is clearly scoped: `feat(airtable):`, `fix(film-card):`, `chore(deps):`

### Examples

```bash
feat(directors): add director detail page with bio and filmography
fix(news): correct image aspect ratio on mobile carousel
refactor(airtable): extract firstString helper to shared utils
docs: update BEST_PRACTICES.md with image rules
chore(deps): bump next from 16.2.1 to 16.3.0
ci: update Node version to 22 in CI workflow
```

### Rules

- Subject line ≤ 72 characters
- Use imperative mood: "add feature" not "added feature"
- Body explains *why*, not *what* (git diff already shows what)
- Reference issue numbers in footer: `Closes #42`

---

## Pull Request Process

### PR title = commit subject line

Your PR title follows the same Conventional Commits format:
```
feat(sprint3): Airtable CMS tables and component bindings
```

### PR description

Fill in the [PR template](.github/PULL_REQUEST_TEMPLATE.md):
1. **Quoi** — one sentence summary
2. **Pourquoi** — link to Notion task or issue
3. **Comment tester** — testing steps
4. **Checklist** — all boxes must be checked before review

### PR targets

```
feat/* → develop     ← always
develop → main       ← sprint release, after staging validation
```

**Never open a PR directly from a feature branch to `main`.**

### Review process

1. Open PR — CI runs automatically (lint + type-check + build + e2e)
2. All CI checks must be green before review
3. At least one review approval required (CODEOWNERS enforces this)
4. Squash & merge preferred for feature branches — keeps `develop` history clean
5. Regular merge commit for `develop → main` — preserves sprint history

### Merge strategies

| PR type | Strategy | Why |
|---|---|---|
| `feat/*` → `develop` | Squash merge | One clean commit per feature on develop |
| `fix/*` → `develop` | Squash merge | Same |
| `develop` → `main` | Merge commit | Preserves sprint commit history on main |

---

## GitHub Actions CI/CD

### Workflows overview

| File | Triggers | Jobs | Purpose |
|---|---|---|---|
| `ci.yml` | PR to `main`/`develop`, push to `develop` | lint → type-check → build → e2e | Quality gate before merge |
| `deploy.yml` | Push to `main`/`develop`, manual dispatch | quality → deploy | Auto-deploy on merge |
| `security.yml` | Schedule + push | dependency audit | Security scanning |

### CI pipeline (`ci.yml`)

```
quality (lint + type-check)
    └─ build
         └─ e2e (Playwright)
```

- **Lint** — ESLint, runs in ~30s
- **Type-check** — `tsc --noEmit`, catches TypeScript errors
- **Build** — `next build` with real Airtable secrets from GitHub Secrets
- **E2E** — Playwright against the built app, uploads report on failure

**Required GitHub Secrets** (set at repo level → Settings → Secrets):

| Secret | Description |
|---|---|
| `AIRTABLE_API_KEY` | Airtable personal access token |
| `AIRTABLE_BASE_ID` | Airtable base ID (`appXXXXXXXX`) |
| `AIRTABLE_TABLE_NAME` | Main films table name |
| `AIRTABLE_VIEW_NAME` | Active view name |

### Deploy pipeline (`deploy.yml`)

```
push to develop → staging deploy (Coolify webhook)
push to main    → production deploy (Coolify webhook)
```

Both go through a full quality check (lint + type-check + build) before triggering the deploy webhook.

**Manual deploy**: Go to GitHub Actions → Deploy → Run workflow → choose environment.

**Required secrets for deploy:**

| Secret | Description |
|---|---|
| `COOLIFY_WEBHOOK_URL` | Production deploy webhook |
| `COOLIFY_WEBHOOK_TOKEN` | Production webhook auth token |
| `COOLIFY_STAGING_WEBHOOK_URL` | Staging deploy webhook |
| `COOLIFY_STAGING_WEBHOOK_TOKEN` | Staging webhook auth token |

### Reading CI results

- Green ✅ on PR = safe to merge
- Red ❌ = fix the failing job before requesting review
- Check the **Annotations** tab in the job for lint/type errors
- E2E failures automatically upload a `playwright-report` artifact (7-day retention)

---

## Active Branches

| Branch | Status | Description |
|---|---|---|
| `main` | Protected | Production — Sprint 1 |
| `develop` | Protected | Staging — Sprint 1 + Sprint 2 |
| `feat/sprint3-airtable-cms-tables` | Active | Sprint 3 — Airtable table bindings |

---

## Sprint 3 Branch: `feat/sprint3-airtable-cms-tables`

**Goal:** Wire remaining Airtable tables to their consuming components. Fill gaps in the data layer so every CMS-managed section of the site reflects live Airtable content.

**Planned work:**

- [ ] Map remaining Airtable tables: `HomeAbout`, `BCFNumbers`, `News`, `HeroVideo`, `Team`, `FestivalPhotos`
- [ ] Verify field names match `app/lib/*.ts` helpers — update mappers where names drifted
- [ ] Remove any remaining internal API fetch calls from Server Components (use lib directly)
- [ ] Add or update ISR `revalidate` tags per table
- [ ] Wire `app/api/` routes to be used only for external webhooks / on-demand revalidation
- [ ] Add Airtable schema snapshot to comments in each lib file so field names are discoverable
- [ ] Test each page section against live Airtable data in staging

**Branch start point:** `develop` (at `d10b42e`)

```bash
# Get started
git checkout feat/sprint3-airtable-cms-tables
npm run dev
```

---

## Hotfix Process (production bug)

If a bug is found in production after a release:

```bash
# Branch from main, not develop
git checkout main
git checkout -b fix/critical-bug-description

# Fix the bug
git add ...
git commit -m "fix: correct film slug generation for special characters"

# PR: fix/... → main  (fast review, deploy to prod)
# After merge to main, also merge main back into develop:
git checkout develop
git merge main
git push origin develop
```

---

## What NOT to do

- Never commit directly to `main` or `develop`
- Never force-push to `main` or `develop`
- Never use `git add -A` or `git add .` without reviewing what's included
- Never commit `.env` files or API keys
- Never skip CI by closing/reopening a PR — fix the root cause
- Never use `--no-verify` to skip pre-commit hooks

# Git Workflow — Bord Cadre Films

## Infrastructure

| Branch           | Deploy target                     | Purpose                                                   |
|------------------|-----------------------------------|-----------------------------------------------------------|
| `test/vercel-ci` | **Vercel preview**                | Fast visual validation — preview URL sharable, zero risk  |
| `develop`        | **Coolify staging** *(to wire)*   | Integration branch — staging on real infra                |
| `main`           | **Coolify production** *(to wire)*| Live site at bordcadrefilms.com                           |

> **Why test on Vercel first?**
> Vercel deploys in seconds, generates a shareable URL, completely isolated from production.
> It's the cheap safety net — validate visually before touching Coolify.
>
> Vercel is **test-only** — `develop` and `main` are both served by Coolify.
> `deploy.yml` has commented-out Coolify jobs ready to uncomment when infra is wired.

---

## Branch Diagram

```
feature/*  ──PR──►  test/vercel-ci  ──PR──►  develop  ──PR──►  main
                          │                      │                │
                    Vercel preview        Coolify staging   Coolify prod
                    (CI + visual QA)      (to wire)         (to wire)
```

## Persistent Branches

| Branch           | Protection                        |
|------------------|-----------------------------------|
| `main`           | 1 approval + CI required          |
| `develop`        | 1 approval + CI required          |
| `test/vercel-ci` | CI required (no approval needed)  |

---

## Branch Naming

```
feature/<short-description>   # new feature or CMS work
fix/<short-description>       # bug fix (non-urgent)
chore/<short-description>     # deps, config, tooling
hotfix/<short-description>    # urgent production fix only
```

Slugs: lowercase, hyphens only, max 40 chars.
Example: `feature/film-detail-page`, `fix/hero-video-fallback`

---

## Step-by-Step Rules

### 1. Start a feature
```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-feature
```

### 2. PR → `test/vercel-ci` (Vercel validation)
- CI runs: lint → type-check → build → E2E Playwright
- Vercel deploys a preview URL automatically on push
- **Developer validates** the preview URL: all routes, mobile (320px / 768px), empty states, loading states
- No human approval required — CI pass + dev sign-off is enough
- Merge, then delete the feature branch

> ⚠️ `test/vercel-ci` is a shared validation branch. Reset it to `develop` at the start
> of each new feature cycle to avoid drift:
> ```bash
> git checkout test/vercel-ci
> git reset --hard origin/develop
> git push origin test/vercel-ci --force-with-lease
> ```

### 3. PR → `develop` (Coolify staging)
- CI reruns: lint → type-check → build → E2E
- 1 human approval required
- On merge → Coolify staging deploys automatically from `develop`
- **Reviewer validates on Coolify staging**: env vars, ISR revalidation, Airtable data, Clerk auth, real server behaviour

### 4. PR → `main` (Coolify production)
- CI reruns: lint → type-check → build → E2E
- 1 human approval required
- Checklist must include: ✅ staging validated on Coolify
- On merge → Coolify production deploys automatically from `main`

---

## CI Checks by Step

| Step                        | Lint | Type-check | Build | E2E  | Deploy                      |
|-----------------------------|------|------------|-------|------|-----------------------------|
| PR → `test/vercel-ci`       | ✅   | ✅         | ✅    | ✅   | Vercel preview (auto)       |
| PR → `develop`              | ✅   | ✅         | ✅    | ✅   | Coolify staging (on merge)  |
| PR → `main`                 | ✅   | ✅         | ✅    | ✅   | Coolify prod (on merge)     |

---

## Who Validates What

| Gate                          | CI       | Developer       | Reviewer       |
|-------------------------------|----------|-----------------|----------------|
| `feature/*` → `test/vercel-ci`| required | visual QA Vercel| not required   |
| `test/vercel-ci` → `develop`  | required | —               | 1 approval     |
| `develop` → `main`            | required | QA on Coolify   | 1 approval     |

---

## Hotfix Process

For urgent production bugs only (do not use for features):

```bash
git checkout main
git pull origin main
git checkout -b hotfix/my-fix
# fix, commit, push
```

1. Open PR directly into `main` — CI required, 1 approval
2. Merge → Coolify production deploys
3. **Immediately** open a second PR from `main` → `develop` to sync
4. Delete the hotfix branch

---

## Notes

- Never push directly to `main` or `develop` — always via PR
- Dependabot PRs target `develop` automatically
- Vercel secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) are required in GitHub Secrets for the deploy workflow
- Coolify deploy is triggered via webhook on push to `develop` and `main`

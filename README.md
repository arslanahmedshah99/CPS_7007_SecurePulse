# SecurePulse

An AI-augmented DevSecOps dashboard that unifies SAST, DAST, and SCA security
scanning, and can turn findings straight into a reviewable GitHub pull
request with an AI-generated fix.

> MSc Computer Science Dissertation — St Mary's University, London (CPS7007)

---

## Contents

- [What it does](#what-it-does)
- [How it fits together](#how-it-fits-together)
- [Prerequisites](#prerequisites)
- [Install](#install)
- [Run](#run)
- [Using the dashboard](#using-the-dashboard)
- [Running the real CI pipeline](#running-the-real-ci-pipeline-optional)
- [Cleaning up / uninstalling](#cleaning-up--uninstalling)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Security notice](#security-notice)
- [Dissertation](#dissertation)

---

## What it does

- Runs **Semgrep** (SAST), **OWASP ZAP** (DAST), and **OWASP Dependency-Check**
  (SCA) — either locally with one command, or automatically on every GitHub
  Actions push
- Aggregates findings from all three scanners into a single **React
  dashboard** (dark theme)
- Uses the **Claude API** to generate a specific, codebase-aware explanation
  and fix for each finding
- Lets you queue findings and click **Create Pull Request** — SecurePulse
  fetches the real file from GitHub, asks Claude for the corrected version,
  and opens an actual PR for you to review (never auto-merged)
- Runs entirely locally via **Docker Compose** — no cloud infrastructure
  required for local use

---

## How it fits together

```
┌──────────────┐      findings       ┌──────────────┐      ┌──────────────┐
│  Scanners     │ ──────────────────▶ │   Backend    │◀────▶│  PostgreSQL  │
│  Semgrep      │   POST /api/scans/* │ (Express)    │      └──────────────┘
│  ZAP          │                     │              │
│  Dependency-  │                     │  - Claude API│──▶ AI remediation
│  Check        │                     │  - GitHub API│──▶ fix pull requests
└──────────────┘                     └──────┬───────┘
                                             │
                                      ┌──────▼───────┐
                                      │  Frontend    │
                                      │  (React)     │  http://localhost:3000
                                      └──────────────┘
```

Two ways to get scanner data into the backend:

1. **`scripts/run-scans.sh`** — runs the real scanners locally against this
   repo and the target apps, posts real results. This is the recommended
   path for day-to-day use.
2. **`.github/workflows/securepulse.yml`** — runs the same three scanners
   inside GitHub Actions on every push, and posts results to your backend
   over an ngrok tunnel. See [Running the real CI pipeline](#running-the-real-ci-pipeline-optional).

`target-apps/` holds two **deliberately vulnerable** apps that exist purely
as scan targets — see [Security notice](#security-notice).

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Semgrep](https://semgrep.dev/) on your PATH for local SAST scans:
  `brew install semgrep`
- Node.js 20+ (only if you want to run a target app outside Docker)
- An [Anthropic API key](https://console.anthropic.com/) — pay-as-you-go;
  a new account's starter credit comfortably covers normal use, since
  remediation is generated on demand and cached, not batch-generated
- A free [NVD API key](https://nvd.nist.gov/developers/api-key-requested) —
  without one, Dependency-Check's first database sync can take hours instead
  of minutes
- A fine-grained [GitHub personal access token](https://github.com/settings/personal-access-tokens/new),
  scoped to **this repo only**, with **Contents: read and write** and
  **Pull requests: read and write** — needed only for the auto-fix PR feature

---

## Install

```bash
git clone https://github.com/arslanahmedshah99/CPS_7007_SecurePulse.git
cd CPS_7007_SecurePulse
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Where to get it |
|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com/) |
| `NVD_API_KEY` | [nvd.nist.gov/developers/api-key-requested](https://nvd.nist.gov/developers/api-key-requested) |
| `GITHUB_TOKEN` | A fine-grained PAT as described above |
| `GITHUB_OWNER` / `GITHUB_REPO` | Your fork's owner/name, e.g. `arslanahmedshah99` / `CPS_7007_SecurePulse` |
| `SECUREPULSE_API_KEY` | Any string you choose — a shared secret between the scanners and the backend |

Everything else in `.env.example` (Postgres credentials, ports) has a
working default for local use.

---

## Run

### Recommended: one command, real scans, always a clean slate

```bash
bash scripts/run-scans.sh
```

This resets the stack (wipes and rebuilds so results never pile up across
runs), starts it, then runs Semgrep, Dependency-Check, and a ZAP baseline
scan for real and posts the results, no manual `curl` commands needed. A
missing scanner is skipped with a clear message rather than failing the
whole run. The dashboard is left running afterward.

The first Dependency-Check run does a one-time NVD database sync (fast with
`NVD_API_KEY` set, cached afterward in `.cache/dependency-check-data/`).

### Just the dashboard, no scanning

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). The dashboard will be
empty until something posts scan results to it.

---

## Using the dashboard

- Click any finding row to expand it — generates a real, cached AI
  remediation explanation
- Click **Add to fix queue** on a finding you want fixed
- Click the git-branch button (bottom-right) to open the queue
- Click **Create Pull Request** — SecurePulse fetches the real file from
  GitHub, asks Claude for the corrected version, commits it to a new branch,
  and opens a PR. **Always review before merging** — it's never auto-merged

---

## Running the real CI pipeline (optional)

The GitHub Actions workflow (`.github/workflows/securepulse.yml`) runs the
same three scanners on every push and posts results to your **local**
backend over ngrok — more involved than the script above, and only needed
if you specifically want to see the pipeline run in GitHub Actions.

```bash
ngrok http 3001
```

1. Copy the printed `https://...ngrok...` URL
2. In your GitHub repo, add these as **Actions secrets**: `NGROK_URL` (the
   URL you just copied), `SECUREPULSE_API_KEY` (matching your `.env`),
   `NVD_API_KEY`
3. Make sure `docker compose up` is running locally at the same time
4. Push, or trigger the workflow manually from the Actions tab

`NGROK_URL` changes every time you restart ngrok (unless you're on their
paid static-domain plan) — update the secret each time before a real run.

There's a fourth secret, `SEMGREP_APP_TOKEN`, referenced in the workflow —
it's optional and only needed if you also want results uploaded to
Semgrep's own cloud dashboard (a separate product). The data that reaches
*this* dashboard doesn't depend on it.

---

## Cleaning up / uninstalling

| Goal | Command |
|---|---|
| Stop the stack, keep data | `docker compose down` |
| Stop the stack, wipe all findings/data | `docker compose down -v` |
| Also remove the built Docker images | `docker compose down -v --rmi all` |
| Clear the cached NVD database | `rm -rf .cache/` |
| Remove installed dependencies | `rm -rf backend/node_modules frontend/node_modules target-apps/*/node_modules target-apps/*/*/node_modules` |

`scripts/run-scans.sh` already runs `docker compose down -v` at the start of
every run, so you never need to clean up manually between scans.

---

## Environment variables

Full reference — see `.env.example` for the working defaults.

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key, used for AI remediation and fix generation |
| `NVD_API_KEY` | Free NIST key, speeds up Dependency-Check's CVE database sync |
| `GITHUB_TOKEN` | Fine-grained PAT for the auto-fix pull request feature |
| `GITHUB_OWNER` / `GITHUB_REPO` | Repo the fix PRs are opened against |
| `SECUREPULSE_API_KEY` | Shared secret the ingest endpoints check for (`x-api-key` header) |
| `NGROK_URL` | Only needed for a real GitHub Actions run — see above |
| `POSTGRES_HOST/PORT/DB/USER/PASSWORD` | Postgres connection — defaults work for local Docker use |
| `PORT` | Backend port (default `3001`) |
| `NODE_ENV` | `development` or `production` |
| `VITE_API_URL` | Backend URL the frontend calls (default `http://localhost:3001`) |

---

## Project structure

```
CPS_7007_SecurePulse/
├── backend/                     Express API
│   ├── Dockerfile
│   └── src/
│       ├── index.js             App entry point
│       ├── db.js                PostgreSQL connection
│       ├── db/schema.sql        Tables: projects, scan_runs, findings, remediations, queued_fixes
│       ├── routes/
│       │   ├── scans.js         Ingest + read endpoints for SAST/DAST/SCA results
│       │   └── fixes.js         Fix-queue CRUD + PR creation endpoint
│       └── services/
│           ├── remediation.js   Claude API calls (explanation + file fix generation)
│           └── github.js        GitHub API calls (branch, commit, PR)
│
├── frontend/                    React dashboard (Vite + Tailwind + Recharts)
│   ├── Dockerfile
│   └── src/
│       ├── App.jsx
│       ├── components/          SeverityCards, ScannerChart, ScanRunsList, FindingsTable,
│       │                        FindingsFilters, FixQueue, RemediationMarkdown, Icons, Skeleton
│       └── lib/                 severity.js (color/icon mappings), time.js
│
├── target-apps/                 Deliberately vulnerable scan targets - see Security notice
│   ├── app1-nodejs-api/         SQL injection, hardcoded secret, outdated deps (SAST + SCA target)
│   └── app2-react-node/         XSS, no rate limiting, missing headers, open CORS (DAST target)
│
├── scripts/
│   └── run-scans.sh             One-command: reset stack, run real scanners, post results
│
├── .github/workflows/
│   └── securepulse.yml          CI pipeline: same three scanners, posts to backend via ngrok
│
├── .zap/rules.tsv                ZAP baseline scan rule configuration
├── docker-compose.yml            Brings up db + backend + frontend
├── .env.example                  Template for required environment variables
└── README.md
```

---

## Security notice

The applications in `target-apps/` are **intentionally vulnerable**. They
exist solely for security scanning research. Never deploy them to a public
server — run them only in the isolated local environment provided here.

The fix-queue feature opens real pull requests but never merges them
automatically — always review AI-generated code changes before merging.

This tool is intended for use only against systems you own or have explicit
written permission to test, in compliance with the Computer Misuse Act 1990
(UK) and equivalent legislation.

---

## Dissertation

- **Title:** SecurePulse: An AI-Augmented DevSecOps Dashboard for Automated Security Testing of Web Applications via GitHub Actions
- **Author:** Arslan Ahmed Shah
- **Institution:** St Mary's University, London
- **Programme:** MSc Computer Science (CPS7007)
- **Submission:** Sept 2026

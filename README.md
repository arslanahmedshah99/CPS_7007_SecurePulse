# SecurePulse

An open-source, AI-augmented DevSecOps dashboard that unifies SAST, DAST, and SCA security scanning within GitHub Actions pipelines and uses the Claude API to generate contextual vulnerability remediation guidance.

> MSc Computer Science Dissertation — St Mary's University, London (CPS7007)

---

## What it does

- Triggers **Semgrep** (SAST), **OWASP ZAP** (DAST), and **OWASP Dependency-Check** (SCA) automatically on every GitHub Actions push
- Aggregates findings from all three scanners into a single **React dashboard**
- Uses the **Claude API** to generate specific, codebase-aware fix suggestions for each vulnerability
- Runs entirely locally via **Docker Compose** — no cloud infrastructure required

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Mac, Windows, or Linux)
- [ngrok](https://ngrok.com/) account and CLI 
- A [GitHub](https://github.com) account
- An [Anthropic API key](https://console.anthropic.com/)

---

## Quick start

```bash
# 1. Clone the repo
git clone https://github.com/arslanahmedshah99/CPS_7007_SecurePulse.git
cd CPS_7007_SecurePulse

# 2. Copy the example env file and fill in your keys
cp .env.example .env

# 3. Start ngrok to expose your local backend
ngrok http 3001

# 4. Copy the ngrok URL into your .env file (NGROK_URL)

# 5. Start the full stack
docker compose up --build

# 6. Open the dashboard
open http://localhost:3000
```

---

## Project structure

```
securepulse/
├── backend/              Express API — receives scan results, stores in PostgreSQL, calls Claude API
├── frontend/             React dashboard — unified findings view with AI remediation
├── target-apps/
│   ├── app1-nodejs-api/  Deliberately vulnerable Node.js REST API (SAST + SCA target)
│   └── app2-react-node/  Deliberately vulnerable React + Node web app (DAST target)
├── .github/
│   └── workflows/        GitHub Actions workflow — triggers all three scanners
└── docker-compose.yml    Brings up the full local stack
```

---

## Environment variables

See `.env.example` for all required variables.

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Claude API key from console.anthropic.com |
| `NGROK_URL` | Your ngrok public URL (e.g. https://abc123.ngrok.io) |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `SECUREPULSE_API_KEY` | Secret key to authenticate GitHub Actions POST requests |

---

## Security notice

The target applications in `target-apps/` are **intentionally vulnerable**. They exist solely for security scanning research. Never deploy them to a public server. Run them only in the isolated local Docker environment provided.

This tool is intended for use only against systems you own or have explicit written permission to test, in compliance with the Computer Misuse Act 1990 (UK) and equivalent legislation.

---

## Dissertation

- **Title:** SecurePulse: An AI-Augmented DevSecOps Dashboard for Automated Security Testing of Web Applications via GitHub Actions
- **Author:** Arslan Ahmed Shah
- **Institution:** St Mary's University, London
- **Programme:** MSc Computer Science (CPS7007)
- **Submission:** Sept 2026

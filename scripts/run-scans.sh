set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
API_KEY="${SECUREPULSE_API_KEY:-dev-test-key}"
DC_CACHE_DIR="$REPO_ROOT/.cache/dependency-check-data"
TMP_DIR="$(mktemp -d)"

APP2_BACKEND_PID=""
APP2_FRONTEND_PID=""

cleanup() {
  if [ -n "$APP2_BACKEND_PID" ]; then
    echo "Stopping app2 backend (PID $APP2_BACKEND_PID, started by this script)"
    kill "$APP2_BACKEND_PID" 2>/dev/null || true
  fi
  if [ -n "$APP2_FRONTEND_PID" ]; then
    echo "Stopping app2 frontend (PID $APP2_FRONTEND_PID, started by this script)"
    kill "$APP2_FRONTEND_PID" 2>/dev/null || true
  fi
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

post_results() {
  local endpoint="$1" file="$2" label="$3"
  if [ ! -s "$file" ]; then
    echo "  no $label output to post"
    return
  fi
  local response
  response=$(curl -s -X POST "$BACKEND_URL/api/scans/$endpoint" \
    -H "Content-Type: application/json" -H "x-api-key: $API_KEY" --data @"$file")
  local count
  count=$(python3 -c "import json,sys; print(json.loads(sys.argv[1]).get('findingCount','?'))" "$response" 2>/dev/null || echo "?")
  echo "  -> posted, $count findings ingested"
}

echo "== Resetting the stack for a clean run =="

docker compose down -v 2>/dev/null || true
docker compose up --build -d
echo "  waiting for backend to be ready..."
for i in $(seq 1 60); do
  curl -sf "$BACKEND_URL/health" > /dev/null 2>&1 && break
  sleep 2
done
if ! curl -sf "$BACKEND_URL/health" > /dev/null 2>&1; then
  echo "Backend still not reachable after starting docker compose."
  echo "Check what's wrong: docker compose logs backend"
  exit 1
fi
echo "Backend OK"

# SAST: Semgrep 
echo
echo "== SAST: Semgrep =="
if command -v semgrep >/dev/null 2>&1; then
  semgrep scan \
    --config p/javascript --config p/nodejs --config p/owasp-top-ten --config p/secrets \
    --json --output "$TMP_DIR/semgrep-results.json" --no-git-ignore --exclude node_modules --quiet
  post_results sast "$TMP_DIR/semgrep-results.json" Semgrep
else
  echo "  semgrep not installed, skipping (brew install semgrep)"
fi

# SCA: OWASP Dependency-Check (against app1)
echo
echo "== SCA: OWASP Dependency-Check (app1-nodejs-api) =="
if [ ! -d "target-apps/app1-nodejs-api/node_modules" ]; then
  echo "  installing app1 dependencies..."
  (cd target-apps/app1-nodejs-api && npm install --silent)
fi
if docker image inspect owasp/dependency-check:latest >/dev/null 2>&1; then
  mkdir -p "$DC_CACHE_DIR" "$TMP_DIR/dc-report"
  NVD_ARGS=()
  [ -n "${NVD_API_KEY:-}" ] && [ "${NVD_API_KEY}" != "xx" ] && NVD_ARGS=(--nvdApiKey "$NVD_API_KEY")
  docker run --rm \
    -v "$REPO_ROOT:/repo:ro" \
    -v "$TMP_DIR/dc-report:/report" \
    -v "$DC_CACHE_DIR:/usr/share/dependency-check/data" \
    owasp/dependency-check:latest \
    --scan /repo/target-apps/app1-nodejs-api --format JSON --out /report --project app1-nodejs-api \
    "${NVD_ARGS[@]}" --enableExperimental
  post_results sca "$TMP_DIR/dc-report/dependency-check-report.json" Dependency-Check
else
  echo "  owasp/dependency-check image not found, skipping (docker pull owasp/dependency-check:latest)"
fi

# DAST: OWASP ZAP baseline (against app2)
echo
echo "== DAST: OWASP ZAP baseline (app2-react-node) =="
if ! curl -sf http://localhost:4002/health >/dev/null 2>&1; then
  [ -d "target-apps/app2-react-node/backend/node_modules" ] || (cd target-apps/app2-react-node/backend && npm install --silent)
  echo "  starting app2 backend..."
  (cd target-apps/app2-react-node/backend && PORT=4002 nohup npm start > "$TMP_DIR/app2-backend.log" 2>&1 & echo $! > "$TMP_DIR/app2-backend.pid")
  sleep 1
  APP2_BACKEND_PID=$(cat "$TMP_DIR/app2-backend.pid" 2>/dev/null || echo "")
fi
if ! curl -sf http://localhost:4003 >/dev/null 2>&1; then
  [ -d "target-apps/app2-react-node/frontend/node_modules" ] || (cd target-apps/app2-react-node/frontend && npm install --silent)
  echo "  starting app2 frontend..."
  (cd target-apps/app2-react-node/frontend && VITE_API_URL=http://localhost:4002 nohup npm run dev -- --host 0.0.0.0 --port 4003 > "$TMP_DIR/app2-frontend.log" 2>&1 & echo $! > "$TMP_DIR/app2-frontend.pid")
  sleep 1
  APP2_FRONTEND_PID=$(cat "$TMP_DIR/app2-frontend.pid" 2>/dev/null || echo "")
fi
echo "  waiting for app2 to be ready..."
for i in $(seq 1 15); do
  curl -sf http://localhost:4002/health >/dev/null 2>&1 && curl -sf http://localhost:4003 >/dev/null 2>&1 && break
  sleep 1
done

if docker image inspect ghcr.io/zaproxy/zaproxy:stable >/dev/null 2>&1; then
  mkdir -p "$TMP_DIR/zap-work"
  cp .zap/rules.tsv "$TMP_DIR/zap-work/"
  ZAP_CONTAINER="securepulse-zap-$$"
  docker run --rm --name "$ZAP_CONTAINER" -v "$TMP_DIR/zap-work:/zap/wrk/:rw" ghcr.io/zaproxy/zaproxy:stable \
    zap-baseline.py -t http://host.docker.internal:4003 -c rules.tsv -J zap-results.json -I -T 3 &
  ZAP_PID=$!
  ZAP_WAITED=0
  ZAP_TIMEOUT=240
  while kill -0 "$ZAP_PID" 2>/dev/null; do
    sleep 5
    ZAP_WAITED=$((ZAP_WAITED + 5))
    if [ "$ZAP_WAITED" -ge "$ZAP_TIMEOUT" ]; then
      echo "  ZAP scan exceeded ${ZAP_TIMEOUT}s (likely stuck on its own addon-update check) - stopping it"
      docker kill "$ZAP_CONTAINER" >/dev/null 2>&1 || true
      break
    fi
  done
  wait "$ZAP_PID" 2>/dev/null || true
  post_results dast "$TMP_DIR/zap-work/zap-results.json" ZAP
else
  echo "  ZAP image not found, skipping (docker pull ghcr.io/zaproxy/zaproxy:stable)"
fi

echo
echo "Done. Dashboard: http://localhost:3000"

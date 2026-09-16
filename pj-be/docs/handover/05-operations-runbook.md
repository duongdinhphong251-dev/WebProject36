# 05 — Operations Runbook

Day-to-day tasks for teams operating **tuoi-be** in staging (VM) and production (GCP).

---

## Quick reference

| Task | Where |
|------|--------|
| Deploy VM | Push / merge to **`main`** → GitLab pipeline |
| Deploy prod API | Push / merge to **`release`** → GitLab pipeline |
| Prod logs | GCP Console → Cloud Run → `prod-backend` → **Logs** |
| VM logs | `ssh` → `docker logs backend` |
| API docs | `https://<host>/api/docs` |
| DB credentials | Secret Manager / VM `~/app/.env` (not in git) |
| Re-run IAM | `./scripts/gcp-prod-iam-grants.sh` |

---

## Deployments

### Production (GCP)

1. Ensure changes are on branch **`release`**.  
2. Open GitLab → **CI/CD → Pipelines** for `tuoi-be`.  
3. Confirm jobs **`build:release_gcp`** and **`deploy:prod_gcp`** pass (green).  
4. In GCP Console → Cloud Run → `prod-backend` → check **Latest revision** time and traffic 100%.  
5. Smoke test (see [Health checks](#health-checks)).

**Rollback:** Cloud Run → **Revisions** → route traffic to previous revision, or redeploy an older image tag:

```bash
gcloud run deploy prod-backend \
  --project services-project-490810 \
  --region asia-southeast1 \
  --image asia-southeast1-docker.pkg.dev/services-project-490810/prod-containers/prod-be-api:<previous-sha>
```

### VM (integration)

1. Merge to **`main`**.  
2. Pipeline runs **`build:main`** then **`deploy:vm`**.  
3. SSH to VM and verify container:

```bash
docker ps
docker logs backend --tail 100
curl -sS http://127.0.0.1:3000/api/docs -o /dev/null -w "%{http_code}\n"
```

---

## Health checks

No dedicated health endpoint is implemented. Recommended checks:

| Check | Command / URL |
|-------|----------------|
| Swagger UI | `GET /api/docs` → expect `200` |
| Services list | `GET /api/v1/services` → JSON `{ "data": ... }` |
| Deals (light) | `GET /api/v1/deals?page=1&limit=1` |
| Page resolve | `GET /api/v1/pages/resolve?url=/vi/ho-chi-minh&locale=vi` (adjust URL) |

Example:

```bash
API=https://api.glowexplore.com   # or http://VM_IP:3000
curl -fsS "$API/api/v1/services" | jq '.data | length'
```

---

## Logs

### Cloud Run (production)

**Console**

1. [Cloud Run](https://console.cloud.google.com/run?project=services-project-490810)  
2. Service **`prod-backend`** → **Logs** tab  
3. Filter by severity, revision, or text search (`error`, `Database pool error`, etc.)

**gcloud CLI**

```bash
gcloud run services logs read prod-backend \
  --project=services-project-490810 \
  --region=asia-southeast1 \
  --limit=100
```

**Live tail**

```bash
gcloud beta run services logs tail prod-backend \
  --project=services-project-490810 \
  --region=asia-southeast1
```

**What to look for**

| Log / symptom | Meaning |
|---------------|---------|
| `Database connected` | Pool connected on startup |
| `Database pool error` | Network/auth/DB down |
| HTTP `503` + message about database | Often connection timeout or Postgres `53300` |
| `API_PROFILE=1` in env | Extra debug timings in deals/pages (dev/staging only) |

### VM (Docker)

```bash
ssh $VM_USER@$VM_HOST
docker logs backend -f --tail 200
```

Container name is **`backend`** per `docker-compose.yml`.

### GitLab CI

Failed deploy: open job log for **`deploy:vm`** (SSH errors) or **`deploy:prod_gcp`** (gcloud / secrets / manifest).

---

## Common incidents

### API returns 500 / hangs (database)

1. Confirm `DB_HOST` / port in Secret Manager (prod) or VM `.env` — wrong IP causes **timeouts**.  
2. Test from a machine allowed by firewall:

```bash
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1"
```

3. Check Postgres `max_connections` and active count.

### PostgreSQL `53300` (too many connections)

- Symptom: API `503`, filter maps PG code `53300`.  
- Mitigation: lower **`DB_POOL_MAX`**, reduce Cloud Run **`max-instances`**, fix connection leaks, or raise DB limit.  
- Formula: `instances × DB_POOL_MAX` + overhead < `max_connections`.

### GitLab runner / Docker build fails

- Error connecting to `docker:2375` → runner should use **host socket**, not DinD.  
- See `scripts/gitlab-runner-vm-docker.toml.example` and `DOCKER_HOST` in `.gitlab-ci.yml`.

### Pipeline has 0 jobs on feature branch

- By design only **`main`** and **`release`** run jobs. Merge to those branches or extend CI `rules`.

### Missing GCP key in `release` pipeline

- Set `GCP_PROD_SA_KEY_B64` on backend GitLab project.  
- Match **Protected** flag with protected `release` branch.  
- Environment scope `*` or `production-gcp`.

### Signed image URLs expired

- Default TTL **72 hours** (`SIGNED_URL_TTL_SECONDS=259200`).  
- Clients should refresh spa detail; increase TTL only if business accepts longer exposure.

### Cloudflare / TLS issues on `api.glowexplore.com`

1. `dig api.glowexplore.com` — records match `gcp-prod-domain-mapping.sh describe`.  
2. Try **DNS only** (grey cloud) on API record.  
3. Confirm domain verified: `gcloud domains list-user-verified`.

---

## Configuration changes (production)

| Change | Steps |
|--------|--------|
| New env var from secret | Create SM secret → manifest line → IAM grant → deploy `release` |
| Non-secret env | Add to `deploy:prod_gcp` `--set-env-vars` or use SM |
| Pool size | Update secret or env `DB_POOL_MAX`; redeploy |
| Domain | `scripts/gcp-prod-domain-mapping.sh` + Cloudflare |

---

## Local development

```bash
cp .env.example .env
# Fill DB_* and optional GCS / Maps keys
npm install
npm run start:dev
```

Swagger: `http://localhost:3000/api/docs`

**Debug:**

```bash
API_PROFILE=1 npm run start:dev      # timing logs
PHOTO_VERBOSE=1 npm run start:dev    # photo cache verbose
```

---

## Useful scripts (repo `scripts/`)

| Script | Purpose |
|--------|---------|
| `gcp-prod-iam-grants.sh` | IAM for CI/runtime SAs, secrets, GCS |
| `gcp-prod-domain-mapping.sh` | Create/describe/delete Cloud Run domain mappings |
| `cloud-sql-vm-to-cloudsql.sh` | Optional DB migration to Cloud SQL |
| `gitlab-runner-vm-docker.toml.example` | Self-hosted runner Docker socket config |

---

## Handover checklist for new team

- [ ] GitLab access to `glowexplore.com/tuoi-be` (Maintainer for CI variables)  
- [ ] GCP project `services-project-490810` (Viewer + Cloud Run Admin as needed)  
- [ ] Cloudflare access for `glowexplore.com` DNS  
- [ ] Secret Manager values documented in secure vault (not in git)  
- [ ] VM SSH key and `~/app/.env` ownership  
- [ ] GitLab group runner `vm-docker` documented and monitored  
- [ ] Read [01-overview](./01-overview.md) → [04-production](./04-production-gcp-and-cloudflare.md)  
- [ ] Run smoke tests against prod API after first deploy  

---

[← Back to index](./README.md)

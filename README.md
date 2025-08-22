# 🚀 Microservices Starter Kit (Node+Mongo, FastAPI+Postgres, Go+Postgres, React) with Docker, Kubernetes, Prometheus & Grafana

This repository provides a **ready-to-use microservices architecture** with a modern stack:

* **Node.js API** — Users service (**Node.js + MongoDB**)
* **FastAPI API** — Items service (**FastAPI + PostgreSQL**)
* **Go API** — Products service (**Go + PostgreSQL**)
* **React Frontend** — Vite + React app consuming all APIs
* **Monitoring & Observability** — Prometheus, Grafana, Loki, LGTM stack

Infrastructure is included to run **locally with Docker Compose** or in **Kubernetes**.
---

## 🗂 Project Structure

```
infra/k8s/         # Kubernetes manifests
api-node/          # Node.js + MongoDB service
api-python/        # FastAPI + Postgres service
api-go/            # Go + Postgres service
frontend/          # React frontend (Vite)
```

---

## 🐳 Running Locally with Docker Compose

### Start (Build & Run)

```bash
make docker-up
```

Development mode:

```bash
docker compose -f docker-compose-dev.yml up --build
```

### Stop

```bash
make docker-down
```

### Verify Endpoints

```bash
# Node.js API
curl http://localhost:4005/health  

# FastAPI API
curl http://localhost:5005/health  

# Go API
curl http://localhost:7005/health  

# React frontend
open http://localhost:5173
```

---

## 📦 Sample API Requests

**Node.js (Users):**

```bash
curl -X POST http://localhost:4005/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}'
```

**FastAPI (Items):**

```bash
curl -X POST http://localhost:5005/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Sample Item"}'
```

**Go (Products):**

```bash
curl -X POST http://localhost:7005/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Widget"}'
```

---

## ✅ Health Check Endpoints

* **Node.js API** → `GET /health` (port **4005**)
* **FastAPI API** → `GET /health` (port **5005**)
* **Go API** → `GET /health` (port **7005**)
* **React Frontend** → `http://localhost:5173`

---

## ☸️ Running on Kubernetes

### Deploy

```bash
make k8s-live
```

### Example Requests

```bash
# Node.js (Users)
curl -X POST http://127.0.0.1.nip.io:8085/api-node/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}'

# FastAPI (Items)
curl -X POST http://127.0.0.1.nip.io:8085/api-python/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Sample Item"}'

# Go (Products)
curl -X POST http://127.0.0.1.nip.io:8085/api-go/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Widget"}'

# React frontend
open http://127.0.0.1.nip.io:8085
```

---

## 📈 Load Testing

Run parallel API load tests using **Autocannon**:

```bash
make load-test
```

---

## 📊 Metrics & Observability (Kubernetes)

### Metrics Server Setup

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

kubectl -n kube-system edit deploy/metrics-server
# Add under containers[0].args:
# - --kubelet-insecure-tls
# - --kubelet-preferred-address-types=InternalIP,Hostname,ExternalIP
```

Verify:

```bash
kubectl -n kube-system rollout status deploy/metrics-server
kubectl -n kube-system logs deploy/metrics-server --tail=50
```

---

## 🔍 Kubernetes Health Check Endpoints

* **Node.js API** → [http://127.0.0.1.nip.io:8085/api-node/health](http://127.0.0.1.nip.io:8085/api-node/health)
* **FastAPI API** → [http://127.0.0.1.nip.io:8085/api-python/health](http://127.0.0.1.nip.io:8085/api-python/health)
* **Go API** → [http://127.0.0.1.nip.io:8085/api-go/health](http://127.0.0.1.nip.io:8085/api-go/health)
* **Frontend** → [http://127.0.0.1.nip.io:8085/](http://127.0.0.1.nip.io:8085/)

---

## 🔧 Resource Management

### List Resources

```bash
make k8s-watch
make k8s-service
```

### Delete All

```bash
make k8s-delete
```

### Delete All (keep database data)

```bash
make k8s-delete-no-db
```

---

## 📡 Monitoring Stack

### LGTM Stack

```bash
make port-forward-lgtm
```

### Grafana

* URL: [http://localhost:33005/?orgId=1](http://localhost:33005/?orgId=1)
* Username: `admin`
* Default Password: `admin`
* New Password: `Admin@123456`
* **Node.js Dashboard ID**: `11159`

### Prometheus

* URL: [http://localhost:9097/](http://localhost:9097/)

### Loki

* URL: [http://localhost:33105/metrics](http://localhost:33105/metrics)

---

## ✅ Key Improvements in this Setup

* Consistent **API structure** across all services.
* Unified **local + Kubernetes workflows** with `make` commands.
* Preconfigured **health checks** for quick debugging.
* Built-in **metrics, logging, and monitoring** stack.
* Supports **horizontal scalability** with Kubernetes.
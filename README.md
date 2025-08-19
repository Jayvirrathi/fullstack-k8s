# 🚀 Microservices Starter (Node+Mongo, FastAPI+Postgres, Go+Postgres, React) with Docker & Kubernetes

This repository provides a **starter microservices architecture** with:

* **Node.js API** (Node.js + MongoDB) — Users
* **FastAPI (Python) API** (FastAPI + Postgres) — Items
* **GO API** (Go + Postgres) — Products
* **React frontend** (Vite + React) — calls all 3 APIs

Infrastructure is included to run **locally with Docker Compose** or in **Kubernetes**.
---

## 🗂 Project Structure

```
infra/k8s/         # Kubernetes manifests
api-node/          # Node.js + MongoDB service
api-python/        # FastAPI + Postgres service
api-go/            # Go + Postgres service
frontend/          # React frontend
```

---

## 🐳 Running with Docker Compose

### Build & Start

```bash
docker compose up --build
```

Development mode:

```bash
docker compose -f docker-compose-dev.yml up --build
```

### Stop

```bash
docker compose down
```

### Verify Endpoints

```bash
# Node.js API
curl http://localhost:4005/health

# FastAPI service
curl http://localhost:5005/health

# Go service
curl http://localhost:7005/health

# React frontend
open http://localhost:5173
```

### Sample Requests

```bash
# Create a user (Node.js API)
curl -X POST http://localhost:4005/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}'

# Create an item (FastAPI service)
curl -X POST http://localhost:5005/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Sample Item"}'

# Create an product (Go service)
curl -X POST http://localhost:7005/api/products \
 -H "Content-Type: application/json" \
 -d '{"name":"Widget"}'
```

## ✅ Health Check Endpoints

* **Node.js API** → `GET /health` (port **4005**)
* **FastAPI service** → `GET /health` (port **5005**)
* **Go service** → `GET /health` (port **7005**)
* **React frontend** → runs on port **5173**

---

## ☸️ Running on Kubernetes

### 1. Deploy 

```bash
docker compose up --build
make k8s-deploy
```

### Port Forward for Local Access

```bash
kubectl -n ingress-nginx port-forward svc/ingress-nginx-controller 8085:80
```

#### Example Requests

```bash
# Create a user (Node.js API)
curl -X POST http://127.0.0.1.nip.io:8085/api-node/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}'

# Create an item (FastAPI service)
curl -X POST http://127.0.0.1.nip.io:8085/api-python/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Sample Item"}'

# Create an item (Go service)
curl -X POST http://127.0.0.1.nip.io:8085/api-go/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Widget"}'

```

#### Health Check Endpoints

* **Node.js API** → [http://127.0.0.1.nip.io:8085/api-node/health](http://127.0.0.1.nip.io:8085/api-node/health)
* **FastAPI API** → [http://127.0.0.1.nip.io:8085/api-python/health](http://127.0.0.1.nip.io:8085/api-python/health)
* **Go API** → [http://127.0.0.1.nip.io:8085/api-go/health](http://127.0.0.1.nip.io:8085/api-go/health)
* **Web Frontend** → [http://127.0.0.1.nip.io:8085/](http://127.0.0.1.nip.io:8085/)

---


## 🔧 Resource Management

### List Resources

```bash
kubectl get pods
kubectl get services
```

### Delete All Resources

```bash
kubectl delete all --all
pkill -f "kubectl port-forward"
```

### Delete Specific Resources

```bash
kubectl delete services --all
kubectl delete deployments --all
```
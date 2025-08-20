# 🚀 Microservices Starter (Node+Mongo, FastAPI+Postgres, Go+Postgres, React) with Docker & Kubernetes

This repository provides a **starter microservices architecture** with:

* **Node.js API** — Users service (Node.js + MongoDB)
* **FastAPI API** — Items service (FastAPI + Postgres)
* **Go API** — Products service (Go + Postgres)
* **React frontend** — Vite + React app that consumes all APIs

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

### Sample Requests

```bash
# Node.js (Users)
curl -X POST http://localhost:4005/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}'

# FastAPI (Items)
curl -X POST http://localhost:5005/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Sample Item"}'

# Go (Products)
curl -X POST http://localhost:7005/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Widget"}'
```

---

## ✅ Health Check Endpoints

* **Node.js API** → `GET /health` (port **4005**)
* **FastAPI API** → `GET /health` (port **5005**)
* **Go API** → `GET /health` (port **7005**)
* **React frontend** → port **5173**

---

## ☸️ Running on Kubernetes

### Deploy

```bash
make k8s-up
make k8s-deploy
make k8s-forward PORT=8085
```

### Port Forward

```bash
make k8s-forward PORT=8085
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
```

---

## 📈 Load Testing with Autocannon

### Parallel API Calls

```bash
npx autocannon -c 20 -d 240 http://127.0.0.1.nip.io:8085/api-node/api/users & \
npx autocannon -c 20 -d 240 http://127.0.0.1.nip.io:8085/api-python/api/items & \
npx autocannon -c 20 -d 240 http://127.0.0.1.nip.io:8085/api-go/api/products & \
wait
```

### Individual API Calls

```bash
npx autocannon -c 20 -d 240 http://127.0.0.1.nip.io:8085/api-node/api/users
npx autocannon -c 20 -d 240 http://127.0.0.1.nip.io:8085/api-python/api/items
npx autocannon -c 20 -d 240 http://127.0.0.1.nip.io:8085/api-go/api/products
```

---

## 📊 Metrics Server Setup (Kubernetes)

```bash
kubectl get deployment metrics-server -n kube-system
kubectl get apiservices | grep metrics

kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

kubectl logs -n kube-system deploy/metrics-server

# Edit configuration
export KUBE_EDITOR="nano"
kubectl -n kube-system edit deploy/metrics-server
# add under containers[0].args:
# - --kubelet-insecure-tls
# - --kubelet-preferred-address-types=InternalIP,Hostname,ExternalIP

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
kubectl get pods
kubectl get services
```

### Delete All

```bash
kubectl delete all --all
pkill -f "kubectl port-forward"
```

### Delete Specific

```bash
kubectl delete services --all
kubectl delete deployments --all
```
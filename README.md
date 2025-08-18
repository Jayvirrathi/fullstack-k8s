# 🚀 Microservices Starter (Node.js + MongoDB, FastAPI + Postgres, React)

This repository contains a **microservices starter project** with three services:

* **Node.js API** (MongoDB backend)
* **FastAPI (Python) API** (Postgres backend)
* **React frontend**

Infrastructure is included to run locally with **Docker Compose** or in **Kubernetes**.

---

## 📦 Getting Started (Local with Docker Compose)

### 1. Copy environment file

```bash
cp .env.example .env
```

### 2. Build & start containers

```bash
docker compose up --build
```

To stop:

```bash
docker compose down
```

### 3. Verify endpoints

```bash
# Node.js API
curl http://localhost:4005/health

# FastAPI service
curl http://localhost:5005/health

# React frontend
open http://localhost:5173
```

### 4. Sample requests

```bash
# Create a user (Node.js API)
curl -X POST http://localhost:4005/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}'

# Create an item (FastAPI service)
curl -X POST http://localhost:5005/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Sample Item"}'
```

---

## ☸️ Running on Kubernetes

Kubernetes manifests are located in [`infra/k8s`](infra/k8s).

### 1. Namespace, ConfigMaps & Secrets

```bash
kubectl apply -f infra/k8s/00-namespace.yaml
kubectl apply -f infra/k8s/01-configmaps.yaml
kubectl apply -f infra/k8s/02-secrets.example.yaml
```

### 2. Databases

```bash
kubectl apply -f infra/k8s/10-mongodb.yaml
kubectl apply -f infra/k8s/11-postgres.yaml
```

### 3. Services

```bash
kubectl apply -f infra/k8s/20-api-node.yaml
kubectl apply -f infra/k8s/21-api-python.yaml
kubectl apply -f infra/k8s/30-frontend.yaml
```

### 4. Ingress

(Requires **NGINX ingress controller**)

```bash
kubectl apply -f infra/k8s/90-ingress.yaml
```

---

## 🗂 Project Structure

```
infra/k8s/         # Kubernetes manifests
api-node/          # Node.js + MongoDB service
api-python/        # FastAPI + Postgres service
frontend/          # React frontend
```

---

## ✅ Health Check Endpoints

* **Node.js API** → `GET /health` on port **4005**
* **FastAPI service** → `GET /health` on port **5005**
* **React frontend** → available on port **5173**

## Docker Compose Build
```bash
docker compose up --build

#dev
docker compose -f docker-compose-dev.yml up --build
```

## Setup
```bash
make k8s-deploy
```



## Port
```bash
kubectl -n ingress-nginx port-forward svc/ingress-nginx-controller 8085:80

# Create a user (Node.js API)
curl -X POST http://127.0.0.1.nip.io:8085/api-node/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}'

# Create an item (FastAPI service)
curl -X POST http://127.0.0.1.nip.io:8085/api-python/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Sample Item"}'

http://127.0.0.1.nip.io:8085/api-node/health

http://127.0.0.1.nip.io:8085/api-python/health

http://127.0.0.1.nip.io:8085/api-node/api/users

http://127.0.0.1.nip.io:8085/api-python/api/items
```


## Delete
```bash
make k8s-deploy
```

## List Resources
```bash
kubectl get pods
kubectl get services
```

## Delete Resources
```bash
kubectl delete all --all
pkill -f "kubectl port-forward"
```

## Other Resources
```bash
kubectl delete services --all
kubectl delete deployments --all
```
---
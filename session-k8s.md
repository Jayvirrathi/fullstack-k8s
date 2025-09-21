# Kubernetes (K8s)

## 1. Introduction to Kubernetes

**What is Kubernetes?**

* Kubernetes is a container orchestration platform that automates the deployment, scaling, and management of containerized apps.
* It ensures apps run reliably by handling failures, scaling traffic, and rolling out updates seamlessly.


### From Docker to Kubernetes

* **Docker Compose** → good for local dev and small apps.
* **Kubernetes** → essential for production-grade scalability, monitoring, and automation.
* K8s integrates networking, storage, monitoring, and scaling into one system.

### Problems Kubernetes Solves

* Manages **hundreds of containers** across multiple servers automatically.
* Handles **scaling, auto-healing, and networking** without manual intervention.
* Provides a **unified platform** for Dev, QA, and Production.

### Docker vs Kubernetes

* **Docker** is for building and running containers, but doesn’t manage them at scale.
* **Kubernetes** adds cluster management, scheduling, load balancing, monitoring, and resilience.

### 👉 **Analogy:**

* **Docker** = builds & runs individual containers (like driving one car).
* **Kubernetes** = manages fleets of containers (like running Uber).


---

## 2. Kubernetes Core Concepts

* **Pod** → The smallest deployable unit in Kubernetes, usually containing one container.
*  **Deployment** → Manages replicas of pods, rolling updates, and rollbacks.
* **Service** → Provides stable networking (DNS) for pods that can change dynamically.
*  **ConfigMap & Secret** → Store configuration and sensitive data securely.
*  **PVC (PersistentVolumeClaim)** → Ensures storage persists even if pods restart.
*  **Ingress** → Routes external HTTP/S traffic into the cluster.
*  **HPA (Horizontal Pod Autoscaler)** → Automatically scales pods based on CPU/memory.

---

## 3. Databases in Kubernetes

### MongoDB (Node.js backend DB)

* Runs inside a Deployment with a Service exposing port **27017**.
* Uses a **PersistentVolumeClaim** (`mongo-pvc`) for 10Gi storage.
* Credentials managed via **Secrets** for secure initialization.

### PostgreSQL (FastAPI & Go backends)

* Two separate Deployments: one for **FastAPI**, one for **Go API**.
* Each uses its own **PVC** (`postgres-pvc`, `postgres-go-pvc`) for persistence.
* Configurations and credentials injected via **ConfigMaps** and **Secrets**.

---

## 4. Backend Microservices

### Node.js API (Users Service)

* Connects to MongoDB and other APIs.
* Autoscaled with an HPA (2–5 replicas) based on CPU utilization.
* Exposes a `/metrics` endpoint for Prometheus monitoring.

### FastAPI API (Items Service)

* Connects to PostgreSQL using environment variables.
* Configured with liveness & readiness probes to ensure health.
* Uses autoscaling to maintain performance under load.

### Go API (Products Service)

* Has its own PostgreSQL instance (`postgres-go`).
* Configured with **rolling updates** (no downtime during deployment).
* Also provides metrics for Prometheus scraping.

---

## 5. Frontend (React + Vite)

* Runs inside a Deployment and exposed via a Service on port 80.
* Health checks: **Readiness probe** (`/`) ensures app is ready, **Liveness probe** (`/healthz`) ensures app is alive.
* Designed for zero-downtime updates with rolling strategy.

---

## 6. Ingress (Traffic Routing)

* Ingress acts as the **single entry point** into the cluster.
* Routes requests: `/` → Frontend, `/api-node` → Node API, `/api-python` → FastAPI, `/api-go` → Go API.
* Uses `127.0.0.1.nip.io` for local DNS resolution (handy for dev/test environments).

---

## 7. Observability & Monitoring

### Node Exporter

* Runs as a **DaemonSet**, one per node, collecting system-level metrics.
* Provides CPU, memory, and filesystem stats on port **9100**.
* Metrics scraped by Prometheus for cluster health monitoring.

### Monitoring Stack

* **Prometheus** → Scrapes all service metrics and stores time-series data.
* **Grafana** → Provides dashboards for system and app monitoring.
* **Loki** → Centralized logging solution for debugging.

---

## 8. Scaling & Resilience

* APIs use **Horizontal Pod Autoscaler** (HPA) to maintain performance.
* **Rolling updates** ensure that only healthy pods receive traffic during deployments.
* **Readiness probes** block traffic until pods are ready; **Liveness probes** restart failing pods.

---

## 9. Demo Flow

### 🚀 Microservices Starter Kit (Node+Mongo, FastAPI+Postgres, Go+Postgres, React) with Docker, Kubernetes, Prometheus & Grafana
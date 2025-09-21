# 📘 Kubernetes Microservices Starter Kit 
## 0. `00-namespace.yaml` – Namespace

* Creates a **namespace** called `ms-starter`.
* Namespaces logically isolate resources inside Kubernetes.
* Useful for separating dev/staging/prod or grouping microservices.

---

## 1. `01-configmaps.yaml` – ConfigMap

* Stores **non-sensitive configuration** for services.
* Defines database names for MongoDB, Postgres, and Go Postgres.
* Injected into pods as environment variables.

---

## 2. `02-secrets.example.yaml` – Secrets

* Stores **sensitive credentials** like usernames & passwords.
* Keys: `MONGO_USER`, `MONGO_PASSWORD`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `GO_POSTGRES_USER`, `GO_POSTGRES_PASSWORD`.
* Used by MongoDB, FastAPI Postgres, and Go Postgres deployments.

---

## 3. `03-kube-state-metrics.yaml` – Cluster Metrics Exporter

* Deploys **kube-state-metrics** in `kube-system` namespace.
* Collects cluster object metrics (pods, nodes, deployments, HPAs, etc.).
* **RBAC roles** allow read-only access to cluster state.
* Service exposes `/metrics` for **Prometheus scraping**.

---

## 4. `10-mongodb.yaml` – MongoDB Database

* **Service** → Exposes MongoDB internally on port `27017`.
* **Deployment** → Runs a single MongoDB pod with persistent storage.
* **Environment Variables** → Credentials injected from **Secrets**.
* **PersistentVolumeClaim (PVC)** → Uses `mongo-pvc` to store Mongo data so it isn’t lost on pod restart.

---

## 5. `11-postgres.yaml` – PostgreSQL Databases

* Contains **two Postgres deployments**:

  * `postgres` → For **FastAPI Items service**.
  * `postgres-go` → For **Go Products service**.
* Each has:

  * **Service** exposing port `5432`.
  * **PVCs** (`postgres-pvc`, `postgres-go-pvc`) for persistent data.
  * **Secrets** for username/password, **ConfigMaps** for DB names.

---

## 6. `17-pvcs.yaml` – Persistent Volume Claims

* Defines storage for databases:

  * `mongo-pvc` → 10Gi for MongoDB.
  * `postgres-pvc` → 20Gi for FastAPI Postgres.
  * `postgres-go-pvc` → 20Gi for Go Postgres.
* Ensures database data **persists even if pods are deleted or restarted**.

---

## 7. `18-frontend.yaml` – React Frontend

* **Service** → Exposes the frontend on port `80`.
* **Deployment** → Runs the React app container (`web-frontend:prod`).
* **Probes**:

  * **Readiness probe** → Checks `/` to verify pod is ready.
  * **Liveness probe** → Checks `/healthz` to restart if app hangs.
* Runs as **root** (for Nginx binding to port 80).

---

## 8. `20-api-node.yaml` – Node.js API

* **Service** → Exposes API internally on port `80`, routes to container port `4000`.
* **Deployment** → Runs Node.js service (`api-node:dev`).
* **Environment Variables** → Includes MongoDB URI, links to FastAPI & Go APIs.
* **Probes** → TCP health checks on port `4000`.
* **HPA (HorizontalPodAutoscaler)** → Scales pods (2–5 replicas) based on CPU usage.
* **Prometheus Annotations** → Enables metrics scraping from `/metrics`.

---

## 9. `21-api-python.yaml` – FastAPI API

* **Service** → Exposes FastAPI on port `80`, routes to container port `5000`.
* **Deployment** → Runs FastAPI service (`api-python:dev`).
* **Environment Variables** → Pulls Postgres credentials via Secrets.
* **Probes** → Liveness & readiness on port `5000`.
* **HPA** → Scales between 2–5 replicas.
* **Prometheus annotations** → `/metrics` endpoint scraped.

---

## 10. `22-api-go.yaml` – Go API

* **Service** → Exposes Go API on port `80`, routes to container port `7000`.
* **Deployment** → Runs Go service (`api-go:dev`).
* **Env Vars** → Connects to Go’s PostgreSQL DB.
* **Probes** → TCP-based readiness & liveness checks.
* **HPA** → Scales dynamically (2–5 replicas).
* **Prometheus annotations** → Metrics available at `/metrics`.

---

## 11. `23-node-exporter.yaml` – Node Exporter

* **DaemonSet** → Ensures one Node Exporter pod runs per node.
* Collects **system-level metrics** (CPU, memory, filesystem).
* Exposed via **Service** on port `9100`.
* **Prometheus Annotations** → Scrapes `/metrics`.

---

## 12. `90-ingress.yaml` – Ingress Routing

* Defines **Ingress resource** for routing traffic.
* Host: `127.0.0.1.nip.io` → useful for local testing.
* Routes:

  * `/` → Frontend
  * `/api-node` → Node.js API
  * `/api-python` → FastAPI API
  * `/api-go` → Go API
* Uses **nginx ingress controller** for routing.
---

## 13. `91-monitoring-stack.yaml` – Monitoring & Logging

* Deploys **Prometheus + Grafana + Loki** monitoring stack.
* **Prometheus** scrapes services & Node Exporter for metrics.
* **Grafana** provides visual dashboards.
* **Loki** centralizes logging across all microservices.

---

# 📚 Kubernetes Concepts Recap (Session Guide)

## Pods & Deployments

* Pod = smallest deployable unit (runs containers).
* Deployment = manages pod replicas, scaling, and rolling updates.

## Services

* Expose pods using **ClusterIP**, **NodePort**, or **LoadBalancer**.
* Provide stable DNS names even if pods restart.

## ConfigMaps & Secrets

* ConfigMap → stores non-sensitive data (DB names).
* Secret → stores sensitive data (credentials).

## Storage (PVCs)

* PVCs ensure data persistence for MongoDB & Postgres.
* Without PVCs, data would be lost on pod deletion.

## Ingress

* Provides a **single entrypoint** for multiple services.
* Uses rules to route requests based on path/host.

## Monitoring

* Node Exporter → system metrics.
* Kube-State-Metrics → cluster object metrics.
* Prometheus → collects all metrics.
* Grafana → dashboards for observability.
* Loki → central log collection.

---

# ✅ Summary

This setup provides a **complete production-grade Kubernetes stack**:

* **Databases**: MongoDB + PostgreSQL with PVCs.
* **Microservices**: Node.js, FastAPI, Go APIs with scaling.
* **Frontend**: React app with probes.
* **Ingress**: Single entrypoint for all services.
* **Monitoring**: Prometheus, Grafana, Loki, Node Exporter, Kube-State-Metrics.
* **Resilience**: HPAs, rolling updates, probes, PVCs.
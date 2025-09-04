# Docker 
## 1. Introduction to Containers

**What are containers?**

* Containers package code, dependencies, and environment into one lightweight unit.
* Unlike VMs, containers share the host OS kernel, making them fast and efficient.

* What problems containers solve (works on my machine → production issues).
* Difference between VMs vs Containers.
* Docker as a container runtime.
* Other container runtimes like Docker include **runc** (low-level runtime), **containerd** (general-purpose runtime), and **CRI-O** (Kubernetes-specific runtime).

* Why containers matter in modern software development

👉 **Analogy:**

* **VM** = whole apartment (separate utilities, heavy).
* **Container** = room in a shared house (independent space, but lighter).

---

## 2. Docker Overview

**What is Docker?**
A platform to build, ship, and run containers.

**Benefits for Node.js apps:**

Docker comes with a lot of advantages for developers, DevOps, and organizations. Here are the key benefits of Docker:

🚀 1. Portability

Applications packaged in Docker containers run the same way across different environments (developer laptop, test, staging, production, on-premises, or cloud).
“Works on my machine” problems are minimized.

⚡ 2. Lightweight & Fast

Containers share the host OS kernel, so they use fewer resources than traditional virtual machines (VMs).
Start in seconds (much faster than booting a VM).

🛠 3. Consistency & Reproducibility

Using Dockerfiles ensures that the same build process creates identical environments.
Eliminates dependency/version conflicts (library mismatches, runtime differences).

📦 4. Simplified Application Deployment

You package code + dependencies + runtime into a single container.
Easier to distribute applications using container registries (e.g., Docker Hub).

🔄 5. Scalability & Microservices

Ideal for microservices architecture: each service runs in its own container.
Works well with orchestration tools (Kubernetes, Docker Swarm, ECS).

💰 6. Resource Efficiency

Multiple containers can run on the same machine with low overhead.
Great for maximizing hardware usage compared to running multiple VMs.

🔒 7. Isolation & Security

Each container runs in its own isolated environment.
Limits potential damage if one service fails or is compromised.

📉 8. Version Control for Applications

Docker images can be versioned, rolled back, and tracked just like code.
Enables easy rollback to stable versions.


👉 In short: Docker makes apps portable, lightweight, consistent, and scalable—a huge advantage for modern software development.

---


Benefits:

1. Who

* Developers: Use Docker for consistent dev environments (no more “works on my machine”).
* Ops/DevOps: Deploy apps faster without worrying about OS differences.
* QA/Testers: Run the same environment as production locally.


2. What

* A Nestjs/Express app (Nodejs backend)
* A PostgreSQL database
* Run them together with Docker Compose so they talk to each other.



3. Where

* Development machines: Each dev runs containers locally.
* Staging/Production servers: Same containers can be deployed in cloud servers (AWS, Azure, GCP, DigitalOcean, etc.).

4. When

* Development: Devs code inside containers instead of installing everything locally.
* Testing: QA runs the full app stack with one command.
* Deployment: Same Docker images are pushed to a registry (e.g., Docker Hub, AWS ECR) and deployed.


5. Why

* Consistency: Same environment everywhere.
* Speed: No manual setup of Python, Postgres, dependencies.
* Scalability: Can scale services with docker compose up --scale.
* Isolation: App dependencies don’t interfere with system packages.


✅ This example shows the full journey:

* Who: Devs, Ops, QA
* What: Nodejs + Postgres
* Where: Local, staging, production
* When: Dev, test, deploy
* Why: Consistency, speed, portability


---

## 3. Docker Basics

**Install Docker:**

* Mac → Docker Desktop
* Linux → `sudo apt install docker.io`
* Windows → WSL2 + Docker Desktop

**Docker Architecture:**

* **Client (CLI)** → `docker` commands
* **Daemon (dockerd)** → runs containers
* **Registry** → Docker Hub (images store)
* **Image** → Blueprint (Node.js app, MongoDB, etc.)
* **Container** → Running instance

**First steps:**

```bash
# Pull official Node.js image
docker pull node:18

# Run container with Node REPL
docker run -it node:18 node
```
👉 **Manage containers** 
```bash
docker start recursing_elgamal
docker ps
docker ps - a
docker exec -it recursing_elgamal
docker stop recursing_elgamal
docker rm recursing_elgamal
docker ps
```bash
---

## 4. Docker Images

**Images are layered** → cached for speed.

### Example: Node.js Express App

**server.js**

```js
const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Hello from Docker + Node.js!'));

app.listen(3000, () => console.log('Server running on port 3000'));
```

**package.json**

```json
{
  "name": "docker-node-app",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

**Dockerfile**

```dockerfile
FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

👉 **Build & run**

```bash
docker build -t node-app .
docker run -p 3000:3000 node-app
```

Open: `http://localhost:3000`

**Best Practices**

* Use `slim` or `alpine` images.
* `.dockerignore` → exclude `node_modules`, logs.
* Multi-stage builds for production.

---

## 5. Working with Containers

**Volumes – persist data**

```bash
docker run -d -v mongo_data:/data/db mongo:6
```

**Networking – link app + DB**

```bash
docker network create appnet
docker run -d --network=appnet --name db mongo:6
docker run -d --network=appnet --name app node-app
```

**Env variables – config**

```bash
docker run -e NODE_ENV=production node-app
```

**Debugging**

```bash
docker exec -it <id> bash
```

---

## 6. Docker Compose

* Why Docker Compose? (manage multi-container apps).
* docker-compose.yml structure: services, volumes, networks.
* Commands: up, down, logs, exec.
* Docker Compose Basics

* What is Docker Compose? (multi-container orchestration)
* The docker-compose.yml file structure
* services, build, image, ports, volumes, depends_on
* Lifecycle commands (docker compose up/down, logs, scaling)

**Why?**
Define multi-service apps (API + DB) in `docker-compose.yml`.

👉 **Example: Node.js + Mongo**

```yaml
version: "3"
services:
  db:
    image: mongo:6
    volumes:
      - mongo_data:/data/db
  web:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - db
volumes:
  mongo_data:
```

Run:

```bash
docker compose up -d
```

👉 Scale Node.js app:

```bash
docker compose up --scale web=3
```

---

## 7. Advanced Docker & Best Practices

* Understanding layers & caching.
* Writing a Dockerfile.
* Best practices for small, secure images (e.g., using Alpine).
* Reducing image size (multi-stage builds).

**Optimization**

* Multi-stage builds (build in Node.js, run in `alpine`).
* Example:

```dockerfile
FROM node:18 as build
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app .
CMD ["node", "server.js"]
```

**Security**

* Run as non-root:

```dockerfile
RUN adduser --disabled-password appuser
USER appuser
```

## Setup to **Node.js + Express + Postgres**, with Docker and Compose.


# 1) Express App Code (`app.js`)

```js
// app.js
const express = require("express");
const { Pool } = require("pg");

const app = express();

// Use a small pool; Docker networking uses service name "db"
const pool = new Pool({
  host: process.env.PGHOST || "db",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "postgres",
  database: process.env.PGDATABASE || "mydb",
  port: parseInt(process.env.PGPORT || "5432", 10),
  max: 5, // optional: pool size
});

app.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT NOW() AS now;");
    res.send(`Hello! DB time is: ${rows[0].now}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

// graceful shutdown
process.on("SIGTERM", async () => {
  await pool.end();
  process.exit(0);
});
process.on("SIGINT", async () => {
  await pool.end();
  process.exit(0);
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});
```

# 2) Dockerfile for Express App (`Dockerfile`)

```dockerfile
# Base image
FROM node:20-alpine

# Set workdir
WORKDIR /app

# Install deps (use package*.json for better caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Run app
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "app.js"]
```

# 3) Dependencies (`package.json`)

```json
{
  "name": "express-postgres-docker",
  "version": "1.0.0",
  "main": "app.js",
  "type": "module",
  "scripts": {
    "start": "node app.js",
    "dev": "node --watch app.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "pg": "^8.11.5"
  },
  "devDependencies": {}
}
```

# 4) Docker Compose (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy
    environment:
      - NODE_ENV=development
      - PORT=3000
      - PGHOST=db
      - PGUSER=postgres
      - PGPASSWORD=postgres
      - PGDATABASE=mydb
      - PGPORT=5432

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: mydb
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d mydb"]
      interval: 5s
      timeout: 5s
      retries: 10
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
```

# 5) Run the Project

```bash
# Build and start services
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000) → Express app runs, connects to Postgres in the `db` container, and returns the DB time. Data persists via the Docker volume.

# 6) Scale if Needed

```bash
docker compose up --scale web=3
```

You’ll have 3 Express instances behind Docker’s internal load-balancer (round-robin over the `web` service). All share the same `db`.


### MicroService based Example Demo

---

### Optional niceties

* Add a `/health` route if you want container health checks on the app:

  ```js
  app.get("/health", (_req, res) => res.send("ok"));
  ```
* Use a `.env` instead of inline env vars if you prefer:

  * Add `env_file: .env` to the `web` service.
  * Create `.env` with `PGHOST=db`, `PGUSER=postgres`, etc.




* Going Pro:

* Registry usage (Docker Hub, AWS ECR, GitHub Packages).
* Docker Swarm & Kubernetes (intro).
* Production best practices.

👉 Example: Push image to Docker Hub

docker login
docker tag myapp:latest myuser/myapp:latest
docker push myuser/myapp:latest


---


## 8. From Compose to Orchestration

* **Compose** → Best for local dev & small apps.
* **Kubernetes** → Needed for large-scale prod (auto-scaling, healing).
* **Docker Swarm** → Easier than K8s, but less used.


✅ **By the end :**

* Build, run, debug Node.js containers.
* Manage multi-service apps with Docker Compose.
* Comfortably build and run containers.
* Use Docker Compose for multi-service apps.
* Apply best practices for production workloads.
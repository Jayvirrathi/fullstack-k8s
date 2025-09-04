# Docker

## 1. Introduction to Containers

**What are containers?**

- Containers package code, dependencies, and environment into one lightweight unit.
- Unlike VMs, containers share the host OS kernel, making them fast and efficient.

### Problems Containers Solve

- Works on my machine → production issues.
- Difference between VMs vs Containers.
- Docker as a container runtime.

### Difference Between VMs and Containers

👉 **Analogy:**

- **VM** = whole apartment (separate utilities, heavy).
- **Container** = room in a shared house (independent space, but lighter).

### Why Containers Matter

- Consistency, portability, scalability in modern development.

---

## 2. Docker Overview

**What is Docker?**

- A platform to build, ship, and run containers.

### Benefits for Node.js Apps

- **Portable** → Runs the same on dev, staging, and prod.
- **Consistent** → Eliminates "works on my machine" issues.
- **Scalable** → Spin up multiple app instances easily.

### Key Benefits of Docker

🚀 **Portability**  
⚡ **Lightweight & Fast**  
🛠 **Consistency & Reproducibility**  
📦 **Simplified Deployment**  
🔄 **Scalability & Microservices**  
💰 **Resource Efficiency**  
🔒 **Isolation & Security**  
📉 **Version Control for Applications**

👉 In short: Docker makes apps portable, lightweight, consistent, and scalable—a huge advantage for modern software development.

---

### Benefits

**1. Who**

- Developers: Consistent dev environments.  
- Ops/DevOps: Faster deployments.  
- QA/Testers: Run production-like env locally.  

**2. What**

- Node.js backend (NestJS/Express)  
- PostgreSQL database  
- Run together with Docker Compose  

**3. Where**

- Local machines  
- Staging/Production servers  

**4. When**

- Development, testing, deployment  

**5. Why**

- Consistency  
- Speed  
- Scalability  
- Isolation  

✅ Example: Node.js + Postgres journey (Who, What, Where, When, Why).

---

## 3. Docker Basics

### Install Docker

- Mac → Docker Desktop  
- Linux → `sudo apt install docker.io`  
- Windows → WSL2 + Docker Desktop  

### Docker Architecture

- **Client (CLI)** → `docker` commands  
- **Daemon (dockerd)** → runs containers  
- **Registry** → Docker Hub (images store)  
- **Image** → Blueprint (Node.js app, MongoDB, etc.)  
- **Container** → Running instance  

### First Steps

```bash
# Pull official Node.js image
docker pull node:20

# Run container with Node REPL
docker run -it node:20 node
````

👉 **Manage containers**

```bash
docker start recursing_elgamal
docker ps
docker ps -a
docker exec -it recursing_elgamal
docker stop recursing_elgamal
docker rm recursing_elgamal
docker ps
```

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

### Why Docker Compose?

* Manage multi-container apps.

### Basics

* `docker-compose.yml` structure: services, volumes, networks.
* Commands: `up`, `down`, `logs`, `exec`.

**Example: Node.js + Mongo**

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

### Optimization

**Multi-stage builds**

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

```dockerfile
RUN adduser --disabled-password appuser
USER appuser
```

---

## 8. Node.js + Express + Postgres with Docker Compose

### 1) Express App (`app.js`)

```js
const express = require("express");
const { Pool } = require("pg");

const app = express();

const pool = new Pool({
  host: process.env.PGHOST || "db",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "postgres",
  database: process.env.PGDATABASE || "mydb",
  port: parseInt(process.env.PGPORT || "5432", 10),
  max: 5,
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

### 2) Dockerfile (`Dockerfile`)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "app.js"]
```

### 3) Dependencies (`package.json`)

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

### 4) Docker Compose (`docker-compose.yml`)

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

### 5) Run the Project

```bash
docker compose up --build
```

Open: [http://localhost:3000](http://localhost:3000)

### 6) Scale

```bash
docker compose up --scale web=3
```

### MicroService based Example Demo
---

## 9. From Compose to Orchestration

* **Compose** → Best for local dev & small apps.
* **Kubernetes** → Needed for large-scale prod.
* **Docker Swarm** → Easier but less used.

✅ By the end:

* Build, run, debug Node.js containers.
* Manage multi-service apps with Docker Compose.
* Apply best practices for production workloads.
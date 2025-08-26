import os
import time
import logging
from typing import Callable, Optional, AsyncIterator

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager

# --- Optional Loki logging (doesn't crash if package/env missing) ---
LOKI_URL = os.getenv("LOKI_URL", "http://loki:3100")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

logger = logging.getLogger("api-python")
logger.setLevel(LOG_LEVEL)
stream = logging.StreamHandler()
stream.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s'))
logger.addHandler(stream)

try:
    from logging_loki import LokiHandler  # type: ignore
    loki_handler = LokiHandler(
        url=f"{LOKI_URL}/loki/api/v1/push",
        version="1",
        tags={"app": "api-python", "env": os.getenv("NODE_ENV", "dev")},
    )
    loki_handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s'))
    logger.addHandler(loki_handler)
    logger.info("Loki logging enabled at %s", LOKI_URL)
except Exception as e:  # pragma: no cover
    logger.warning("Loki logging not enabled: %s", e)

# --- Prometheus metrics ---
from prometheus_client import (
    CollectorRegistry, CONTENT_TYPE_LATEST, generate_latest,
    Counter, Histogram, Info, Gauge,
    ProcessCollector, GCCollector, PlatformCollector
)

registry = CollectorRegistry()
ProcessCollector(registry=registry)
PlatformCollector(registry=registry)
GCCollector(registry=registry)

HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "route", "code"],
    registry=registry,
)

HTTP_REQUEST_DURATION = Histogram(
    "http_request_duration_seconds",
    "Duration of HTTP requests in seconds",
    ["method", "route", "code"],
    buckets=[0.05, 0.1, 0.2, 0.5, 1, 2, 5],
    registry=registry,
)

APP_INFO = Info("app_info", "Application info", registry=registry)
APP_INFO.info({"service": "api-python", "version": os.getenv("APP_VERSION", "dev")})

READY_GAUGE = Gauge("app_ready", "Readiness (1=ready,0=not ready)", registry=registry)
READY_GAUGE.set(0)  # flipped to 1 during startup

# --- Database imports from local package ---
# Expecting a local module .db with SessionLocal, Item, init_db
from .db import SessionLocal, Item, init_db  # noqa: E402

PORT = int(os.getenv("PORT", "5000"))

# --- Pydantic models ---
class ItemIn(BaseModel):
    name: str

# --- App factory with modern lifespan hook ---
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # Startup
    init_db()
    READY_GAUGE.set(1)
    logger.info("Service ready on port %s", PORT)
    yield
    # Shutdown
    READY_GAUGE.set(0)
    logger.info("Service shutting down")

app = FastAPI(title="api-python", lifespan=lifespan)

# --- CORS (env-driven, defaults to Vite dev server) ---
def _parse_origins(env_value: Optional[str]) -> list[str]:
    if not env_value:
        return ["http://localhost:5173"]
    return [o.strip() for o in env_value.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_origins(os.getenv("CORS_ORIGINS")),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Metrics + logging middleware ---
EXCLUDED_FROM_METRICS = {"/metrics"}  # avoid self-scrape recursion

@app.middleware("http")
async def metrics_and_logging_middleware(request: Request, call_next: Callable):
    start = time.perf_counter()
    # Prefer templated route ("/api/items/{id}") over concrete path ("/api/items/123")
    route_template = request.scope.get("route").path if request.scope.get("route") else request.url.path
    method = request.method
    try:
        response: Response = await call_next(request)
        code = response.status_code
        return response
    finally:
        duration = time.perf_counter() - start
        # Label as strings per Prometheus best practices
        code_label = str(locals().get("code", 500))
        if route_template not in EXCLUDED_FROM_METRICS:
            HTTP_REQUESTS_TOTAL.labels(method, route_template, code_label).inc()
            HTTP_REQUEST_DURATION.labels(method, route_template, code_label).observe(duration)
        logger.info(
            "HTTP %s %s %s %.4fs",
            method, route_template, code_label, duration,
            extra={"tags": {"route": route_template, "code": code_label}}
        )

# --- Routes: app info / health / readiness / metrics ---
@app.get("/", tags=["system"])
def root():
    return {"message": "Hello from api-python"}

@app.get("/metrics", tags=["system"])
def metrics():
    return PlainTextResponse(generate_latest(registry), media_type=CONTENT_TYPE_LATEST)

@app.get("/healthz", tags=["system"])
def healthz():
    # K8s-style liveness
    return PlainTextResponse("ok", status_code=200)

@app.get("/ready", tags=["system"])
def ready():
    # K8s-style readiness
    READY_GAUGE.set(1)
    return PlainTextResponse("ready", status_code=200)

# Keep both /healthz and /health for compatibility
@app.get("/health", tags=["system"])
def health():
    return {"ok": True}

# --- CRUD: Items ---
@app.get("/api/items", tags=["items"])
def list_items():
    with SessionLocal() as db:
        items = db.query(Item).all()
        return [{"id": i.id, "name": i.name} for i in items]

@app.post("/api/items", status_code=201, tags=["items"])
def create_item(payload: ItemIn):
    with SessionLocal() as db:
        item = Item(name=payload.name)
        db.add(item)
        db.commit()
        db.refresh(item)
        return {"id": item.id, "name": item.name}

# --- Entrypoint ---
if __name__ == "__main__":
    import uvicorn
    logger.info("Starting api-python on port %s", PORT)
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, log_level="info")

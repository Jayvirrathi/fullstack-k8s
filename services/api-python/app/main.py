import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from .db import SessionLocal, Item, init_db
from fastapi.middleware.cors import CORSMiddleware

PORT = int(os.getenv("PORT", 5000))
app = FastAPI(title="api-python")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ItemIn(BaseModel):
    name: str

@app.on_event("startup")
async def startup():
    init_db()

@app.get("/api/items")
def list_items():
    with SessionLocal() as db:
        items = db.query(Item).all()
        return [{"id": i.id, "name": i.name} for i in items]

@app.post("/api/items", status_code=201)
def create_item(payload: ItemIn):
    with SessionLocal() as db:
        item = Item(name=payload.name)
        db.add(item)
        db.commit()
        db.refresh(item)
        return {"id": item.id, "name": item.name}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "api-python"}
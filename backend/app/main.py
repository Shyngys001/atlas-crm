from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.logging import setup_logging
from app.core.deps import get_ws_user
from app.db.session import engine, get_db
from app.db.base import Base
from app.api.v1.ws import manager as ws_manager

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging(settings.DEBUG)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    from app.utils.seed import seed
    try:
        await seed()
    except Exception as e:
        import logging
        logging.getLogger("atlas_crm").warning(f"Seed skipped: {e}")
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.v1.routes import auth, users, leads, pipelines, messages, calls, broadcasts, distribution, analytics, integrations_whatsapp, integrations_sipuni

app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(leads.router, prefix="/api/v1")
app.include_router(pipelines.router, prefix="/api/v1")
app.include_router(messages.router, prefix="/api/v1")
app.include_router(calls.router, prefix="/api/v1")
app.include_router(broadcasts.router, prefix="/api/v1")
app.include_router(distribution.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(integrations_whatsapp.router, prefix="/api/v1")
app.include_router(integrations_sipuni.router, prefix="/api/v1")


@app.get("/healthz")
async def health():
    return {"status": "ok", "service": settings.APP_NAME}


@app.get("/api/v1/me")
async def me_alias():
    from app.api.v1.routes.auth import me
    from app.core.deps import get_current_user
    pass


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    from app.core.security import decode_token
    from sqlalchemy import select
    from app.models.user import User
    from app.db.session import async_session

    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        await websocket.close(code=4001)
        return

    user_id = payload.get("sub")
    async with async_session() as db:
        result = await db.execute(select(User).where(User.id == int(user_id)))
        user = result.scalar_one_or_none()

    if not user:
        await websocket.close(code=4001)
        return

    await ws_manager.connect(user, websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(user.id)

import json
import logging
from fastapi import WebSocket, WebSocketDisconnect
from app.models.user import User, UserRole

logger = logging.getLogger("atlas_crm.ws")


class ConnectionManager:
    def __init__(self):
        self.active: dict[int, WebSocket] = {}

    async def connect(self, user: User, websocket: WebSocket):
        await websocket.accept()
        self.active[user.id] = websocket
        logger.info(f"WS connected: user {user.id} ({user.name})")

    def disconnect(self, user_id: int):
        self.active.pop(user_id, None)
        logger.info(f"WS disconnected: user {user_id}")

    async def send_to_user(self, user_id: int, data: dict):
        ws = self.active.get(user_id)
        if ws:
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                self.disconnect(user_id)

    async def broadcast_event(self, data: dict):
        disconnected = []
        for uid, ws in self.active.items():
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                disconnected.append(uid)
        for uid in disconnected:
            self.disconnect(uid)

    async def broadcast_to_lead_owner(self, lead, data: dict):
        if lead.manager_id:
            await self.send_to_user(lead.manager_id, data)
        for uid, ws in self.active.items():
            if uid != lead.manager_id:
                from app.models.user import UserRole
                pass


manager = ConnectionManager()

from fastapi import APIRouter, Request, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends
from app.db.session import get_db
from app.services.whatsapp_service import WhatsAppService

router = APIRouter(prefix="/integrations/whatsapp", tags=["integrations"])


@router.get("/webhook")
async def verify_webhook(
    mode: str = Query(alias="hub.mode", default=""),
    token: str = Query(alias="hub.verify_token", default=""),
    challenge: str = Query(alias="hub.challenge", default=""),
):
    service = WhatsAppService.__new__(WhatsAppService)
    result = service.verify_webhook(mode, token, challenge)
    if result:
        return Response(content=result, media_type="text/plain")
    return Response(status_code=403)


@router.post("/webhook")
async def receive_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    payload = await request.json()
    service = WhatsAppService(db)
    await service.handle_incoming(payload)
    return {"status": "ok"}

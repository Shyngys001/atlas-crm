from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.message import MessageOut, SendMessageRequest, DialogOut
from app.repositories.lead_repo import LeadRepository
from app.repositories.message_repo import MessageRepository
from app.services.whatsapp_service import WhatsAppService

router = APIRouter(tags=["messages"])


@router.get("/dialogs", response_model=list[DialogOut])
async def list_dialogs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = MessageRepository(db)
    return await repo.get_dialogs(current_user)


@router.get("/leads/{lead_id}/messages", response_model=list[MessageOut])
async def get_messages(
    lead_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead_repo = LeadRepository(db)
    lead = await lead_repo.check_access(lead_id, current_user)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found or access denied")
    repo = MessageRepository(db)
    return await repo.get_by_lead(lead_id)


@router.post("/leads/{lead_id}/messages/send", response_model=MessageOut)
async def send_message(
    lead_id: int,
    body: SendMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead_repo = LeadRepository(db)
    lead = await lead_repo.check_access(lead_id, current_user)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found or access denied")

    wa_service = WhatsAppService(db)

    if body.template_name:
        message = await wa_service.send_template(lead, body.template_name, body.content)
    else:
        message = await wa_service.send_text(lead, body.content)

    from app.api.v1.ws import manager as ws_manager
    await ws_manager.broadcast_to_lead_owner(lead, {
        "event": "message:new",
        "data": {
            "id": message.id,
            "lead_id": lead.id,
            "sender_type": "manager",
            "content": body.content,
            "created_at": message.created_at.isoformat(),
        },
    })

    return message

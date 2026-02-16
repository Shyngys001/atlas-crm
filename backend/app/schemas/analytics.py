from pydantic import BaseModel


class AnalyticsSummary(BaseModel):
    total_leads: int = 0
    leads_by_stage: dict = {}
    leads_by_source: dict = {}
    leads_by_manager: dict = {}
    total_messages: int = 0
    total_calls: int = 0
    conversion_rate: float = 0.0
    avg_response_time_minutes: float = 0.0

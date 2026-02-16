# Atlas Tourism CRM

Complete CRM platform for Hajj/Umrah travel company with WhatsApp integration, Sipuni telephony, Kanban pipeline, and auto lead distribution.

## Tech Stack

**Backend:** FastAPI, SQLAlchemy 2.0 (async), PostgreSQL, Redis, Celery, WebSocket
**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Zustand, dnd-kit
**Infrastructure:** Docker Compose, Nginx reverse proxy

## Quick Start (Docker)

```bash
# Clone and enter project
cd crm-atlas

# Copy env file (already provided with dev defaults)
cp .env.example .env

# Start everything
docker-compose up --build
```

Access:
- **App:** http://localhost (via nginx)
- **Backend API:** http://localhost:8000
- **Frontend Dev:** http://localhost:5173

## Local Development (without Docker)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Set environment variables for local
export DATABASE_URL="postgresql+asyncpg://atlas:atlas@localhost:5432/atlas_crm"
export DATABASE_URL_SYNC="postgresql://atlas:atlas@localhost:5432/atlas_crm"
export REDIS_URL="redis://localhost:6379/0"
export JWT_SECRET="dev-secret-key-change-in-production"
export MOCK_INTEGRATIONS="true"
export DEBUG="true"

# Start PostgreSQL and Redis locally (brew or docker)
# docker run -d --name pg -e POSTGRES_DB=atlas_crm -e POSTGRES_USER=atlas -e POSTGRES_PASSWORD=atlas -p 5432:5432 postgres:16-alpine
# docker run -d --name redis -p 6379:6379 redis:7-alpine

# Run backend (auto-creates tables + seeds data on startup)
uvicorn app.main:app --reload --port 8000

# Run Celery worker (separate terminal)
celery -A app.workers.celery_app worker --loglevel=info
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

## Seed Data (Auto-created on first startup)

| Email | Password | Role |
|---|---|---|
| admin@atlas.tld | Admin123! | Admin |
| head@atlas.tld | Head123! | Head |
| manager1@atlas.tld | Manager123! | Manager |
| manager2@atlas.tld | Manager123! | Manager |

8 demo leads with messages, calls, and activities are pre-populated.

## API Examples

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@atlas.tld","password":"Admin123!"}'
```

### Get current user
```bash
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <access_token>"
```

### List leads
```bash
curl "http://localhost:8000/api/v1/leads?stage_id=1&q=Алия" \
  -H "Authorization: Bearer <token>"
```

### Create lead
```bash
curl -X POST http://localhost:8000/api/v1/leads \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Client","phone":"+77009999999","source":"manual","language":"ru"}'
```

### Move lead to stage
```bash
curl -X PATCH http://localhost:8000/api/v1/leads/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"stage_id": 3}'
```

### Send WhatsApp message
```bash
curl -X POST http://localhost:8000/api/v1/leads/1/messages/send \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello from Atlas Tourism!"}'
```

### List dialogs (WhatsApp inbox)
```bash
curl http://localhost:8000/api/v1/dialogs \
  -H "Authorization: Bearer <token>"
```

### List calls
```bash
curl "http://localhost:8000/api/v1/calls?direction=in" \
  -H "Authorization: Bearer <token>"
```

### Click to call
```bash
curl -X POST http://localhost:8000/api/v1/calls/click-to-call \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"phone":"+77001234567"}'
```

### Get analytics
```bash
curl http://localhost:8000/api/v1/analytics/summary \
  -H "Authorization: Bearer <token>"
```

### Pipelines and stages
```bash
curl http://localhost:8000/api/v1/pipelines \
  -H "Authorization: Bearer <token>"
```

### Distribution rules
```bash
curl http://localhost:8000/api/v1/distribution/rules \
  -H "Authorization: Bearer <token>"
```

### Create broadcast
```bash
curl -X POST http://localhost:8000/api/v1/broadcasts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Umrah March Promo","body":"Special offer for Umrah in March!","segment":{"source":"whatsapp"}}'
```

### Schedule broadcast (send now)
```bash
curl -X POST http://localhost:8000/api/v1/broadcasts/1/schedule \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Health check
```bash
curl http://localhost:8000/healthz
```

### Sipuni webhook (simulate incoming call)
```bash
curl -X POST http://localhost:8000/api/v1/integrations/sipuni/webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"call_end","call_id":"test123","src_number":"+77001234567","direction":"in","duration":120,"status":"answered"}'
```

### WebSocket
```javascript
const ws = new WebSocket('ws://localhost:8000/ws?token=<access_token>');
ws.onmessage = (e) => console.log(JSON.parse(e.data));
// Events: message:new, call:new, lead:updated, broadcast:progress
```

## Security Decisions

1. **JWT Access + Refresh tokens:** Access tokens expire in 30 min, refresh tokens in 7 days. Refresh rotation prevents token theft persistence.
2. **bcrypt password hashing:** Industry standard with configurable rounds.
3. **Strict RBAC on every endpoint:** Manager can ONLY access their own leads, messages, and calls. HEAD/ADMIN see all. Enforced at repository/service layer, not frontend.
4. **No frontend-only filtering:** All data access checks happen server-side. Frontend filtering is cosmetic; actual security is backend-enforced.
5. **CORS configured:** Only allowed origins can make requests.
6. **Integration mock mode:** Sensitive API keys are never required for local dev. `MOCK_INTEGRATIONS=true` provides full functionality without real WhatsApp/Sipuni connections.
7. **WebSocket auth:** Token required as query parameter, validated before connection acceptance.

## Project Structure

```
crm-atlas/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── core/                 # Config, security, deps, logging
│   │   ├── db/                   # Database session, base model
│   │   ├── models/               # SQLAlchemy models
│   │   ├── schemas/              # Pydantic schemas
│   │   ├── repositories/         # Data access layer
│   │   ├── services/             # Business logic (WhatsApp, Sipuni, Distribution, Broadcast)
│   │   ├── api/v1/routes/        # API endpoints
│   │   ├── workers/              # Celery tasks
│   │   └── utils/                # Seed data
│   ├── alembic/                  # Database migrations
│   ├── tests/                    # Unit tests
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/                  # App shell, routing, layout
│   │   ├── pages/                # Page components
│   │   ├── components/           # Reusable UI components
│   │   ├── api/                  # HTTP client, endpoints, types
│   │   ├── store/                # Zustand stores
│   │   └── styles/               # Tailwind CSS
│   ├── package.json
│   └── Dockerfile
├── nginx/                        # Reverse proxy config
├── docker-compose.yml
├── .env.example
└── README.md
```

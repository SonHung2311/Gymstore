# 💪 GymStore

Full-stack gym equipment e-commerce store.

| Layer | Tech |
|-------|------|
| Backend | Python 3.12 + FastAPI |
| Frontend | TypeScript + React 18 + Vite |
| Database | PostgreSQL 16 |
| State | Zustand (client) + React Query (server) |
| Styling | Tailwind CSS (warm brown gym palette) |

---

## Project Structure

```
zikky_prj/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, routers
│   │   ├── config.py        # Pydantic Settings (env vars)
│   │   ├── database.py      # SQLAlchemy engine + session
│   │   ├── dependencies.py  # get_db, get_current_user, require_admin
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── routers/         # FastAPI endpoint handlers
│   │   └── services/        # Business logic (auth, products, cart, orders)
│   ├── alembic/             # Database migrations
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/             # Typed Axios API functions
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components + admin panel
│   │   ├── store/           # Zustand stores (auth, cart)
│   │   ├── types/           # TypeScript interfaces
│   │   ├── App.tsx          # React Router routes
│   │   └── main.tsx         # Entry point, QueryClient
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
├── docker-compose.yml
└── .env.example
```

---

## Quick Start (Docker)

```bash
# 1. Clone and enter project
cd zikky_prj

# 2. Create environment file
cp .env.example .env
# Edit .env if needed (DB credentials, secret key)

# 3. Launch everything
docker-compose up --build

# Services:
# - Frontend:  http://localhost:5173
# - Backend:   http://localhost:8000
# - API Docs:  http://localhost:8000/docs
# - Database:  localhost:5432
```

---

## Manual Setup (Development)

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 16 running locally

### Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate          # Linux/Mac
# .venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env: set DATABASE_URL, SECRET_KEY

# Run database migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
echo "VITE_API_URL=http://localhost:8000" > .env.local

# Start dev server
npm run dev
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://gymuser:gympass@localhost:5432/gymstore` | PostgreSQL connection string |
| `SECRET_KEY` | *(change in production!)* | JWT signing key |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | JWT expiry in minutes |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend API base URL |

---

## API Documentation

Interactive Swagger UI available at `http://localhost:8000/docs` when the backend is running.

### Endpoints Summary

#### Auth — `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Register new user, returns JWT |
| POST | `/login` | — | Login, returns JWT |
| POST | `/forgot-password` | — | Request password reset token |
| POST | `/reset-password` | — | Reset password with token |
| GET | `/me` | User | Get current user profile |

#### Products — `/api/products`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | — | List products with filters: `search`, `category_id`, `min_price`, `max_price`, `page`, `limit` |
| GET | `/{slug}` | — | Product detail |
| GET | `/categories` | — | List all categories |

#### Cart — `/api/cart`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Optional (guest via `X-Session-Id` header) | Get cart |
| POST | `/items` | Optional | Add item `{product_id, quantity}` |
| PUT | `/items/{id}` | Optional | Update quantity |
| DELETE | `/items/{id}` | Optional | Remove item |
| POST | `/merge` | User | Merge guest cart after login |

#### Orders — `/api/orders`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | User | Checkout (creates order from cart) |
| GET | `/` | User | Order history |
| GET | `/{id}` | User | Order detail |

#### Admin — `/api/admin` *(admin role required)*
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/products` | List / create products |
| PUT/DELETE | `/products/{id}` | Update / delete product |
| GET | `/orders` | All orders (`?status=` filter) |
| PUT | `/orders/{id}/status` | Update order status |
| GET | `/stats/revenue` | Daily revenue (last 30 days) |
| GET | `/stats/top-products` | Best-selling products |

---

## Key Architecture Decisions

### Guest Cart
Guests receive a UUID `session_id` stored in `localStorage`. Cart items are stored in the database linked to this session. On login, `POST /api/cart/merge` moves all guest items into the user's account.

### Authentication
JWT tokens are stored in `localStorage`. The Axios interceptor automatically attaches `Authorization: Bearer <token>` to every request. A 401 response clears the stale token.

### Database Indexing
- `users.email` — unique index for login lookup
- `products.slug` — unique index for URL routing
- `products.(is_active, category_id)` — composite index for filtered listing
- `orders.(user_id)`, `orders.(status)`, `orders.(created_at)` — indexes for common query patterns
- `cart_items.(user_id)`, `cart_items.(session_id)` — indexes for cart lookups

### Business Logic Layer
All non-trivial logic lives in `app/services/`. Routers are thin HTTP handlers that call services and map exceptions to HTTP errors. This keeps testability high and the router code clean.

---

## Creating the First Admin

After running migrations, promote a user to admin directly in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

Or use the provided seed script approach:

```bash
# Inside the backend container or venv
cd backend
python -c "
from app.database import SessionLocal
from app.models.user import User
from app.services.auth import create_user, hash_password

db = SessionLocal()
# Create admin if not exists
existing = db.query(User).filter(User.email == 'admin@gymstore.com').first()
if not existing:
    u = create_user(db, 'admin@gymstore.com', 'admin123', 'Admin', None)
    u.role = 'admin'
    db.commit()
    print('Admin created: admin@gymstore.com / admin123')
db.close()
"
```

---

## Deployment

### Production Checklist

- [ ] Set a strong random `SECRET_KEY` (e.g., `openssl rand -hex 32`)
- [ ] Change default database credentials
- [ ] Set `VITE_API_URL` to your production domain
- [ ] Replace `allow_origins=["*"]` in `main.py` with your actual frontend URL
- [ ] Add HTTPS (nginx reverse proxy or cloud load balancer)
- [ ] Configure a real email service for password reset (replace the dev mock in `routers/auth.py`)
- [ ] Set up database backups

### Build Frontend for Production

```bash
cd frontend
npm run build
# Output in frontend/dist/ — serve with nginx or CDN
```

### Run Backend in Production

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#8B4513` | Buttons, headings, brand |
| `secondary` | `#D2691E` | Hover states, links |
| `accent` | `#CD853F` | Badges, tags |
| `light` | `#DEB887` | Borders, subtle backgrounds |
| `surface` | `#FDF5E6` | Page background |
| `dark` | `#3D1C02` | Body text |

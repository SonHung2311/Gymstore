from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import admin, auth, cart, community, home, orders, products
from app.routers.og_preview import router as og_router
from app.routers.upload import router as upload_router
from app.routers.vouchers import router as vouchers_router
from app.routers.chat import router as chat_router
from app.routers.tags import router as tags_router

app = FastAPI(
    title="Gym Store API",
    description="Backend API for Gym Store — products, cart, orders, admin management",
    version="1.0.0",
)

# Allow all origins in development; restrict in production via env
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(home.router)
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(community.router)
app.include_router(admin.router)
app.include_router(vouchers_router)
app.include_router(chat_router)
app.include_router(upload_router)
app.include_router(og_router)
app.include_router(tags_router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}

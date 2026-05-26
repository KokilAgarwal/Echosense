from fastapi import FastAPI
from app.routes import dashboard, analytics, map, upload, auth

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api/v1/dashboard")
app.include_router(analytics.router, prefix="/api/v1/analytics")
app.include_router(map.router, prefix="/api/v1/map")
app.include_router(upload.router, prefix="/api/v1/data")
app.include_router(auth.router, prefix="/api/v1/auth")
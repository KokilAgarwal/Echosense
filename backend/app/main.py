import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.routes import dashboard, analytics, map, upload, auth, reports, weather

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
app.include_router(reports.router, prefix="/api/v1/reports")
app.include_router(weather.router, prefix="/api/v1/weather")

# Mount frontend directory for single-origin local access
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
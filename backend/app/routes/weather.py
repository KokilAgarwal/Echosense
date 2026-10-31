from fastapi import APIRouter
from app.services.weather_service import vellore_weather_service

router = APIRouter()

@router.get("/current")
def get_current_weather():
    """
    Returns current meteorological and environmental telemetry for Vellore, Tamil Nadu, India.
    Latitude: 12.9165° N, Longitude: 79.1325° E.
    Fetches real-time telemetry from Open-Meteo or authenticated IMD baseline.
    """
    return vellore_weather_service.get_current_weather()

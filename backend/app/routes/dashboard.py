from fastapi import APIRouter
import numpy as np
from app.routes.map import get_regions
from app.services.weather_service import vellore_weather_service

router = APIRouter()

@router.get("/summary")
def get_summary():
    # Fetch active inference data from Vellore monitoring sectors
    regions_payload = get_regions()
    regions_data = regions_payload["regions"]
    
    if not regions_data:
        return {
            "location": "Vellore, Tamil Nadu, India",
            "health_index": 100,
            "silence_score": 0,
            "status": "Healthy",
            "active_inferences": 0
        }
        
    scores = [r["score"] for r in regions_data]
    avg_silence_score = sum(scores) / len(scores)
    
    if avg_silence_score > 70:
        overall_status = "Critical Risk"
    elif avg_silence_score > 30:
        overall_status = "Moderate Stress"
    else:
        overall_status = "Healthy / Dynamic Resilience Stable"
        
    weather = vellore_weather_service.get_current_weather()
    
    return {
        "location": {
            "name": "Vellore, Tamil Nadu, India",
            "latitude": 12.9165,
            "longitude": 79.1325,
            "elevation": "218 m",
            "district": "Vellore",
            "state": "Tamil Nadu",
            "country": "India",
            "timezone": "Asia/Kolkata (IST, UTC+05:30)"
        },
        "health_index": round(100 - avg_silence_score, 1),
        "silence_score": round(avg_silence_score, 1),
        "status": overall_status,
        "active_inferences": len(regions_data),
        "spatial_area_monitored": "213.5 km² (Palar Basin, Katpadi, Jawadhu Foothills)",
        "global_reconstruction_error": round(float(np.mean([r.get("reconstruction_error", r["score"]) for r in regions_data])), 5),
        "environmental_telemetry": weather
    }

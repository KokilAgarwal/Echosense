from fastapi import APIRouter
import numpy as np

# Import the map endpoint directly to aggregate from its explicit ML inferences
from app.routes.map import get_regions

router = APIRouter()

@router.get("/summary")
def get_summary():
    # Call the ML-driven regions map to get current active inference data
    regions_data = get_regions()["regions"]
    
    if not regions_data:
        return {"health_index": 100, "silence_score": 0, "status": "Healthy", "active_inferences": 0}
        
    scores = [r["score"] for r in regions_data]
    # Re-calculate overall silence score as the average anomaly score from the ML model outputs
    avg_silence_score = sum(scores) / len(scores)
    
    # Global status based on average ML scores
    if avg_silence_score > 70:
        overall_status = "Critical"
    elif avg_silence_score > 30:
        overall_status = "Stress"
    else:
        overall_status = "Healthy"
        
    return {
        "health_index": round(100 - avg_silence_score, 1),
        "silence_score": round(avg_silence_score, 1),
        "status": overall_status,
        "active_inferences": len(regions_data),
        "global_reconstruction_error": round(np.mean([r.get("reconstruction_error", r["score"]) for r in regions_data]), 5)
    }
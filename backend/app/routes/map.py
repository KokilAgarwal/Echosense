from fastapi import APIRouter
from app.services.ml_model import hybrid_service
from app.routes.analytics import get_simulated_region_data

router = APIRouter()

# Defining fixed map bounds for demonstration
REGIONS = [
    {"id": "R-842", "bounds": [[-5, -60], [-7, -58]]}, # Simulated Critical
    {"id": "R-901", "bounds": [[-2, -65], [-4, -63]]}, # Simulated Healthy
    {"id": "R-503", "bounds": [[-8, -62], [-10, -60]]} # Simulated Stress
]

@router.get("/regions")
def get_regions():
    results = []
    
    for region in REGIONS:
        region_id = region["id"]
        # Fetch the baseline data injected with region-specific noise
        _, ndvi_values = get_simulated_region_data(region_id)
        
        # Run through Hybrid ML Pipeline
        inference = hybrid_service.process(ndvi_values)
        
        # To determine the regional 'status', we look at the most recent data point
        current_status = inference["anomaly_status"][-1]
        recent_silence_score = inference["silence_score"][-1]
            
        results.append({
            "id": region_id,
            "bounds": region["bounds"],
            "score": round(recent_silence_score, 1),
            "status": current_status
        })
        
    return {
        "regions": results
    }
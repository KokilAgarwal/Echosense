import os
import pandas as pd
import numpy as np
from fastapi import APIRouter
from app.services.ml_model import hybrid_service

router = APIRouter()

# Helper to load and optionally perturb base data for regional simulation
def get_simulated_region_data(region_id: str = None):
    # Base path assuming this runs from the "backend" directory or "ml_project" directory
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    data_path = os.path.join(base_dir, 'ndvi_data.csv')
    
    if not os.path.exists(data_path):
        # Fallback if run directly in backend
        data_path = os.path.join(base_dir, '..', 'ndvi_data.csv')
        
    df = pd.read_csv(data_path)
    
    # Simulate region specifics
    if region_id:
        np.random.seed(hash(region_id) % (2**32 - 1))
        # Add basic natural noise
        noise = np.random.normal(0, 0.01, len(df))
        df['ndvi'] = df['ndvi'] + noise
        
        # Inject specific anomalies based on region_id matching old mock values or just random patterns
        if "842" in region_id or "Critical" in region_id:
            # Simulate a severe drought in the last 6 months
            df.loc[len(df)-6:, 'ndvi'] -= 0.15
        elif "Stress" in region_id:
            # Simulate moderate stress
            df.loc[len(df)-4:, 'ndvi'] -= 0.08
            
        df['ndvi'] = df['ndvi'].clip(0, 1.0)
    
    return df['date'].tolist(), df['ndvi'].tolist()

@router.get("/ndvi")
def get_ndvi(region_id: str = "default"):
    labels, ndvi_values = get_simulated_region_data(region_id)
    
    # Run the Hybrid ML Pipeline explicitly
    inference_results = hybrid_service.process(ndvi_values)
    
    return {
        "labels": labels,
        "actual_ndvi": inference_results["actual_ndvi"],
        "expected_ndvi": inference_results["expected_ndvi"],
        "silence_score": inference_results["silence_score"]
    }

@router.get("/metrics")
def get_metrics():
    # To provide metrics, let's run inference on baseline
    labels, base_ndvi = get_simulated_region_data("baseline")
    inference = hybrid_service.process(base_ndvi)
    
    return inference["metrics"]

@router.get("/deep")
def get_deep_analytics():
    labels, base_ndvi = get_simulated_region_data("baseline")
    inference = hybrid_service.process(base_ndvi)
    
    statuses = inference["anomaly_status"]
    
    healthy_pct = statuses.count("Healthy") / len(statuses) * 100
    stress_pct = statuses.count("Stress") / len(statuses) * 100
    critical_pct = statuses.count("Critical") / len(statuses) * 100
    
    return {
        "overall_health": {
            "healthy_percentage": round(healthy_pct, 1),
            "stress_percentage": round(stress_pct, 1),
            "critical_percentage": round(critical_pct, 1)
        },
        "model_confidence": {
            "mean_reconstruction_error": inference["metrics"]["mse"],
            "max_reconstruction_error": inference["metrics"]["rmse"],
            "thresholds": {"dynamic": inference["threshold"]}
        },
        "trends": {
            "labels": labels,
            "errors": inference["silence_score"]
        }
    }
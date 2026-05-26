import io
import pandas as pd
from fastapi import APIRouter, UploadFile, File
from app.services.ml_model import hybrid_service

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Read the uploaded file
    content = await file.read()
    
    try:
        # Load the uploaded content into a pandas DataFrame (assuming CSV format)
        df = pd.read_csv(io.BytesIO(content))
        
        # Look for a column containing NDVI values
        # We will check common column names ('ndvi', 'value', etc.)
        ndvi_col = None
        for col in df.columns:
            if 'ndvi' in col.lower() or 'value' in col.lower():
                ndvi_col = col
                break
                
        if not ndvi_col:
            return {"error": "Could not find an 'ndvi' column in the uploaded CSV."}
            
        ndvi_values = df[ndvi_col].tolist()
        labels = df['date'].tolist() if 'date' in df.columns else list(range(len(ndvi_values)))
        
        # Process the newly uploaded user data directly through the PyTorch LSTM pipeline!
        inference = hybrid_service.process(ndvi_values)
        
        return {
            "message": "File successfully analyzed via Hybrid Fusion LSTM Model",
            "filename": file.filename,
            "analysis_results": {
                "labels": labels,
                "actual_ndvi": inference["actual_ndvi"],
                "expected_ndvi": inference["expected_ndvi"],
                "silence_score": inference["silence_score"],
                "anomaly_status": inference["anomaly_status"],
                "overall_health_stats": {
                    "healthy_count": inference["anomaly_status"].count("Healthy"),
                    "stress_count": inference["anomaly_status"].count("Stress"),
                    "critical_count": inference["anomaly_status"].count("Critical")
                }
            }
        }

    except Exception as e:
        return {"error": f"Failed to process the uploaded file through the model: {str(e)}"}
import csv
import io
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.routes.map import REGIONS, LEGACY_REGION_MAP
from app.routes.analytics import get_simulated_region_data
from app.services.ml_model import hybrid_service
from app.services.weather_service import vellore_weather_service

router = APIRouter()

# Fixed IST Timezone (UTC + 05:30) for Vellore, Tamil Nadu, India
IST = timezone(timedelta(hours=5, minutes=30))

@router.get("/data")
def get_report_data(region_id: str = "all"):
    now_ist = datetime.now(IST).strftime("%Y-%m-%d %H:%M:%S IST")
    weather = vellore_weather_service.get_current_weather()
    
    # Model parameters
    hyperparameters = {
        "model_architecture": "PyTorch Bidirectional LSTM Autoencoder",
        "target_location": "Vellore, Tamil Nadu, India (12.9165° N, 79.1325° E)",
        "elevation": "218 m above MSL",
        "features": ["NDVI", "NDVI Gradient (Slope)", "Rolling Window Mean (w=3)"],
        "window_size": 5,
        "latent_dimensions": 64,
        "fusion_weights": {
            "alpha_lstm_reconstruction": 0.50,
            "beta_statistical_zscore": 0.30,
            "gamma_seasonal_deviation": 0.20
        },
        "anomaly_threshold_formula": "mean + 1.5 * std",
        "climate_classification": "Tropical Dry / Semi-Arid (Köppen: Aw/BSh)",
        "primary_monsoon": "Northeast Monsoon (Oct-Dec) & Secondary SW Monsoon (Jun-Sep)"
    }
    
    # Map legacy IDs to Vellore canonical IDs
    canonical_id = LEGACY_REGION_MAP.get(region_id, region_id)
    
    # Regional inferences for Vellore sectors
    regions_summary = []
    timeseries_data = {}
    
    selected_regions = REGIONS if canonical_id == "all" else [r for r in REGIONS if r["id"] == canonical_id]
    if not selected_regions:
        selected_regions = REGIONS
        
    for r in selected_regions:
        r_id = r["id"]
        labels, ndvi_values = get_simulated_region_data(r_id)
        inference = hybrid_service.process(ndvi_values)
        
        recent_score = round(inference["silence_score"][-1], 1)
        recent_status = inference["anomaly_status"][-1]
        
        region_info = {
            "id": r_id,
            "name": r["name"],
            "district": r["district"],
            "bounds": r["bounds"],
            "center": r["center"],
            "ecosystem_type": r["ecosystem_type"],
            "area_km2": r["area_km2"],
            "silence_score": recent_score,
            "status": recent_status,
            "metrics": {
                "mse": round(float(inference["metrics"]["mse"]), 5),
                "rmse": round(float(inference["metrics"]["rmse"]), 5),
                "mean_error": round(float(inference["metrics"]["mean_error"]), 5),
                "std_error": round(float(inference["metrics"]["std_error"]), 5),
                "anomaly_ratio": round(float(inference["metrics"]["anomaly_ratio"]), 3)
            },
            "threshold": round(float(inference["threshold"]), 2)
        }
        regions_summary.append(region_info)
        
        timeseries_data[r_id] = {
            "labels": labels,
            "actual_ndvi": inference["actual_ndvi"],
            "expected_ndvi": inference["expected_ndvi"],
            "silence_score": inference["silence_score"],
            "anomaly_status": inference["anomaly_status"]
        }
        
    avg_score = round(sum(r["silence_score"] for r in regions_summary) / len(regions_summary), 1) if regions_summary else 0
    health_index = round(100 - avg_score, 1)
    
    # Vellore-specific ecological mitigation directives
    if avg_score > 70:
        overall_status = "Critical Ecological Degradation Risk"
        recommendations = [
            "[Palar Basin Emergency] Enforce immediate restrictions on riverbed sand extraction along Palar River to protect subterranean alluvial aquifers.",
            "[Groundwater Intervention] Construct emergency subsurface dykes and percolation ponds across Otteri watershed and Katpadi recharge belts.",
            "[Telemetry Alert] Initiate daily Sentinel-2 and Landsat-9 high-resolution thermal scanning to track canopy desiccation across Jawadhu Foothills."
        ]
    elif avg_score > 30:
        overall_status = "Moderate Resilience Stress (Summer Moisture Deficit)"
        recommendations = [
            "[Catchment Desilting] Clear feeder channels into Otteri Lake and traditional rural irrigation tanks (Eris) before Northeast Monsoon onset.",
            "[Agro-Forestry Buffer] Implement micro-irrigation and mulch coverage in Katpadi agricultural tracts to buffer pre-monsoon heat waves (April-May).",
            "[Native Afforestation] Accelerate planting of drought-hardy indigenous species (Neem, Pungai, Tamarind) along Palar river embankments."
        ]
    else:
        overall_status = "Healthy / Dynamic Resilience Stable"
        recommendations = [
            "[Baseline Logging] Maintain scheduled bi-weekly satellite NDVI trajectory logging across all 4 Vellore District sectors.",
            "[Seasonal Baseline] Continue archiving multi-year Northeast Monsoon vs. Dry Summer recovery signatures for long-term representation calibration.",
            "[Conservation Management] Retain existing check-dam structures; no emergency ecological intervention required at present."
        ]
        
    return {
        "generated_at": now_ist,
        "location": {
            "name": "Vellore, Tamil Nadu, India",
            "latitude": 12.9165,
            "longitude": 79.1325,
            "elevation": "218 m",
            "state": "Tamil Nadu",
            "country": "India",
            "timezone": "Asia/Kolkata (IST, UTC+05:30)"
        },
        "environmental_conditions": weather,
        "region_id": canonical_id,
        "overall_status": overall_status,
        "health_index": health_index,
        "average_silence_score": avg_score,
        "hyperparameters": hyperparameters,
        "regions": regions_summary,
        "timeseries": timeseries_data,
        "recommendations": recommendations
    }

@router.get("/download-csv")
def download_csv(region_id: str = "all"):
    report = get_report_data(region_id)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["# EchoSense Ecological Resilience & Degradation Report"])
    writer.writerow(["# Location", "Vellore, Tamil Nadu, India (12.9165 N, 79.1325 E)"])
    writer.writerow(["# Timezone", "Indian Standard Time (IST, UTC+05:30)"])
    writer.writerow(["# Generated At", report["generated_at"]])
    writer.writerow(["# Target Sector Scope", region_id])
    writer.writerow(["# Overall Status", report["overall_status"]])
    writer.writerow(["# Ecosystem Health Index", report["health_index"]])
    writer.writerow(["# Average Silence Score (%)", report["average_silence_score"]])
    writer.writerow(["# Current Temp (C)", report["environmental_conditions"]["temperature_c"]])
    writer.writerow(["# Current Humidity (%)", report["environmental_conditions"]["relative_humidity_pct"]])
    writer.writerow([])
    writer.writerow(["# MODEL HYPERPARAMETERS"])
    for k, v in report["hyperparameters"].items():
        writer.writerow([k, str(v)])
    writer.writerow([])
    writer.writerow(["# VELLORE SECTOR INFERENCE TABLE"])
    writer.writerow(["Sector_ID", "Sector_Name", "Ecosystem_Type", "Bounds", "Silence_Score", "Status", "MSE"])
    for r in report["regions"]:
        writer.writerow([r["id"], r["name"], r["ecosystem_type"], str(r["bounds"]), r["silence_score"], r["status"], r["metrics"]["mse"]])
    writer.writerow([])
    writer.writerow(["# NDVI TIME-SERIES TRAJECTORY"])
    writer.writerow(["Sector_ID", "Date_Month", "Actual_NDVI", "Expected_NDVI", "Silence_Score", "Condition_Status"])
    
    for r_id, ts in report["timeseries"].items():
        for i in range(len(ts["labels"])):
            writer.writerow([
                r_id,
                ts["labels"][i],
                round(float(ts["actual_ndvi"][i]), 4),
                round(float(ts["expected_ndvi"][i]), 4),
                round(float(ts["silence_score"][i]), 2),
                ts["anomaly_status"][i]
            ])
            
    output.seek(0)
    now_tag = datetime.now(IST).strftime('%Y%m%d_%H%M%S')
    filename = f"EchoSense_Vellore_Report_{region_id}_{now_tag}.csv"
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

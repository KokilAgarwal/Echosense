# EchoSense: LSTM Autoencoder–Based Early Detection of Ecosystem Degradation
### Fixed Location: Vellore, Tamil Nadu, India (12.9165° N, 79.1325° E)

![EchoSense Banner](https://via.placeholder.com/1200x300/0f1714/10b981?text=EchoSense+Vellore+Ecosystem+Monitoring)

## Project Overview

**EchoSense** is an advanced AI/ML and Full-Stack platform designed to forecast and detect ecosystem degradation using deep temporal representation learning. 

The fixed geographical monitoring observatory is established at **Vellore, Tamil Nadu, India** (Latitude: `12.9165° N`, Longitude: `79.1325° E`, Elevation: `218m`, Time Zone: `IST / UTC+05:30`).

EchoSense utilizes a **PyTorch Bidirectional LSTM Autoencoder** to analyze the non-linear, multi-seasonal dynamics of ecosystems through Normalized Difference Vegetation Index (NDVI) time-series data. The core metric is the **Silence Score**, which translates the LSTM's reconstruction error, statistical Z-score deviation, and seasonal desynchronization into a quantifiable measure of ecological resilience loss (critical slowing down) before a catastrophic shift occurs.

---

## Monitored Sectors (Vellore District)

1. **VEL-01 (Palar River Basin & Riparian Zone)**:
   - Coordinates / Bounds: `[[12.9100, 79.1150], [12.9550, 79.1750]]`
   - Ecosystem: Riparian Alluvial Scrub & Riverbed Aquifer
2. **VEL-02 (Jawadhu Foothills Forest Reserve)**:
   - Coordinates / Bounds: `[[12.7500, 78.9600], [12.8300, 79.0600]]`
   - Ecosystem: Tropical Dry Deciduous & Scrub Thorn Canopy
3. **VEL-03 (Otteri Lake Catchment & Watershed)**:
   - Coordinates / Bounds: `[[12.8550, 79.1100], [12.8950, 79.1550]]`
   - Ecosystem: Wetland Catchment & Semi-Arid Thorn Scrub
4. **VEL-04 (Katpadi Agro-Ecological Corridor)**:
   - Coordinates / Bounds: `[[12.9650, 79.1150], [13.0150, 79.1850]]`
   - Ecosystem: Irrigated Agricultural Belt & Traditional Tank Irrigation

---

## Live Meteorological Telemetry

Real-time meteorological and environmental telemetry is fetched from **Open-Meteo API** specifically for Vellore, Tamil Nadu (`lat=12.9165, lon=79.1325`, `timezone=Asia/Kolkata`):
- Temperature (°C)
- Relative Humidity (%)
- Precipitation (mm)
- Soil Moisture (0-1 cm depth, m³/m³)
- Surface Pressure (hPa) and Wind Speed (km/h)

---

## Backend API Endpoints

1. **Dashboard Summary**: `GET /api/v1/dashboard/summary`
2. **Live Vellore Weather Telemetry**: `GET /api/v1/weather/current`
3. **NDVI Time-Series**: `GET /api/v1/analytics/ndvi?region_id=VEL-01`
4. **Deep Analytics & Seasons**: `GET /api/v1/analytics/deep`
5. **Geospatial Map Regions**: `GET /api/v1/map/regions`
6. **Diagnostic Reports**: `GET /api/v1/reports/data?region_id=VEL-01`
7. **Instant CSV Export**: `GET /api/v1/reports/download-csv?region_id=VEL-01`
8. **File Upload / Inference**: `POST /api/v1/data/upload`

---

## Running the Application Locally

```bash
# Start Backend (FastAPI on Port 5001)
cd backend && python3 -m uvicorn app.main:app --host 127.0.0.1 --port 5001

# Start Frontend (Port 8080 or served directly from port 5001)
python3 -m http.server 8080 --directory frontend
```
Access in your browser:
- **Web App**: http://localhost:5001/ (or http://localhost:8080/)
- **API Documentation**: http://localhost:5001/docs

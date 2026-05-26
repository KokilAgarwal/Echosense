# EchoSense: LSTM Autoencoder–Based Early Detection of Ecosystem Degradation

![EchoSense Banner](https://via.placeholder.com/1200x300/0f1714/10b981?text=EchoSense+Ecosystem+Monitoring)

## Project Overview

**EchoSense** is an advanced AI/ML and Full-Stack platform designed to forecast and detect ecosystem degradation using deep temporal representation learning. 

While traditional ecological monitoring relies on simple static thresholding, EchoSense utilizes an **LSTM Autoencoder** to analyze the non-linear, multi-seasonal dynamics of ecosystems through Normalized Difference Vegetation Index (NDVI) time-series data. The core metric is the **Silence Score**, which translates the LSTM's reconstruction error into a quantifiable measure of ecological resilience loss (known as critical slowing down in ecological theory) before a regime shift occurs.

---

## System Architecture

The project is structured as a decoupled, production-grade enterprise machine learning application. 
Currently, the **Frontend Module** is fully implemented, while the **Backend API & ML Workers** are designed and prepared for integration.

### 1. Frontend Stack (Current Implementation)
* **Core Technologies:** HTML5, CSS3, Vanilla JavaScript.
* **Libraries:** Chart.js (Interactive Data Visualization), Leaflet.js (Geospatial Mapping).
* **Architecture:** The application is built using a REST-ready pattern. All charts and maps are wrapped in asynchronous `fetch` functions located in `js/scripts.js`. When the backend is unreachable, the frontend automatically falls back to simulated mock data for demo purposes.

### 2. Backend & ML Architecture (Future Implementation)
* **API Framework:** Python with **FastAPI** (leveraging asynchronous capabilities).
* **Task Queue:** Celery + Redis (To handle long-running ML inferences asynchronously without blocking the main API thread).
* **Database Layer:** PostgreSQL (utilizing PostGIS for geospatial indexing and TimescaleDB for time-series data storage).
* **Machine Learning Framework:** PyTorch (for the LSTM Autoencoder model).

---

## Backend Integration and API Schema

To facilitate the connection between the backend and the frontend, `js/scripts.js` has been pre-configured to communicate with the following API endpoints. 

These routes should be implemented in your backend service:

### 1. Dashboard Metrics Overview
* **Endpoint:** `GET /api/v1/dashboard/summary`
* **Purpose:** Populates the quick insights panel, overall health index, and Silence Score gauge.
* **Expected Response Format:**
  ```json
  {
      "health_index": 88.4,
      "silence_score": 24,
      "status": "Healthy",
      "active_inferences": 14
  }
  ```

### 2. NDVI Time-Series Data
* **Endpoint:** `GET /api/v1/analytics/ndvi?region_id=R-842`
* **Purpose:** Provides time-series data for true NDVI sequences versus the LSTM's expected reconstructions.
* **Expected Response Format:**
  ```json
  {
      "labels": ["Jan", "Feb", "Mar", "..."],
      "actual_ndvi": [0.85, 0.86, 0.88, "..."],
      "expected_ndvi": [0.84, 0.85, 0.87, "..."]
  }
  ```

### 3. Geospatial Map Data
* **Endpoint:** `GET /api/v1/map/regions`
* **Purpose:** Loads geographical boundaries and color-codes regions based on their computed Silence Scores.
* **Expected Response Format:**
  ```json
  {
      "regions": [
          { "id": "R-842", "bounds": [[-5, -60], [-7, -58]], "score": 88, "status": "Critical" },
          { "id": "R-901", "bounds": [[-2, -65], [-4, -63]], "score": 12, "status": "Healthy" }
      ]
  }
  ```

### 4. Data Studio / File Upload
* **Endpoint:** `POST /api/v1/data/upload`
* **Purpose:** Handles CSV/GeoJSON dataset uploads, executes server-side validation, and triggers background Celery inference tasks.
* **Expected Flow:** Frontend transmits multipart form data (`FormData`). The backend validates the inputs, returning a validation report with missing value metrics and a background task job ID.

---

## Running the Frontend Locally

Since the frontend is developed with standard, native web technologies, no transpilation or build steps (such as Webpack or Vite) are required.

1. Clone the repository.
2. Navigate to the `frontend/` directory.
3. Start a local HTTP server:
   ```bash
   python -m http.server 8000
   ```
4. Open a browser and navigate to `http://localhost:8000`.

## Configuring the API Base URL

The API client configuration is located at the top of `frontend/js/scripts.js`:
```javascript
const CONFIG = {
    API_BASE_URL: 'http://localhost:8000/api/v1',
    USE_MOCK_DATA_ON_FAIL: true // Set to false when your backend API is fully integrated
};
```
Modify `API_BASE_URL` to point to your backend server (e.g., `http://localhost:8000/api/v1` or `http://127.0.0.1:8000/api/v1`) once it is active.

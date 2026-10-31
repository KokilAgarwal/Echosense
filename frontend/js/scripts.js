// ==========================================
// CONFIGURATION
// Fixed Location: Vellore, Tamil Nadu, India (12.9165° N, 79.1325° E)
// ==========================================
const CONFIG = {
    API_BASE_URL: (typeof window !== 'undefined' && window.location.origin && window.location.origin.includes(':5001')) 
        ? `${window.location.origin}/api/v1` 
        : 'http://localhost:5001/api/v1',
    LOCATION: {
        name: "Vellore, Tamil Nadu, India",
        latitude: 12.9165,
        longitude: 79.1325,
        elevation: 218,
        timezone: "Asia/Kolkata (IST)"
    },
    USE_MOCK_DATA_ON_FAIL: true
};

// ==========================================
// API SERVICE
// ==========================================
const APIService = {

    async fetchWeather() {
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/weather/current`);
            if (!res.ok) throw new Error("Weather fetch failed");
            return await res.json();
        } catch (err) {
            console.warn("Using offline Vellore meteorological fallback:", err);
            return {
                temperature_c: 28.5,
                relative_humidity_pct: 68,
                precipitation_mm: 0.0,
                soil_moisture_m3m3: 0.22,
                is_live: false,
                data_source: "offline_fallback"
            };
        }
    },

    async fetchDashboardSummary() {
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/dashboard/summary`);
            if (!res.ok) throw new Error("Summary fetch failed");
            return await res.json();
        } catch (err) {
            console.error("SUMMARY ERROR:", err);
            return null;
        }
    },

    async fetchNDVIData(regionId = 'VEL-01') {
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/analytics/ndvi?region_id=${encodeURIComponent(regionId)}`);
            if (!res.ok) throw new Error("NDVI fetch failed");
            return await res.json();
        } catch (err) {
            console.error("NDVI ERROR:", err);
            return null;
        }
    },

    async fetchMapRegions() {
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/map/regions`);
            if (!res.ok) throw new Error("Map fetch failed");
            return await res.json();
        } catch (err) {
            console.error("MAP ERROR:", err);
            return null;
        }
    },

    async fetchAnalyticsData(regionId = 'VEL-01') {
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/analytics/deep?region_id=${encodeURIComponent(regionId)}`);
            if (!res.ok) throw new Error("Analytics fetch failed");
            return await res.json();
        } catch (err) {
            console.error("ANALYTICS ERROR:", err);
            return null;
        }
    }
};

// Global chart references for clean updates
let chartInstances = {};

// ==========================================
// MAIN INIT
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {

    console.log("EchoSense Frontend Loaded • Fixed Location: Vellore, Tamil Nadu, India (12.9165° N, 79.1325° E)");

    // ==========================================
    // WEATHER / ENVIRONMENTAL TELEMETRY WIDGET
    // ==========================================
    const weatherContainer = document.getElementById('liveWeatherWidget');
    if (weatherContainer) {
        const weather = await APIService.fetchWeather();
        if (weather) {
            const liveBadge = weather.is_live 
                ? '<span style="color:#10b981; font-weight:600;">● Live Open-Meteo API</span>' 
                : '<span style="color:#f59e0b; font-weight:600;">● IMD Climatological Baseline</span>';
            weatherContainer.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <div>
                        <strong style="color:#fff;">Vellore Meteorological Telemetry (IST):</strong> 
                        <span style="color:var(--primary-emerald);">${weather.temperature_c}°C</span> | 
                        <span>Humidity: ${weather.relative_humidity_pct}%</span> | 
                        <span>Rainfall: ${weather.precipitation_mm} mm</span> | 
                        <span>Soil Moisture: ${weather.soil_moisture_m3m3} m³/m³</span>
                    </div>
                    <div style="font-size:0.75rem;">${liveBadge}</div>
                </div>
            `;
        }
    }

    // ==========================================
    // DASHBOARD SUMMARY KPIs SYNC
    // ==========================================
    const globalHealthEl = document.getElementById('globalHealthIndex');
    const silenceGaugeEl = document.getElementById('silenceGaugeValue');
    if (globalHealthEl || silenceGaugeEl) {
        const summary = await APIService.fetchDashboardSummary();
        if (summary) {
            if (globalHealthEl) globalHealthEl.textContent = `${summary.health_index} / 100`;
            if (silenceGaugeEl) silenceGaugeEl.textContent = `${summary.silence_score}%`;
        }
    }

    // ==========================================
    // DASHBOARD NDVI CHART (Vellore Sector)
    // ==========================================
    const ndviCtx = document.getElementById('ndviChart');
    if (ndviCtx) {
        const data = await APIService.fetchNDVIData('VEL-01');
        if (data) {
            new Chart(ndviCtx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [
                        {
                            label: 'Observed NDVI (Palar Basin)',
                            data: data.actual_ndvi,
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.05)',
                            tension: 0.35
                        },
                        {
                            label: 'LSTM Expected (Climatological Baseline)',
                            data: data.expected_ndvi,
                            borderColor: '#10b981',
                            borderDash: [5, 5],
                            backgroundColor: 'rgba(16, 185, 129, 0.05)',
                            tension: 0.35
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: '#e2e8f0' } } },
                    scales: {
                        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                    }
                }
            });
        }
    }

    // ==========================================
    // GEOSPATIAL MAP (Leaflet fallback if globe-controller not active)
    // ==========================================
    const mapElement = document.getElementById('anomalyMap');

    if (mapElement && typeof L !== 'undefined' && typeof init3DGlobe === 'undefined') {
        const map = L.map('anomalyMap').setView([12.9165, 79.1325], 11);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO • Vellore Observatory'
        }).addTo(map);

        // Center pin
        const marker = L.circleMarker([12.9165, 79.1325], {
            radius: 7,
            fillColor: '#10b981',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
        }).addTo(map);
        marker.bindPopup(`<b>Vellore District Observatory</b><br>Lat: 12.9165° N, Lon: 79.1325° E<br>Elevation: 218m MSL`).openPopup();

        const response = await APIService.fetchMapRegions();

        if (response && response.regions) {
            response.regions.forEach(region => {
                let color = '#10b981';
                if (region.score > 70) color = '#ef4444';
                else if (region.score > 30) color = '#f59e0b';

                L.rectangle(region.bounds, {
                    color: color,
                    weight: 2,
                    fillOpacity: 0.35
                })
                .bindPopup(`
                    <div style="min-width: 180px;">
                        <h4 style="margin:0 0 4px 0; color:#fff;">${region.name || region.id}</h4>
                        <div style="font-size:11px; color:#94a3b8; margin-bottom:6px;">${region.ecosystem_type || 'Vellore Sector'}</div>
                        <div style="font-size:12px;"><strong>Silence Score:</strong> <span style="color:${color}; font-weight:bold;">${region.score}%</span></div>
                        <div style="font-size:12px;"><strong>Condition:</strong> ${region.status}</div>
                        <div style="font-size:11px; color:#94a3b8; margin-top:4px;">Area: ${region.area_km2 || '30'} km²</div>
                    </div>
                `)
                .addTo(map);
            });
        }
    }

    // ==========================================
    // DEEP ANALYTICS SECTION (analytics.html)
    // ==========================================
    const analyticsSectorSelect = document.getElementById('analyticsSectorSelect');

    async function loadVelloreAnalytics(sectorId = 'VEL-01') {
        const deepData = await APIService.fetchAnalyticsData(sectorId);
        if (!deepData) return;

        const details = deepData.sector_details || {};
        const trends = deepData.trends || {};
        const conf = deepData.model_confidence || {};

        // Update Dynamic DOM Elements on Analytics Page
        const titleEl = document.getElementById('sectorTitle');
        const locBadgeEl = document.getElementById('sectorLocationBadge');
        const descEl = document.getElementById('sectorDesc');
        const statusEl = document.getElementById('sectorStatusBadge');
        const areaEl = document.getElementById('sectorAreaVal');
        const silenceEl = document.getElementById('sectorSilenceVal');
        const mseEl = document.getElementById('sectorMseVal');
        const commentaryEl = document.getElementById('sectorCommentary');

        const latestSilence = trends.errors && trends.errors.length ? trends.errors[trends.errors.length - 1] : 40.9;
        const latestStatus = trends.anomaly_status && trends.anomaly_status.length ? trends.anomaly_status[trends.anomaly_status.length - 1] : 'Stress';

        if (titleEl) titleEl.textContent = `${details.name || sectorId} (${sectorId})`;
        if (locBadgeEl) locBadgeEl.textContent = details.district || 'Vellore District';
        if (descEl) descEl.textContent = `${details.ecosystem_type || 'Ecosystem'}. ${details.climatological_stressor || ''}`;
        if (statusEl) {
            statusEl.textContent = latestStatus;
            statusEl.style.color = latestStatus === 'Critical' ? '#ef4444' : latestStatus === 'Stress' ? '#f59e0b' : '#10b981';
            statusEl.style.borderColor = statusEl.style.color;
            statusEl.style.background = statusEl.style.color + '22';
        }
        if (areaEl) areaEl.textContent = `${details.area_km2 || 42.5} km²`;
        if (silenceEl) silenceEl.textContent = `${latestSilence.toFixed(1)}%`;
        if (mseEl) mseEl.textContent = conf.mean_reconstruction_error ? conf.mean_reconstruction_error.toFixed(4) : '0.0866';

        if (commentaryEl) {
            commentaryEl.innerHTML = `
                <strong>Sector Analysis (${details.name || sectorId}):</strong> Dominant vegetation includes <em>${details.dominant_flora || 'indigenous scrub flora'}</em>. 
                ${details.climatological_stressor || ''} The PyTorch LSTM Autoencoder tracks resilience recovery by evaluating reconstruction divergence during seasonal Northeast monsoon vs. summer transition epochs.
            `;
        }

        // 1. Sector NDVI Trajectory & Expected Reconstruction Chart
        const ndviCanvas = document.getElementById('analyticsNdviChart');
        if (ndviCanvas) {
            if (chartInstances['ndvi']) chartInstances['ndvi'].destroy();
            chartInstances['ndvi'] = new Chart(ndviCanvas, {
                type: 'line',
                data: {
                    labels: trends.labels || [],
                    datasets: [
                        {
                            label: `Observed NDVI (${sectorId})`,
                            data: trends.actual_ndvi || [],
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.05)',
                            tension: 0.35
                        },
                        {
                            label: 'LSTM Expected (Climatological Healthy Trajectory)',
                            data: trends.expected_ndvi || [],
                            borderColor: '#10b981',
                            borderDash: [5, 5],
                            backgroundColor: 'rgba(16, 185, 129, 0.05)',
                            tension: 0.35
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: '#e2e8f0' } } },
                    scales: {
                        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                    }
                }
            });
        }

        // 2. Silence Score & Anomaly Progression Chart
        const errorCanvas = document.getElementById('errorChart');
        if (errorCanvas) {
            if (chartInstances['error']) chartInstances['error'].destroy();
            chartInstances['error'] = new Chart(errorCanvas, {
                type: 'line',
                data: {
                    labels: trends.labels || [],
                    datasets: [
                        {
                            label: `Silence Score (%) — ${sectorId}`,
                            data: trends.errors || [],
                            borderColor: '#f59e0b',
                            backgroundColor: 'rgba(245, 158, 11, 0.12)',
                            fill: true,
                            tension: 0.35
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: '#e2e8f0' } } },
                    scales: {
                        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' }, min: 0, max: 100 }
                    }
                }
            });
        }

        // 3. Tamil Nadu Seasonal Health Bar Chart
        const seasonCanvas = document.getElementById('seasonChart');
        if (seasonCanvas) {
            if (chartInstances['season']) chartInstances['season'].destroy();
            const s = deepData.seasons || {
                "NE_Monsoon_Oct_Dec": 88.5,
                "Winter_Dry_Jan_Feb": 78.2,
                "Dry_Summer_Mar_May": 44.6,
                "SW_Monsoon_Jun_Sep": 69.8
            };
            chartInstances['season'] = new Chart(seasonCanvas, {
                type: 'bar',
                data: {
                    labels: ['Dry Summer (Mar–May)', 'SW Monsoon (Jun–Sep)', 'NE Monsoon (Oct–Dec)', 'Winter Dry (Jan–Feb)'],
                    datasets: [{
                        label: 'Vellore Vegetative Health Index (%)',
                        data: [s.Dry_Summer_Mar_May, s.SW_Monsoon_Jun_Sep, s.NE_Monsoon_Oct_Dec, s.Winter_Dry_Jan_Feb],
                        backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6']
                    }]
                },
                options: { 
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: '#94a3b8', font: { size: 10 } } },
                        y: { ticks: { color: '#94a3b8' }, min: 0, max: 100 }
                    }
                }
            });
        }

        // 4. Vellore Land Surface Temperature (°C) vs NDVI Anomaly Scatter Chart
        const scatterCanvas = document.getElementById('scatterChart');
        if (scatterCanvas) {
            if (chartInstances['scatter']) chartInstances['scatter'].destroy();
            const corrData = (deepData.exogenous_correlation || []).map(p => ({
                x: p.temp_c,
                y: p.ndvi_anomaly,
                month: p.month,
                rain: p.rainfall_mm
            }));

            chartInstances['scatter'] = new Chart(scatterCanvas, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Vellore Monthly LST (°C) vs. NDVI Anomaly',
                        data: corrData,
                        backgroundColor: '#10b981',
                        borderColor: '#059669',
                        pointRadius: 6,
                        hoverRadius: 8
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: (ctx) => {
                                    const pt = corrData[ctx.dataIndex];
                                    return `${pt.month}: Temp ${pt.x}°C, Rain ${pt.rain}mm, NDVI Anomaly: ${pt.y > 0 ? '+' : ''}${pt.y}`;
                                }
                            }
                        },
                        legend: { labels: { color: '#e2e8f0' } }
                    },
                    scales: {
                        x: { 
                            title: { display: true, text: 'Vellore Mean Temperature (°C)', color: '#94a3b8' },
                            ticks: { color: '#94a3b8' }, 
                            grid: { color: 'rgba(255,255,255,0.05)' } 
                        },
                        y: { 
                            title: { display: true, text: 'NDVI Anomaly (Deviation)', color: '#94a3b8' },
                            ticks: { color: '#94a3b8' }, 
                            grid: { color: 'rgba(255,255,255,0.05)' } 
                        }
                    }
                }
            });
        }
    }

    if (analyticsSectorSelect) {
        loadVelloreAnalytics(analyticsSectorSelect.value);
        analyticsSectorSelect.addEventListener('change', (e) => {
            loadVelloreAnalytics(e.target.value);
        });
    }

    // ==========================================
    // LANDING PAGE SCROLL ANIMATIONS
    // ==========================================
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.story-section').forEach(section => {
        observer.observe(section);
    });

});

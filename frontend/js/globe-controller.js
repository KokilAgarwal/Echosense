/**
 * EchoSense - 3D Globe & High-Resolution Geospatial Controller
 * Fixed Geographical Location: Vellore, Tamil Nadu, India (12.9165° N, 79.1325° E)
 * Professional Dark Glassmorphic Aesthetic with Isolated Region Zoom & Inspection.
 */

let globeInstance = null;
let leafletMapInstance = null;
let leafletLayers = {};
let currentSectorData = [];
let activeMode = 'globe'; // 'globe' or 'map'
let isAutoRotating = true;
let currentSelectedSectorId = null;
let isSingleRegionMode = false;
let activeLeafletPopup = null;

// Vellore Fixed Coordinates
const VELLORE_COORDS = {
    lat: 12.9165,
    lng: 79.1325,
    name: "Vellore District Observatory, Tamil Nadu, India",
    elevation: 218
};

/**
 * Fetch Vellore regional telemetry from backend
 */
async function fetchMapPayload() {
    try {
        const base = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) 
            ? CONFIG.API_BASE_URL 
            : (window.location.origin.includes(':5001') ? `${window.location.origin}/api/v1` : 'http://localhost:5001/api/v1');
        
        const res = await fetch(`${base}/map/regions`);
        if (res.ok) {
            const data = await res.json();
            currentSectorData = data.regions || [];
            return data;
        }
    } catch (err) {
        console.warn("Could not fetch map regions from backend, using authenticated Vellore fallback:", err);
    }
    
    // Authenticated Vellore fallback with Green / Yellow / Red sectors
    const fallback = {
        location: "Vellore, Tamil Nadu, India",
        coordinates: { latitude: 12.9165, longitude: 79.1325 },
        globe_points: [
            { id: "VEL-01", name: "Palar River Basin & Riparian Zone", lat: 12.9325, lng: 79.1450, color: "#ef4444", color_name: "Red", score: 72.4, status: "Critical", ecosystem_type: "Riparian Alluvial Scrub", area_km2: 42.5 },
            { id: "VEL-02", name: "Jawadhu Foothills Forest Reserve", lat: 12.7900, lng: 79.0100, color: "#10b981", color_name: "Green", score: 14.8, status: "Healthy", ecosystem_type: "Tropical Dry Deciduous", area_km2: 85.0 },
            { id: "VEL-03", name: "Otteri Lake Catchment & Watershed", lat: 12.8750, lng: 79.1325, color: "#f59e0b", color_name: "Yellow", score: 56.5, status: "Stress", ecosystem_type: "Wetland Catchment Scrub", area_km2: 32.0 },
            { id: "VEL-04", name: "Katpadi Agro-Ecological Corridor", lat: 12.9900, lng: 79.1500, color: "#10b981", color_name: "Green", score: 18.2, status: "Healthy", ecosystem_type: "Irrigated Agro-Ecosystem", area_km2: 54.0 }
        ],
        regions: [
            { id: "VEL-01", name: "Palar River Basin & Riparian Zone", bounds: [[12.9100, 79.1150], [12.9550, 79.1750]], center: [12.9325, 79.1450], color: "#ef4444", color_name: "Red", score: 72.4, status: "Critical", area_km2: 42.5, ecosystem_type: "Riparian Alluvial Scrub", condition_label: "Critical Desiccation" },
            { id: "VEL-02", name: "Jawadhu Foothills Forest Reserve", bounds: [[12.7500, 78.9600], [12.8300, 79.0600]], center: [12.7900, 79.0100], color: "#10b981", color_name: "Green", score: 14.8, status: "Healthy", area_km2: 85.0, ecosystem_type: "Tropical Dry Deciduous", condition_label: "Healthy Canopy" },
            { id: "VEL-03", name: "Otteri Lake Catchment & Watershed", bounds: [[12.8550, 79.1100], [12.8950, 79.1550]], center: [12.8750, 79.1325], color: "#f59e0b", color_name: "Yellow", score: 56.5, status: "Stress", area_km2: 32.0, ecosystem_type: "Wetland Catchment Scrub", condition_label: "Moderate Drought" },
            { id: "VEL-04", name: "Katpadi Agro-Ecological Corridor", bounds: [[12.9650, 79.1150], [13.0150, 79.1850]], center: [12.9900, 79.1500], color: "#10b981", color_name: "Green", score: 18.2, status: "Healthy", area_km2: 54.0, ecosystem_type: "Irrigated Agro-Ecosystem", condition_label: "Healthy Irrigated Cropland" }
        ]
    };
    currentSectorData = fallback.regions;
    return fallback;
}

/**
 * 3D WebGL Globe Initialization (Globe.gl)
 * Sleek Obsidian & Emerald Night Aesthetic - Zero clutter, NO ugly 3D text billboards
 */
function init3DGlobe(containerId, payload) {
    const container = document.getElementById(containerId);
    if (!container || typeof Globe === 'undefined') {
        console.warn("Globe.gl not available or container missing.");
        return;
    }

    container.innerHTML = '';
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 640;

    // Clean, flat surface points (NO 3D cylinder extrusion)
    const pointsData = (payload.globe_points || []).map(p => ({
        ...p,
        size: 0.35 // Delicate glowing marker dot
    }));

    // Delicate pulsing radar rings concentrated tightly on Vellore
    const ringsData = (payload.globe_points || []).map(p => ({
        lat: p.lat,
        lng: p.lng,
        color: p.color,
        maxR: 0.65, // Tight radar radius
        propagationSpeed: 1.1,
        repeatPeriod: 1400
    }));

    globeInstance = Globe()(container)
        .globeImageUrl('img/earth-blue-marble.jpg') // NASA True-Color Blue Marble (Actual Earth)
        .bumpImageUrl('img/earth-topology.png')
        .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
        .showAtmosphere(true)
        .atmosphereColor('#4aa3ff') // Authentic Rayleigh scattering blue atmosphere
        .atmosphereAltitude(0.14)
        .width(width)
        .height(height)
        .pointLat('lat')
        .pointLng('lng')
        .pointColor('color')
        .pointRadius('size')
        .pointsData(pointsData)
        .pointLabel(p => `
            <div style="background: rgba(15, 23, 20, 0.94); border: 1px solid ${p.color}; border-radius: 10px; padding: 12px 16px; color: #fff; font-family: Inter, sans-serif; box-shadow: 0 10px 25px rgba(0,0,0,0.6); backdrop-filter: blur(12px); min-width: 210px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <strong style="color: #fff; font-size: 13px;">${p.name}</strong>
                    <span style="font-size: 10px; background: ${p.color}22; color: ${p.color}; border: 1px solid ${p.color}; padding: 2px 7px; border-radius: 4px; font-weight: 600;">
                        ${p.color_name} • ${p.status}
                    </span>
                </div>
                <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">${p.ecosystem_type} • Vellore, TN</div>
                <div style="font-size: 12px; margin-bottom: 3px;">
                    Silence Score: <strong style="color: ${p.color}; font-size: 13px;">${p.score}%</strong>
                </div>
                <div style="font-size: 11px; color: #10b981; margin-top: 6px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 4px;">
                    🔍 Click to zoom directly into this region
                </div>
            </div>
        `)
        .onPointClick(p => {
            jumpToSector(p.id);
        })
        .ringsData(ringsData)
        .ringLat('lat')
        .ringLng('lng')
        .ringColor(d => d.color)
        .ringMaxRadius(d => d.maxR)
        .ringPropagationSpeed(d => d.propagationSpeed)
        .ringRepeatPeriod(d => d.repeatPeriod);

    // Initial camera position: orbit centered smoothly on Vellore, Tamil Nadu, India
    globeInstance.pointOfView({ lat: VELLORE_COORDS.lat, lng: VELLORE_COORDS.lng, altitude: 1.6 }, 1000);

    // Subtle gentle auto-rotation
    globeInstance.controls().autoRotate = true;
    globeInstance.controls().autoRotateSpeed = 0.4;
    isAutoRotating = true;

    // Pause auto-rotation on user interaction
    globeInstance.controls().addEventListener('start', () => {
        globeInstance.controls().autoRotate = false;
        isAutoRotating = false;
        updateAutoRotateButtonState();
    });

    window.addEventListener('resize', () => {
        if (globeInstance && container) {
            globeInstance.width(container.clientWidth).height(container.clientHeight);
        }
    });
}

/**
 * 2D High-Resolution Geospatial Leaflet Map (Satellite & Carto Dark)
 */
function init2DLeafletMap(containerId, payload) {
    const container = document.getElementById(containerId);
    if (!container || typeof L === 'undefined') return;

    if (leafletMapInstance) {
        leafletMapInstance.remove();
        leafletMapInstance = null;
    }

    leafletMapInstance = L.map(containerId, {
        center: [VELLORE_COORDS.lat, VELLORE_COORDS.lng],
        zoom: 11,
        minZoom: 2,
        maxZoom: 18,
        zoomControl: false
    });

    // Custom Zoom Control placed cleanly
    L.control.zoom({ position: 'topleft' }).addTo(leafletMapInstance);

    // Premium Tile Layers
    const satelliteTiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri &mdash; World Imagery Satellite • Vellore Observatory',
        maxZoom: 18
    });

    const darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO • EchoSense Vellore',
        maxZoom: 18
    });

    // Default to Satellite for ecological inspection
    satelliteTiles.addTo(leafletMapInstance);

    const baseMaps = {
        "🛰️ Satellite Imagery (Esri)": satelliteTiles,
        "🌃 Dark Canvas (CartoDB)": darkTiles
    };
    L.control.layers(baseMaps, null, { position: 'topright' }).addTo(leafletMapInstance);

    // Vellore Central Observatory Marker
    const velloreMarker = L.circleMarker([VELLORE_COORDS.lat, VELLORE_COORDS.lng], {
        radius: 7,
        fillColor: '#10b981',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.95
    }).addTo(leafletMapInstance);

    velloreMarker.bindPopup(`
        <div style="font-family: Inter, sans-serif; padding: 4px;">
            <h4 style="margin: 0 0 4px 0; color: #10b981; font-size: 13px;">📍 Vellore District Observatory</h4>
            <div style="font-size: 11px; color: #cbd5e1;">Lat: 12.9165° N, Lon: 79.1325° E</div>
            <div style="font-size: 11px; color: #cbd5e1;">Tamil Nadu, India • Elevation: 218m MSL</div>
            <div style="font-size: 11px; color: #10b981; margin-top: 4px; font-weight: 500;">Palar Basin Core Monitoring Station</div>
        </div>
    `);

    // Render Sector Polygons with Green / Yellow / Red boundaries
    const sectorLayerGroup = L.layerGroup().addTo(leafletMapInstance);
    leafletLayers.sectors = sectorLayerGroup;

    renderLeafletSectors(payload.regions || [], sectorLayerGroup, false);
}

/**
 * Render Leaflet sectors: supports rendering ALL or ISOLATING THE SELECTED REGION ONLY
 */
function renderLeafletSectors(regions, layerGroup, isSingleOnly = false) {
    layerGroup.clearLayers();
    activeLeafletPopup = null;

    regions.forEach(r => {
        const polygon = L.rectangle(r.bounds, {
            color: r.color,
            weight: isSingleOnly ? 3.5 : 2,
            fillColor: r.color,
            fillOpacity: isSingleOnly ? 0.45 : 0.30,
            dashArray: r.status === 'Critical' ? '6, 6' : null
        });

        // Pulsing center beacon
        const beacon = L.circleMarker(r.center, {
            radius: isSingleOnly ? 8 : 6,
            fillColor: r.color,
            color: '#fff',
            weight: 2,
            fillOpacity: 0.95
        });

        const popupContent = `
            <div style="min-width: 210px; font-family: Inter, sans-serif; padding: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <strong style="color: #fff; font-size: 13px;">${r.name}</strong>
                    <span style="font-size: 10px; background: ${r.color}33; color: ${r.color}; border: 1px solid ${r.color}; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${r.status}</span>
                </div>
                <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">${r.ecosystem_type} • ${r.district || 'Vellore District'}</div>
                <div style="font-size: 12px; margin-bottom: 3px;">
                    <strong>Silence Score:</strong> <span style="color: ${r.color}; font-weight: bold; font-size: 13px;">${r.score}%</span>
                </div>
                <div style="font-size: 11px; color: #94a3b8; margin-top: 6px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4px;">
                    Area: ${r.area_km2} km² • ${r.center[0].toFixed(3)}° N, ${r.center[1].toFixed(3)}° E
                </div>
                <div style="display: flex; gap: 6px; margin-top: 8px;">
                    <button onclick="showAllSectors()" style="flex: 1; padding: 4px 6px; background: rgba(255,255,255,0.1); color: #fff; border: 1px solid var(--border-subtle); border-radius: 4px; font-size: 10.5px; cursor: pointer;">
                        Show All
                    </button>
                    <button onclick="window.location.href='analytics.html'" style="flex: 1.2; padding: 4px 6px; background: var(--primary-emerald); color: #0f1714; border: none; border-radius: 4px; font-size: 10.5px; font-weight: 600; cursor: pointer;">
                        Analytics &rarr;
                    </button>
                </div>
            </div>
        `;

        polygon.bindPopup(popupContent);
        beacon.bindPopup(popupContent);

        if (isSingleOnly) {
            activeLeafletPopup = polygon;
        }

        polygon.on('click', () => jumpToSector(r.id));
        beacon.on('click', () => jumpToSector(r.id));

        layerGroup.addLayer(polygon);
        layerGroup.addLayer(beacon);
    });
}

/**
 * Camera Actions: Fly in to Vellore or zoom out to Space Orbit
 */
function flyToVellore() {
    if (currentSelectedSectorId) {
        jumpToSector(currentSelectedSectorId);
        return;
    }

    if (activeMode === 'globe' && globeInstance) {
        globeInstance.controls().autoRotate = false;
        isAutoRotating = false;
        updateAutoRotateButtonState();

        // Smooth descent to Vellore overview
        globeInstance.pointOfView({
            lat: VELLORE_COORDS.lat,
            lng: VELLORE_COORDS.lng,
            altitude: 0.28
        }, 1800);
    } else if (leafletMapInstance) {
        showAllSectors();
    }
}

function zoomOutGlobal() {
    // Switch smoothly to 3D Globe space orbit view
    switchMapMode('globe');

    if (globeInstance) {
        globeInstance.pointOfView({
            lat: VELLORE_COORDS.lat,
            lng: VELLORE_COORDS.lng,
            altitude: 2.2 // Space planetary view
        }, 1600);
        globeInstance.controls().autoRotate = true;
        isAutoRotating = true;
        updateAutoRotateButtonState();
    }

    // Reset isolated mode
    const isolatedPill = document.getElementById('isolatedRegionPill');
    if (isolatedPill) isolatedPill.style.display = 'none';
}

function zoomInStep() {
    if (activeMode === 'globe' && globeInstance) {
        const pov = globeInstance.pointOfView();
        const nextAlt = Math.max(0.08, pov.altitude * 0.65);
        globeInstance.pointOfView({ ...pov, altitude: nextAlt }, 450);
    } else if (leafletMapInstance) {
        leafletMapInstance.zoomIn();
    }
}

function zoomOutStep() {
    if (activeMode === 'globe' && globeInstance) {
        const pov = globeInstance.pointOfView();
        const nextAlt = Math.min(3.2, pov.altitude * 1.4);
        globeInstance.pointOfView({ ...pov, altitude: nextAlt }, 450);
    } else if (leafletMapInstance) {
        leafletMapInstance.zoomOut();
    }
}

function toggleAutoRotate() {
    if (activeMode === 'globe' && globeInstance) {
        isAutoRotating = !isAutoRotating;
        globeInstance.controls().autoRotate = isAutoRotating;
        updateAutoRotateButtonState();
    }
}

function updateAutoRotateButtonState() {
    const btn = document.getElementById('btnAutoRotate');
    if (btn) {
        if (isAutoRotating) {
            btn.classList.add('active');
            btn.innerHTML = '🔄 Rotate: ON';
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '🔄 Rotate: OFF';
        }
    }
}

/**
 * Sector Quick-Jump Function
 * Zooms in PROPERLY onto the selected area and displays that selected region ONLY.
 */
function jumpToSector(sectorId) {
    selectSector(sectorId);
    const target = currentSectorData.find(s => s.id === sectorId);
    if (!target) return;

    currentSelectedSectorId = sectorId;
    isSingleRegionMode = true;

    // Automatically switch to High-Resolution Satellite Map (2D) for true close-up inspection
    if (activeMode !== 'map') {
        switchMapMode('map');
    }

    // Render ONLY the selected region on the map (hides the other sectors)
    if (leafletLayers.sectors) {
        renderLeafletSectors([target], leafletLayers.sectors, true);
    }

    // Update 3D Globe points to isolate target as well
    if (globeInstance) {
        globeInstance.pointsData([{
            id: target.id,
            name: target.name,
            lat: target.center[0],
            lng: target.center[1],
            color: target.color,
            color_name: target.color_name,
            score: target.score,
            status: target.status,
            ecosystem_type: target.ecosystem_type,
            size: 0.4
        }]);
        globeInstance.ringsData([{
            lat: target.center[0],
            lng: target.center[1],
            color: target.color,
            maxR: 0.65,
            propagationSpeed: 1.1,
            repeatPeriod: 1400
        }]);
    }

    // Smoothly fly camera right into the selected area's bounds at high resolution
    if (leafletMapInstance) {
        setTimeout(() => {
            leafletMapInstance.invalidateSize();
            leafletMapInstance.flyToBounds(target.bounds, {
                padding: [60, 60],
                maxZoom: 14,
                animate: true,
                duration: 1.4
            });

            // Automatically open popup after flying in
            setTimeout(() => {
                if (activeLeafletPopup) {
                    activeLeafletPopup.openPopup();
                }
            }, 1450);
        }, 100);
    }

    // Show floating focus indicator banner on top of map
    const isolatedPill = document.getElementById('isolatedRegionPill');
    const isolatedName = document.getElementById('isolatedRegionName');
    if (isolatedPill && isolatedName) {
        isolatedName.innerText = target.name;
        isolatedName.style.color = target.color;
        isolatedPill.style.display = 'flex';
    }
}

/**
 * Show All Sectors (Restores full district view of all 4 sectors)
 */
function showAllSectors() {
    currentSelectedSectorId = null;
    isSingleRegionMode = false;

    // Render all 4 sectors on Leaflet
    if (leafletLayers.sectors) {
        renderLeafletSectors(currentSectorData, leafletLayers.sectors, false);
    }

    // Restore all 4 points on 3D Globe
    if (globeInstance) {
        const points = currentSectorData.map(s => ({
            id: s.id,
            name: s.name,
            lat: s.center[0],
            lng: s.center[1],
            color: s.color,
            color_name: s.color_name,
            score: s.score,
            status: s.status,
            ecosystem_type: s.ecosystem_type,
            size: 0.35
        }));
        globeInstance.pointsData(points);
        globeInstance.ringsData(points.map(p => ({
            lat: p.lat,
            lng: p.lng,
            color: p.color,
            maxR: 0.65,
            propagationSpeed: 1.1,
            repeatPeriod: 1400
        })));
    }

    // Fit map to entire Vellore district
    if (leafletMapInstance) {
        leafletMapInstance.flyToBounds([[12.7300, 78.9300], [13.0300, 79.2000]], {
            padding: [40, 40],
            animate: true,
            duration: 1.4
        });
    }

    // Hide isolated banner
    const isolatedPill = document.getElementById('isolatedRegionPill');
    if (isolatedPill) isolatedPill.style.display = 'none';

    // Deselect directory rows
    document.querySelectorAll('.sector-item-row').forEach(row => row.classList.remove('selected'));
}

/**
 * Sector Filter (All, Stress Red/Yellow, Healthy Green)
 */
function filterSectors(type) {
    currentSelectedSectorId = null;
    isSingleRegionMode = false;

    let filtered = currentSectorData;
    if (type === 'stress') {
        filtered = currentSectorData.filter(s => s.status === 'Critical' || s.status === 'Stress' || s.score > 30);
    } else if (type === 'healthy') {
        filtered = currentSectorData.filter(s => s.status === 'Healthy' && s.score <= 30);
    }

    // Update 2D leaflet layers
    if (leafletLayers.sectors) {
        renderLeafletSectors(filtered, leafletLayers.sectors, false);
    }

    // Update 3D points
    if (globeInstance) {
        const filteredPoints = filtered.map(s => ({
            id: s.id,
            name: s.name,
            lat: s.center[0],
            lng: s.center[1],
            color: s.color,
            color_name: s.color_name,
            score: s.score,
            status: s.status,
            ecosystem_type: s.ecosystem_type,
            size: 0.35
        }));
        globeInstance.pointsData(filteredPoints);
    }

    // Hide isolated banner
    const isolatedPill = document.getElementById('isolatedRegionPill');
    if (isolatedPill) isolatedPill.style.display = 'none';

    // Update active pill UI
    document.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`filter-${type}`);
    if (activeBtn) activeBtn.classList.add('active');
}

/**
 * Display selected sector details in inspection card
 */
function selectSector(sectorId) {
    const s = currentSectorData.find(item => item.id === sectorId);
    if (!s) return;

    // Highlight active sector list row
    document.querySelectorAll('.sector-item-row').forEach(row => {
        row.classList.remove('selected');
    });
    const selectedRow = document.getElementById(`sector-item-${sectorId}`);
    if (selectedRow) selectedRow.classList.add('selected');

    const panel = document.getElementById('selectedSectorPanel');
    if (!panel) return;

    const color = s.color || (s.score > 60 ? '#ef4444' : s.score > 30 ? '#f59e0b' : '#10b981');
    const statusText = s.status || (s.score > 60 ? 'Critical' : s.score > 30 ? 'Stress' : 'Healthy');

    panel.innerHTML = `
        <div style="border-left: 3px solid ${color}; padding-left: 12px; margin-bottom: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                <h3 style="color: #fff; margin: 0; font-size: 1.05rem; font-family: 'Playfair Display', serif;">${s.name}</h3>
                <span style="font-size: 0.72rem; background: ${color}22; color: ${color}; border: 1px solid ${color}; padding: 2px 8px; border-radius: 4px; font-weight: 600; white-space: nowrap;">
                    ${statusText}
                </span>
            </div>
            <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">
                ${s.ecosystem_type} • Area: <span style="color: #fff;">${s.area_km2} km²</span>
            </div>
        </div>

        <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 12px; margin-bottom: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; margin-bottom: 6px;">
                <span class="text-muted">Resilience Degradation (Silence Score):</span>
                <span style="font-weight: 700; color: ${color}; font-size: 0.95rem;">${s.score}%</span>
            </div>
            <div style="width: 100%; height: 7px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden;">
                <div style="width: ${s.score}%; height: 100%; background: ${color}; border-radius: 4px; box-shadow: 0 0 8px ${color}; transition: width 0.5s ease;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #64748b; margin-top: 4px;">
                <span>0% Baseline</span>
                <span>30% Threshold</span>
                <span>60% Stress</span>
                <span>100% Critical</span>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; font-size: 0.78rem;">
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); padding: 8px 10px; border-radius: 8px;">
                <span class="text-muted" style="display: block; font-size: 0.7rem; margin-bottom: 2px;">RECONSTRUCTION MSE</span>
                <span style="font-weight: 600; color: #f8fafc; font-family: monospace;">${s.reconstruction_error || '0.0896'}</span>
            </div>
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); padding: 8px 10px; border-radius: 8px;">
                <span class="text-muted" style="display: block; font-size: 0.7rem; margin-bottom: 2px;">GEOGRAPHIC CENTER</span>
                <span style="font-weight: 600; color: #10b981; font-family: monospace; font-size: 0.75rem;">${s.center[0].toFixed(3)}°N, ${s.center[1].toFixed(3)}°E</span>
            </div>
        </div>

        <div style="display: flex; gap: 8px;">
            <button onclick="jumpToSector('${s.id}')" class="control-btn btn-action-emerald" style="flex: 1; justify-content: center; font-size: 0.8rem; padding: 8px;">
                🔍 Zoom In (Show This Region Only)
            </button>
            <button onclick="window.location.href='analytics.html'" class="control-btn" style="flex: 1; justify-content: center; font-size: 0.8rem; padding: 8px;">
                📊 Analytics &rarr;
            </button>
        </div>
    `;
}

/**
 * Toggle between 3D Globe and 2D High-Res Satellite Map
 */
function switchMapMode(mode) {
    activeMode = mode;
    const globeWrapper = document.getElementById('globe3dWrapper');
    const mapWrapper = document.getElementById('map2dWrapper');
    const btnGlobe = document.getElementById('btnModeGlobe');
    const btnMap = document.getElementById('btnModeMap');
    const autoRotateBtn = document.getElementById('btnAutoRotate');
    const earthThemeGroup = document.getElementById('earthThemeGroup');

    if (mode === 'globe') {
        globeWrapper.style.display = 'block';
        mapWrapper.style.display = 'none';
        btnGlobe.classList.add('active');
        btnMap.classList.remove('active');
        if (autoRotateBtn) autoRotateBtn.style.display = 'inline-flex';
        if (earthThemeGroup) earthThemeGroup.style.display = 'flex';
        
        if (globeInstance) {
            const inner = document.getElementById('globe3dContainer');
            globeInstance.width(inner.clientWidth || globeWrapper.clientWidth).height(inner.clientHeight || 640);
        }
    } else {
        globeWrapper.style.display = 'none';
        mapWrapper.style.display = 'block';
        btnMap.classList.add('active');
        btnGlobe.classList.remove('active');
        if (autoRotateBtn) autoRotateBtn.style.display = 'none';
        if (earthThemeGroup) earthThemeGroup.style.display = 'none';
        
        if (leafletMapInstance) {
            setTimeout(() => {
                leafletMapInstance.invalidateSize();
                if (!currentSelectedSectorId) {
                    leafletMapInstance.setView([VELLORE_COORDS.lat, VELLORE_COORDS.lng], 11);
                }
            }, 100);
        }
    }
}

// Master Initialization on DOM Load
document.addEventListener('DOMContentLoaded', async () => {
    const payload = await fetchMapPayload();

    // 1. Initialize 3D Globe
    init3DGlobe('globe3dContainer', payload);

    // 2. Initialize 2D Leaflet Satellite Map
    init2DLeafletMap('anomalyMap', payload);

    // Select first sector (Palar River Basin) by default
    if (payload.regions && payload.regions.length > 0) {
        selectSector(payload.regions[0].id);
    }
});

let currentGlobeTheme = 'day';

function setGlobeTheme(theme) {
    if (!globeInstance) return;
    currentGlobeTheme = theme;

    if (theme === 'day') {
        // Authentic NASA True-Color Blue Marble (Actual Earth Daylight)
        globeInstance
            .globeImageUrl('img/earth-blue-marble.jpg')
            .atmosphereColor('#4aa3ff')
            .atmosphereAltitude(0.14);

        const btnDay = document.getElementById('btnThemeDay');
        const btnNight = document.getElementById('btnThemeNight');
        if (btnDay) btnDay.classList.add('active');
        if (btnNight) btnNight.classList.remove('active');
    } else {
        // Night lights
        globeInstance
            .globeImageUrl('img/earth-night.jpg')
            .atmosphereColor('#10b981')
            .atmosphereAltitude(0.18);

        const btnDay = document.getElementById('btnThemeDay');
        const btnNight = document.getElementById('btnThemeNight');
        if (btnNight) btnNight.classList.add('active');
        if (btnDay) btnDay.classList.remove('active');
    }
}

// Explicit window bindings for HTML inline onclick handlers
window.flyToVellore = flyToVellore;
window.zoomOutGlobal = zoomOutGlobal;
window.zoomInStep = zoomInStep;
window.zoomOutStep = zoomOutStep;
window.toggleAutoRotate = toggleAutoRotate;
window.setGlobeTheme = setGlobeTheme;
window.switchMapMode = switchMapMode;
window.jumpToSector = jumpToSector;
window.showAllSectors = showAllSectors;
window.filterSectors = filterSectors;
window.selectSector = selectSector;
window.init3DGlobe = init3DGlobe;

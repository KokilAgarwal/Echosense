// ==========================================
// CONFIGURATION
// ==========================================
const CONFIG = {
    API_BASE_URL: 'http://localhost:5000/api/v1',
    USE_MOCK_DATA_ON_FAIL: false
};

// ==========================================
// API SERVICE
// ==========================================
const APIService = {

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

    async fetchNDVIData(regionId) {
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/analytics/ndvi?region_id=${regionId}`);
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

    async fetchAnalyticsData() {
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/analytics/deep`);
            if (!res.ok) throw new Error("Analytics fetch failed");
            return await res.json();
        } catch (err) {
            console.error("ANALYTICS ERROR:", err);
            return null;
        }
    }
};

// ==========================================
// MAIN INIT
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {

    console.log("Frontend loaded");

    // ==========================================
    // NDVI CHART
    // ==========================================
    const ndviCtx = document.getElementById('ndviChart');

    if (ndviCtx) {
        const data = await APIService.fetchNDVIData('R-42A');

        console.log("NDVI DATA:", data);

        if (data) {
            new Chart(ndviCtx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [
                        {
                            label: 'Actual NDVI',
                            data: data.actual_ndvi,   // FIXED
                            borderColor: '#ef4444',
                            tension: 0.4
                        },
                        {
                            label: 'Expected NDVI',
                            data: data.expected_ndvi, // FIXED
                            borderColor: '#10b981',
                            borderDash: [5, 5],
                            tension: 0.4
                        }
                    ]
                }
            });
        }
    }

    // ==========================================
    // MAP
    // ==========================================
    const mapElement = document.getElementById('anomalyMap');

    if (mapElement && typeof L !== 'undefined') {

        const map = L.map('anomalyMap').setView([-3.4, -62.2], 5);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

        const response = await APIService.fetchMapRegions();

        console.log("MAP DATA:", response);

        if (response && response.regions) {

            response.regions.forEach(region => {

                let color = '#10b981';
                if (region.score > 70) color = '#ef4444';
                else if (region.score > 30) color = '#f59e0b';

                L.rectangle(region.bounds, {
                    color: color,
                    weight: 2,
                    fillOpacity: 0.4
                })
                .bindPopup(`
                    <b>${region.id}</b><br>
                    Score: ${region.score}%<br>
                    Status: ${region.status}
                `)
                .addTo(map);
            });
        }
    }

    // ==========================================
    // DEEP ANALYTICS CHARTS (analytics.html)
    // ==========================================
    const errorCtx = document.getElementById('errorChart');
    if (errorCtx) {
        const deepData = await APIService.fetchAnalyticsData();
        console.log("DEEP ANALYTICS:", deepData);
        
        if (deepData && deepData.trends) {
            new Chart(errorCtx, {
                type: 'line',
                data: {
                    labels: deepData.trends.labels,
                    datasets: [
                        {
                            label: 'Reconstruction Error (MSE)',
                            data: deepData.trends.errors,
                            borderColor: '#f59e0b',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            fill: true,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
            
            // Dummy implementation for season / scatter charts to avoid empty canvas
            const seasonCtx = document.getElementById('seasonChart');
            if (seasonCtx) {
                new Chart(seasonCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Spring', 'Summer', 'Autumn', 'Winter'],
                        datasets: [{
                            label: 'Health Distribution',
                            data: [deepData.overall_health.healthy_percentage, 80, 85, deepData.overall_health.critical_percentage],
                            backgroundColor: '#10b981'
                        }]
                    },
                    options: { maintainAspectRatio: false }
                });
            }
        }
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
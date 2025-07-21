const locationStatus = document.getElementById('location-status');
const sweepLine = document.getElementById('sweep-line');
let map = null;
let radarLayer = null;
let userLatLng = null;

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        locationStatus.textContent = "Geolocation is not supported by your browser.";
    }
}

function showPosition(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    userLatLng = L.latLng(lat, lon);
    locationStatus.textContent = `Displaying radar for: Latitude ${lat.toFixed(4)}, Longitude ${lon.toFixed(4)}`;

    if (!map) {
        initializeMap(lat, lon);
    } else {
        map.setView(userLatLng, 9);
    }
    updateSweepOrigin();
}

function initializeMap(lat, lon) {
    map = L.map('map').setView([lat, lon], 9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    addRadarLayer();
    map.on('move', updateSweepOrigin);
    map.on('zoomend', updateSweepOrigin);
}

// ★ THIS IS THE CORRECTED FUNCTION ★
function addRadarLayer() {
    // 1. Fetch the list of available radar scans
    fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then(res => res.json())
        .then(apiData => {
            // 2. Get the path for the most recent scan
            const lastScanPath = apiData.radar.past[apiData.radar.past.length - 1].path;
            const colorScheme = 4; // 6 = Classic Green-Red
            
            // 3. Construct the full, CORRECTLY formatted URL
            const radarUrl = `https://tilecache.rainviewer.com${lastScanPath}/512/{z}/{x}/{y}/${colorScheme}/1_1.png`;

            // 4. Update the map with the new tiles
            if (!radarLayer) {
                radarLayer = L.tileLayer(radarUrl, { opacity: 0.8 }).addTo(map);
            } else {
                radarLayer.setUrl(radarUrl);
            }
        })
        .catch(err => {
            console.error("Error fetching RainViewer API data:", err);
            locationStatus.textContent = "Could not load radar data.";
        });
}

function updateSweepOrigin() {
    if (!map || !userLatLng) return;
    const screenPoint = map.latLngToContainerPoint(userLatLng);
    sweepLine.style.left = `${screenPoint.x}px`;
    sweepLine.style.top = `${screenPoint.y}px`;
}

function showError(error) {
    locationStatus.textContent = "Could not get your location.";
}

// --- Run the code ---
getLocation();
setInterval(addRadarLayer, 120000); // Refresh every 2 minutes
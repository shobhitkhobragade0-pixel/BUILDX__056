/* Auto location detection and nearest hospitals on homepage */
(function () {
    const statusEl = document.getElementById('location-status');
    const listEl = document.getElementById('hospitals-list');
    if (!statusEl || !listEl) return;

    let userCoords = { latitude: null, longitude: null };

    function showError(msg) {
        statusEl.textContent = msg || 'Could not get location. You can still use the site.';
        listEl.innerHTML = '<p class="text-slate-500">Enable location to see nearest government hospitals in Nagpur with distance and ambulance ETA.</p>';
    }

    function renderHospitals(hospitals) {
        if (!hospitals || hospitals.length === 0) {
            listEl.innerHTML = '<p class="text-slate-500">No government hospitals found in Nagpur.</p>';
            return;
        }
        listEl.innerHTML = hospitals.map(function (h) {
            const iconHospital = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<path d="M4 20V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14" />' +
                '<path d="M9 20v-6h6v6" />' +
                '<path d="M10 9h4" />' +
                '<path d="M12 7v4" />' +
                '</svg>';
            const iconPin = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 0 1 18 0z" />' +
                '<circle cx="12" cy="10" r="3" />' +
                '</svg>';
            const iconRuler = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<path d="M21 7L7 21" />' +
                '<path d="M3 17l4 4" />' +
                '<path d="M3 17L17 3l4 4" />' +
                '<path d="M14 6l4 4" />' +
                '<path d="M11 9l4 4" />' +
                '<path d="M8 12l4 4" />' +
                '</svg>';
            const iconDoctor = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />' +
                '<circle cx="12" cy="7" r="4" />' +
                '</svg>';
            const iconAmbulance = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<path d="M10 17h4" />' +
                '<path d="M5 17H3V7a2 2 0 0 1 2-2h9v12" />' +
                '<path d="M14 9h4l3 3v5h-2" />' +
                '<circle cx="7" cy="17" r="2" />' +
                '<circle cx="17" cy="17" r="2" />' +
                '<path d="M16 5v4" />' +
                '<path d="M14 7h4" />' +
                '</svg>';
            const iconClock = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<circle cx="12" cy="12" r="10" />' +
                '<path d="M12 6v6l4 2" />' +
                '</svg>';
            const iconPhone = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.81.3 1.6.54 2.36a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.72-1.06a2 2 0 0 1 2.11-.45c.76.24 1.55.42 2.36.54A2 2 0 0 1 22 16.92z" />' +
                '</svg>';

            const ambulanceStatus = h.ambulance_available ? 
                '<span class="text-green-600 font-medium inline-flex items-center gap-1">' + iconAmbulance + 'Available</span>' : 
                '<span class="text-red-600 font-medium inline-flex items-center gap-1">' + iconAmbulance + 'Unavailable</span>';
            
            return (
                '<div class="hospital-card">' +
                '<div class="flex justify-between items-start">' +
                '<div class="flex-1">' +
                '<div class="font-medium text-teal-800 flex items-center gap-2">' +
                '<span class="inline-flex" aria-hidden="true">' + iconHospital + '</span>' + escapeHtml(h.name) + 
                (h.hospital_type === 'Government' ? '<span class="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Government</span>' : '<span class="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Public</span>') +
                '</div>' +
                '<div class="text-sm text-slate-600 mt-1 flex items-center gap-1">' +
                '<span class="inline-flex" aria-hidden="true">' + iconPin + '</span>' + escapeHtml(h.address || '') + ', ' + escapeHtml(h.city || 'Nagpur') +
                '</div>' +
                '<div class="text-sm mt-2 flex items-center gap-4">' +
                '<span class="flex items-center gap-1"><span class="inline-flex" aria-hidden="true">' + iconRuler + '</span> Distance: <strong>' + (h.distance_km != null ? h.distance_km + ' km' : '-') + '</strong></span>' +
                '<span class="flex items-center gap-1"><span class="inline-flex" aria-hidden="true">' + iconDoctor + '</span> Doctors: <strong>' + (h.doctors_count || 0) + '</strong></span>' +
                '</div>' +
                '<div class="text-sm mt-2 flex items-center gap-4">' +
                '<span class="flex items-center gap-1">Ambulance: ' + ambulanceStatus + '</span>' +
                '<span class="flex items-center gap-1"><span class="inline-flex" aria-hidden="true">' + iconClock + '</span> ETA: <strong class="text-orange-600">' + (h.ambulance_eta || 'N/A') + '</strong></span>' +
                '</div>' +
                (h.phone ? '<div class="text-sm mt-2 flex items-center gap-1"><span class="inline-flex" aria-hidden="true">' + iconPhone + '</span> Emergency: <strong>' + escapeHtml(h.phone) + '</strong></div>' : '') +
                '</div>' +
                '</div>' +
                '</div>'
            );
        }).join('');
    }

    function escapeHtml(s) {
        if (s == null) return '';
        var div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    function fetchNearby() {
        if (userCoords.latitude == null || userCoords.longitude == null) {
            showError('Location not available.');
            return;
        }
        statusEl.textContent = 'Loading nearest government hospitals in Nagpur...';
        fetch('/api/hospitals/nearby', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                latitude: userCoords.latitude,
                longitude: userCoords.longitude
            })
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                statusEl.textContent = 'Nearest Government Hospitals in Nagpur:';
                renderHospitals(data.hospitals || []);
            })
            .catch(function () {
                showError('Failed to load hospitals.');
            });
    }

    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser.');
        return;
    }

    statusEl.textContent = 'Getting your location...';
    navigator.geolocation.getCurrentPosition(
        function (pos) {
            userCoords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            statusEl.textContent = 'Location found. Loading nearest hospitals...';
            fetchNearby();
        },
        function () {
            showError('Location denied or unavailable. Enable location for nearest hospitals.');
            fetch('/api/hospitals/nearby', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude: 21.1458, longitude: 79.0882 })
            })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    statusEl.textContent = 'Showing sample hospitals (use location for distance):';
                    renderHospitals(data.hospitals || []);
                });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
})();

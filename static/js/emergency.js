/* Emergency button: Step 1 confirm → Step 2 details + geolocation → submit */
(function () {
    const emergencyBtn = document.getElementById('emergency-btn');
    const confirmPopup = document.getElementById('emergency-confirm');
    const modal = document.getElementById('emergency-modal');
    const emergencyForm = document.getElementById('emergency-form');
    const emergencyName = document.getElementById('emergency-name');
    const emergencyDesc = document.getElementById('emergency-desc');
    const emergencyLocDisplay = document.getElementById('emergency-loc-display');
    const emergencyModalClose = document.getElementById('emergency-modal-close');
    const emergencyCancel = document.getElementById('emergency-cancel');
    const emergencyYes = document.getElementById('emergency-yes');
    const emergencyNo = document.getElementById('emergency-no');

    function show(el) { if (el) el.classList.remove('hidden'); }
    function hide(el) { if (el) el.classList.add('hidden'); }

    if (!emergencyBtn) return;

    emergencyBtn.addEventListener('click', function () {
        show(confirmPopup);
    });

    emergencyYes.addEventListener('click', function () {
        hide(confirmPopup);
        show(modal);
        emergencyLocDisplay.textContent = 'Fetching...';
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function (pos) {
                    window._emergencyLat = pos.coords.latitude;
                    window._emergencyLng = pos.coords.longitude;
                    emergencyLocDisplay.textContent = pos.coords.latitude.toFixed(4) + ', ' + pos.coords.longitude.toFixed(4);
                },
                function () {
                    window._emergencyLat = null;
                    window._emergencyLng = null;
                    emergencyLocDisplay.textContent = 'Location unavailable';
                }
            );
        } else {
            emergencyLocDisplay.textContent = 'Not supported';
        }
    });

    emergencyNo.addEventListener('click', function () { hide(confirmPopup); });

    emergencyModalClose.addEventListener('click', function () { hide(modal); });
    emergencyCancel.addEventListener('click', function () { hide(modal); });

    emergencyForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = (emergencyName && emergencyName.value || '').trim();
        var desc = (emergencyDesc && emergencyDesc.value || '').trim();
        if (!name || !desc) {
            alert('Please enter your name and emergency description.');
            return;
        }
        var payload = {
            patient_name: name,
            description: desc,
            latitude: window._emergencyLat || null,
            longitude: window._emergencyLng || null
        };
        fetch('/api/emergency', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.success) {
                    alert('Emergency reported. Help is on the way.');
                    hide(modal);
                    emergencyForm.reset();
                } else {
                    alert(data.error || 'Failed to submit.');
                }
            })
            .catch(function () { alert('Network error. Please try again.'); });
    });
})();

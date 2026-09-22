/* Health ID link and health records list */
(function () {
    var inputEl = document.getElementById('health-id-input');
    var saveBtn = document.getElementById('health-id-save');
    var statusEl = document.getElementById('health-id-status');
    var recordsList = document.getElementById('health-records-list');
    var noRecords = document.getElementById('no-records');
    if (!recordsList) return;

    function loadHealthId() {
        fetch('/api/patient/health-id', { credentials: 'same-origin' })
            .then(function (r) {
                if (r.status === 401) { window.location.href = '/patient/login'; return {}; }
                return r.json();
            })
            .then(function (d) {
                if (inputEl && d.health_id != null) inputEl.value = d.health_id || '';
            });
    }

    function loadRecords() {
        fetch('/api/patient/health-records', { credentials: 'same-origin' })
            .then(function (r) {
                if (r.status === 401) { window.location.href = '/patient/login'; return { records: [] }; }
                return r.json();
            })
            .then(function (d) {
                var recs = d.records || [];
                if (recs.length === 0) {
                    recordsList.innerHTML = '';
                    if (noRecords) noRecords.classList.remove('hidden');
                    return;
                }
                if (noRecords) noRecords.classList.add('hidden');
                recordsList.innerHTML = recs.map(function (r) {
                    return '<div class="border border-slate-200 rounded p-3">' +
                        '<strong>' + escapeHtml(r.record_type) + '</strong> ' + (r.title ? escapeHtml(r.title) : '') + '<br>' +
                        '<span class="text-sm text-slate-600">' + escapeHtml(r.visit_date || r.created_at) + '</span><br>' +
                        (r.content ? '<p class="text-sm mt-1">' + escapeHtml(r.content) + '</p>' : '') +
                        (r.doctor_notes ? '<p class="text-sm italic">' + escapeHtml(r.doctor_notes) + '</p>' : '') +
                        '</div>';
                }).join('');
            });
    }

    function escapeHtml(s) {
        if (s == null) return '';
        var div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    if (saveBtn && inputEl) {
        saveBtn.addEventListener('click', function () {
            var healthId = (inputEl.value || '').trim();
            fetch('/api/patient/health-id', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ health_id: healthId })
            })
                .then(function (r) { return r.json(); })
                .then(function (d) {
                    if (d.success) {
                        if (statusEl) statusEl.textContent = 'Health ID saved.';
                    }
                });
        });
    }

    loadHealthId();
    loadRecords();
})();

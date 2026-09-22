/* Admin dashboard: analytics, emergencies, doctors, appointments, patients, donors */
(function () {
    function init() {
        var panels = Array.prototype.slice.call(document.querySelectorAll('.admin-panel'));
        var statDaily = document.getElementById('stat-daily');
        var statEmergency = document.getElementById('stat-emergency');
        var statWait = document.getElementById('stat-wait');
        var statDept = document.getElementById('stat-dept');
        var statWorkload = document.getElementById('stat-workload');

        function switchTab(name) {
            if (!name) return;
            var tabs = Array.prototype.slice.call(document.querySelectorAll('.admin-tab, .admin-nav-link[data-tab]'));
            tabs.forEach(function (t) {
                if (t.dataset.tab === name) t.classList.add('active'); else t.classList.remove('active');
            });
            panels.forEach(function (p) {
                p.classList.toggle('hidden', p.id !== 'tab-' + name);
            });
            if (name === 'emergencies') loadEmergencies();
            if (name === 'doctors') loadDoctors();
            if (name === 'appointments') loadAppointments();
            if (name === 'patients') loadPatients();
            if (name === 'donors') loadDonors();
        }

        document.addEventListener('click', function (e) {
            var el = e && e.target ? e.target : null;
            if (!el || !el.closest) return;
            var tabBtn = el.closest('.admin-tab[data-tab], .admin-nav-link[data-tab]');
            if (!tabBtn) return;
            if (e && e.preventDefault) e.preventDefault();
            switchTab(tabBtn.dataset.tab);
        });

    function loadAnalytics() {
        fetch('/api/admin/analytics', { credentials: 'same-origin' })
            .then(function (r) { return r.json(); })
            .then(function (d) {
                if (statDaily) statDaily.textContent = d.daily_patients != null ? d.daily_patients : '-';
                if (statEmergency) statEmergency.textContent = d.emergency_cases != null ? d.emergency_cases : '-';
                if (statWait) statWait.textContent = d.average_waiting_time_minutes != null ? d.average_waiting_time_minutes : '-';
                if (statDept && d.busiest_departments && d.busiest_departments[0]) statDept.textContent = d.busiest_departments[0].name;
                else if (statDept) statDept.textContent = '-';
                if (statWorkload && d.doctor_workload && d.doctor_workload[0]) statWorkload.textContent = d.doctor_workload[0].name + ' (' + d.doctor_workload[0].count + ')';
                else if (statWorkload) statWorkload.textContent = '-';
            });
    }

    function loadEmergencies() {
        var el = document.getElementById('emergencies-list');
        if (!el) return;
        fetch('/api/admin/emergencies', { credentials: 'same-origin' })
            .then(function (r) { return r.json(); })
            .then(function (d) {
                var list = d.emergencies || [];
                if (list.length === 0) {
                    el.innerHTML = '<p class="text-slate-500">No emergencies.</p>';
                    return;
                }
                el.innerHTML = list.map(function (e) {
                    return '<div class="border border-red-200 bg-red-50 rounded p-4">' +
                        '<div class="flex justify-between"><strong>' + escapeHtml(e.patient_name) + '</strong> <span class="text-red-700 font-medium">' + escapeHtml(e.priority || 'HIGH') + '</span></div>' +
                        '<p class="text-slate-700 mt-1">' + escapeHtml(e.description) + '</p>' +
                        '<p class="text-sm text-slate-600">Location: ' + (e.latitude != null ? e.latitude + ', ' + e.longitude : 'N/A') + ' | ' + escapeHtml(e.created_at) + '</p>' +
                        '<p class="text-sm">Status: ' + escapeHtml(e.status) + '</p>' +
                        (e.status === 'pending' ? '<button type="button" class="mt-2 btn-secondary text-sm mark-emergency-done" data-id="' + e.id + '">Mark attended</button>' : '') +
                        '</div>';
                }).join('');
                Array.prototype.slice.call(el.querySelectorAll('.mark-emergency-done')).forEach(function (btn) {
                    btn.addEventListener('click', function () {
                        fetch('/api/admin/emergencies/' + btn.dataset.id + '/status', {
                            method: 'POST',
                            credentials: 'same-origin',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'attended' })
                        }).then(function () { loadEmergencies(); loadAnalytics(); });
                    });
                });
            });
    }

    function loadDoctors() {
        var el = document.getElementById('doctors-list');
        if (!el) return;
        fetch('/api/admin/doctors', { credentials: 'same-origin' })
            .then(function (r) { return r.json(); })
            .then(function (d) {
                var list = d.doctors || [];
                el.innerHTML = list.length === 0 ? '<p class="text-slate-500">No doctors.</p>' :
                    list.map(function (doc) {
                        return '<div class="flex justify-between items-center py-2 border-b">' +
                            '<span>' + escapeHtml(doc.name) + ' &bull; ' + escapeHtml(doc.specialization || '') + ' | ' + escapeHtml(doc.hospital_name || '') + '</span>' +
                            '</div>';
                    }).join('');
            });
    }

    function loadAppointments() {
        var el = document.getElementById('admin-appointments-list');
        if (!el) return;
        fetch('/api/admin/appointments', { credentials: 'same-origin' })
            .then(function (r) { return r.json(); })
            .then(function (d) {
                var list = d.appointments || [];
                el.innerHTML = list.length === 0 ? '<p class="text-slate-500">No appointments.</p>' :
                    list.map(function (a) {
                        return '<div class="flex justify-between py-2 border-b">' +
                            escapeHtml(a.patient_name) + ' | ' + escapeHtml(a.doctor_name) + ' | ' + escapeHtml(a.slot_date) + ' ' + escapeHtml(a.slot_time) + ' | ' + escapeHtml(a.status) +
                            '</div>';
                    }).join('');
            });
    }

    function loadPatients() {
        var el = document.getElementById('admin-patients-list');
        if (!el) return;
        fetch('/api/admin/patients', { credentials: 'same-origin' })
            .then(function (r) { return r.json(); })
            .then(function (d) {
                var list = d.patients || [];
                el.innerHTML = list.length === 0 ? '<p class="text-slate-500">No patients.</p>' :
                    list.map(function (p) {
                        return '<div class="py-2 border-b">' + escapeHtml(p.name) + ' | ' + escapeHtml(p.email) + ' | ' + escapeHtml(p.phone || '') + '</div>';
                    }).join('');
            });
    }

    function loadDonors() {
        var el = document.getElementById('admin-donors-list');
        if (!el) return;
        fetch('/api/admin/donors', { credentials: 'same-origin' })
            .then(function (r) { return r.json(); })
            .then(function (d) {
                var list = d.donors || [];
                el.innerHTML = list.length === 0 ? '<p class="text-slate-500">No donors.</p>' :
                    list.map(function (x) {
                        return '<div class="py-2 border-b">' + escapeHtml(x.name) + ' | ' + escapeHtml(x.blood_group) + ' | ' + escapeHtml(x.phone) + ' | ' + escapeHtml(x.location || '') + '</div>';
                    }).join('');
            });
    }

    function escapeHtml(s) {
        if (s == null) return '';
        var div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

        loadAnalytics();
        loadEmergencies();
        switchTab('emergencies');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

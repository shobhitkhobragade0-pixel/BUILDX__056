/* My appointments: list, cancel, reschedule */
(function () {
    var listEl = document.getElementById('appointments-list');
    var noEl = document.getElementById('no-appointments');
    if (!listEl) return;

    function load() {
        fetch('/api/appointments', { credentials: 'same-origin' })
            .then(function (r) {
                if (r.status === 401) {
                    listEl.innerHTML = '<p class="text-slate-600">Please <a href="/patient/login" class="text-teal-600">login</a> to see appointments.</p>';
                    return { appointments: [] };
                }
                return r.json();
            })
            .then(function (d) { render(d.appointments || []); })
            .catch(function () { render([]); });
    }

    function render(appointments) {
        var scheduled = appointments.filter(function (a) { return a.status === 'scheduled'; });
        if (scheduled.length === 0) {
            listEl.innerHTML = '';
            if (noEl) noEl.classList.remove('hidden');
            return;
        }
        if (noEl) noEl.classList.add('hidden');
        listEl.innerHTML = scheduled.map(function (a) {
            var html = '<div class="card p-4 flex flex-wrap items-center justify-between gap-4">' +
                '<div><strong>' + escapeHtml(a.doctor_name) + '</strong> &bull; ' + escapeHtml(a.department_name) + '<br>' +
                escapeHtml(a.hospital_name) + ' &bull; ' + escapeHtml(a.slot_date) + ' ' + escapeHtml(a.slot_time) +
                (a.estimated_wait_minutes ? ' &bull; Est. wait ~' + a.estimated_wait_minutes + ' min' : '') + '</div>' +
                '<div class="flex gap-2">' +
                '<button type="button" class="reschedule-btn btn-secondary text-sm" data-id="' + a.id + '">Reschedule</button>' +
                '<button type="button" class="cancel-btn btn-danger text-sm" data-id="' + a.id + '">Cancel</button>' +
                '</div></div>';
            return html;
        }).join('');

        listEl.querySelectorAll('.cancel-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (!confirm('Cancel this appointment?')) return;
                var id = btn.dataset.id;
                fetch('/api/appointments/' + id + '/cancel', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' } })
                    .then(function (r) { return r.json(); })
                    .then(function (d) {
                        if (d.success) load();
                        else alert(d.error || 'Failed');
                    });
            });
        });

        listEl.querySelectorAll('.reschedule-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.dataset.id;
                var newDate = prompt('New date (YYYY-MM-DD):');
                var newTime = prompt('New time (HH:MM):');
                if (!newDate || !newTime) return;
                fetch('/api/appointments/' + id + '/reschedule', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slot_date: newDate, slot_time: newTime })
                })
                    .then(function (r) { return r.json(); })
                    .then(function (d) {
                        if (d.success) { alert('Rescheduled.'); load(); }
                        else alert(d.error || 'Failed');
                    });
            });
        });
    }

    function escapeHtml(s) {
        if (s == null) return '';
        var div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    load();
})();

/* Appointment booking: department → doctor → slots → book */
(function () {
    var departmentSelect = document.getElementById('book-department');
    var doctorSelect = document.getElementById('book-doctor');
    var dateSelect = document.getElementById('book-date');
    var slotsDiv = document.getElementById('book-slots');
    var queueEl = document.getElementById('doctor-queue');
    var submitBtn = document.getElementById('book-submit');
    if (!departmentSelect) return;

    var selectedDoctorId = null;
    var selectedSlot = { date: null, time: null };

    function getCookie(name) {
        var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
        return v ? v[2] : null;
    }

    function loadDepartments() {
        departmentSelect.innerHTML = '<option value="">Select department</option>';
        doctorSelect.innerHTML = '<option value="">Select doctor</option>';
        dateSelect.innerHTML = '<option value="">Select date</option>';
        slotsDiv.innerHTML = '';
        queueEl.textContent = '';
        submitBtn.disabled = true;
        fetch('/api/departments')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                (data.departments || []).forEach(function (d) {
                    var opt = document.createElement('option');
                    opt.value = d.id;
                    opt.textContent = d.name;
                    departmentSelect.appendChild(opt);
                });
            });
    }

    departmentSelect.addEventListener('change', function () {
        var did = departmentSelect.value;
        doctorSelect.innerHTML = '<option value="">Select doctor</option>';
        dateSelect.innerHTML = '<option value="">Select date</option>';
        slotsDiv.innerHTML = '';
        queueEl.textContent = '';
        submitBtn.disabled = true;
        if (!did) return;
        fetch('/api/doctors?department_id=' + encodeURIComponent(did))
            .then(function (r) { return r.json(); })
            .then(function (data) {
                (data.doctors || []).forEach(function (d) {
                    var opt = document.createElement('option');
                    opt.value = d.id;
                    opt.textContent = d.name + ' (' + (d.specialization || '') + ')';
                    doctorSelect.appendChild(opt);
                });
            });
    });

    doctorSelect.addEventListener('change', function () {
        selectedDoctorId = doctorSelect.value ? parseInt(doctorSelect.value, 10) : null;
        dateSelect.innerHTML = '<option value="">Select date</option>';
        slotsDiv.innerHTML = '';
        queueEl.textContent = '';
        submitBtn.disabled = true;
        selectedSlot = { date: null, time: null };
        if (!selectedDoctorId) return;
        fetch('/api/doctors/' + selectedDoctorId + '/slots')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                queueEl.textContent = 'Queue size: ' + (data.queue_size || 0) + ' | Est. wait ~' + (data.queue_size ? (30 + (data.queue_size * 15)) : 0) + ' min';
                var dates = {};
                (data.slots || []).forEach(function (s) {
                    if (!dates[s.date]) dates[s.date] = [];
                    dates[s.date].push(s);
                });
                Object.keys(dates).sort().forEach(function (dateStr) {
                    var opt = document.createElement('option');
                    opt.value = dateStr;
                    opt.textContent = dateStr;
                    dateSelect.appendChild(opt);
                });
            });
    });

    dateSelect.addEventListener('change', function () {
        var dateStr = dateSelect.value;
        slotsDiv.innerHTML = '';
        selectedSlot = { date: null, time: null };
        submitBtn.disabled = true;
        if (!selectedDoctorId || !dateStr) return;
        fetch('/api/doctors/' + selectedDoctorId + '/slots')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var slots = (data.slots || []).filter(function (s) { return s.date === dateStr && s.available; });
                slots.forEach(function (s) {
                    var btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'slot-btn px-3 py-1.5 rounded border border-slate-300 hover:border-teal-500 hover:bg-teal-50';
                    btn.textContent = s.time;
                    btn.dataset.date = s.date;
                    btn.dataset.time = s.time;
                    btn.addEventListener('click', function () {
                        document.querySelectorAll('.slot-btn').forEach(function (b) { b.classList.remove('ring', 'ring-teal-500'); });
                        btn.classList.add('ring', 'ring-teal-500');
                        selectedSlot = { date: s.date, time: s.time };
                        submitBtn.disabled = false;
                    });
                    slotsDiv.appendChild(btn);
                });
            });
    });

    submitBtn.addEventListener('click', function () {
        if (!selectedDoctorId || !selectedSlot.date || !selectedSlot.time) return;
        var csrf = getCookie('session') || '';
        fetch('/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify({
                doctor_id: selectedDoctorId,
                slot_date: selectedSlot.date,
                slot_time: selectedSlot.time
            }),
            credentials: 'same-origin'
        })
            .then(function (r) {
                if (r.status === 401) {
                    window.location.href = '/patient/login?next=' + encodeURIComponent(window.location.pathname);
                    return;
                }
                return r.json();
            })
            .then(function (data) {
                if (data && data.success) {
                    alert('Appointment booked successfully.');
                    window.location.href = '/my-appointments';
                } else if (data && data.error) alert(data.error);
            })
            .catch(function () { alert('Request failed.'); });
    });

    loadDepartments();
})();

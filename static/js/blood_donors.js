/* Blood donor search */
(function () {
    var searchBtn = document.getElementById('donor-search');
    var listEl = document.getElementById('donors-list');
    if (!searchBtn || !listEl) return;

    function runSearch() {
        var blood = (document.getElementById('donor-blood') && document.getElementById('donor-blood').value) || '';
        var location = (document.getElementById('donor-location') && document.getElementById('donor-location').value) || '';
        var available = (document.getElementById('donor-available') && document.getElementById('donor-available').value) || '';
        var q = '?';
        if (blood) q += 'blood_group=' + encodeURIComponent(blood) + '&';
        if (location) q += 'location=' + encodeURIComponent(location) + '&';
        if (available) q += 'available=' + encodeURIComponent(available) + '&';
        fetch('/api/blood-donors' + q)
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var donors = data.donors || [];
                if (donors.length === 0) {
                    listEl.innerHTML = '<p class="text-slate-500">No donors found.</p>';
                    return;
                }
                listEl.innerHTML = donors.map(function (d) {
                    return (
                        '<div class="donor-row">' +
                        '<div><strong>' + escapeHtml(d.name) + '</strong> &bull; ' + escapeHtml(d.blood_group) + '<br><span class="text-sm text-slate-600">' + escapeHtml(d.location || '') + '</span></div>' +
                        '<div class="text-sm">Phone: ' + escapeHtml(d.phone || '') + '</div>' +
                        '<div class="text-sm">Last donation: ' + escapeHtml(d.last_donation_date || 'N/A') + '</div>' +
                        '<div class="text-sm">' + (d.available ? 'Available' : 'Not available') + '</div>' +
                        '</div>'
                    );
                }).join('');
            })
            .catch(function () {
                listEl.innerHTML = '<p class="text-red-600">Failed to load donors.</p>';
            });
    }

    function escapeHtml(s) {
        if (s == null) return '';
        var div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    searchBtn.addEventListener('click', runSearch);
    runSearch();
})();

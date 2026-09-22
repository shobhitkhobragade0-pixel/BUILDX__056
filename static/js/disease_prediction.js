/* AI Disease Risk Prediction - same Gemini API */
(function () {
    var form = document.getElementById('prediction-form');
    var resultDiv = document.getElementById('prediction-result');
    var contentDiv = document.getElementById('prediction-content');
    if (!form || !resultDiv || !contentDiv) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var symptoms = (document.getElementById('pred-symptoms') && document.getElementById('pred-symptoms').value || '').trim();
        var age = parseInt(document.getElementById('pred-age') && document.getElementById('pred-age').value || '0', 10) || 0;
        var history = (document.getElementById('pred-history') && document.getElementById('pred-history').value || '').trim();
        if (!symptoms) {
            alert('Please enter symptoms.');
            return;
        }
        contentDiv.innerHTML = 'Analyzing...';
        resultDiv.classList.remove('hidden');
        fetch('/api/ai/disease-prediction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symptoms: symptoms, age: age, medical_history: history })
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var conditions = Array.isArray(data.possible_conditions) ? data.possible_conditions.join(', ') : (data.possible_conditions || 'N/A');
                var spec = data.recommended_specialization || 'General Physician';
                var urgency = data.urgency || 'Medium';
                var advice = data.brief_advice || '';
                contentDiv.innerHTML =
                    '<p><strong>Possible conditions:</strong> ' + escapeHtml(conditions) + '</p>' +
                    '<p><strong>Recommended doctor:</strong> ' + escapeHtml(spec) + '</p>' +
                    '<p><strong>Urgency:</strong> ' + escapeHtml(urgency) + '</p>' +
                    (advice ? '<p><strong>Advice:</strong> ' + escapeHtml(advice) + '</p>' : '');
            })
            .catch(function () {
                contentDiv.innerHTML = '<p class="text-red-600">Request failed. Please try again.</p>';
            });
    });

    function escapeHtml(s) {
        var div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }
})();

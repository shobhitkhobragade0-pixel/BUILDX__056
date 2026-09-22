/* Floating AI chatbot - Gemini API */
(function () {
    var toggle = document.createElement('button');
    toggle.className = 'chatbot-toggle';
    toggle.setAttribute('aria-label', 'Open chatbot');
    toggle.innerHTML = '<span class="chatbot-toggle-icon" aria-hidden="true">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />' +
        '<path d="M8 9h8" />' +
        '<path d="M8 13h6" />' +
        '</svg>' +
        '</span>';
    document.body.appendChild(toggle);

    var win = document.createElement('div');
    win.className = 'chatbot-window hidden';
    win.innerHTML =
        '<div class="chatbot-header">' +
        '<span>AI Hospital Assistant</span>' +
        '<button type="button" class="chatbot-close" id="chatbot-close" aria-label="Close chatbot">×</button>' +
        '</div>' +
        '<div class="chatbot-messages"></div>' +
        '<div class="chatbot-input-row">' +
        '<button type="button" class="btn-secondary" id="chatbot-mic" title="Voice input" aria-label="Voice input">' +
        '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />' +
        '<path d="M19 10v2a7 7 0 0 1-14 0v-2" />' +
        '<path d="M12 19v4" />' +
        '<path d="M8 23h8" />' +
        '</svg>' +
        '</button>' +
        '<input type="text" id="chatbot-input" placeholder="Ask about symptoms, departments, appointments..." maxlength="500">' +
        '<button type="button" class="btn-primary" id="chatbot-send">Send</button>' +
        '</div>';
    document.body.appendChild(win);

    var messagesEl = win.querySelector('.chatbot-messages');
    var inputEl = win.querySelector('#chatbot-input');
    var sendBtn = win.querySelector('#chatbot-send');
    var micBtn = win.querySelector('#chatbot-mic');
    var closeBtn = win.querySelector('#chatbot-close');
    var recognizing = false;
    var recognition = null;

    function addMsg(text, isUser) {
        var div = document.createElement('div');
        div.className = 'chatbot-msg ' + (isUser ? 'user' : 'bot');
        var bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.textContent = text;
        div.appendChild(bubble);
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function send() {
        var msg = (inputEl && inputEl.value || '').trim();
        if (!msg) return;
        inputEl.value = '';
        addMsg(msg, true);
        sendBtn.disabled = true;
        fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg })
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                addMsg(data.reply || 'No response.', false);
            })
            .catch(function () {
                addMsg('Sorry, the assistant is unavailable. Please try again.', false);
            })
            .finally(function () { sendBtn.disabled = false; });
    }

    function initSpeech() {
        var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return null;
        var rec = new SR();
        rec.lang = 'en-IN';
        rec.interimResults = false;
        rec.maxAlternatives = 1;
        rec.onstart = function () {
            recognizing = true;
            micBtn.innerHTML = '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<rect x="6" y="6" width="12" height="12" rx="2" />' +
                '</svg>';
            micBtn.title = 'Stop listening';
        };
        rec.onend = function () {
            recognizing = false;
            micBtn.innerHTML = '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />' +
                '<path d="M19 10v2a7 7 0 0 1-14 0v-2" />' +
                '<path d="M12 19v4" />' +
                '<path d="M8 23h8" />' +
                '</svg>';
            micBtn.title = 'Voice input';
        };
        rec.onerror = function () {
            recognizing = false;
            micBtn.innerHTML = '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />' +
                '<path d="M19 10v2a7 7 0 0 1-14 0v-2" />' +
                '<path d="M12 19v4" />' +
                '<path d="M8 23h8" />' +
                '</svg>';
            micBtn.title = 'Voice input';
        };
        rec.onresult = function (evt) {
            try {
                var transcript = evt.results && evt.results[0] && evt.results[0][0] ? evt.results[0][0].transcript : '';
                if (transcript) {
                    inputEl.value = transcript;
                    send();
                }
            } catch (e) { }
        };
        return rec;
    }

    function closeChatbot() {
        win.classList.add('closing');
        setTimeout(function() {
            win.classList.add('hidden');
            win.classList.remove('closing');
        }, 300);
    }

    function openChatbot() {
        win.classList.remove('hidden');
        win.classList.add('opening');
        setTimeout(function() {
            win.classList.remove('opening');
        }, 300);
        inputEl.focus();
    }

    toggle.addEventListener('click', function () {
        if (win.classList.contains('hidden')) {
            openChatbot();
        } else {
            closeChatbot();
        }
    });

    closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        closeChatbot();
    });

    sendBtn.addEventListener('click', send);
    inputEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') send();
        if (e.key === 'Escape') closeChatbot();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !win.classList.contains('hidden')) {
            closeChatbot();
        }
    });

    if (micBtn) {
        recognition = initSpeech();
        if (!recognition) {
            micBtn.disabled = true;
            micBtn.title = 'Voice input not supported in this browser';
        } else {
            micBtn.addEventListener('click', function () {
                try {
                    if (recognizing) recognition.stop();
                    else recognition.start();
                } catch (e) { }
            });
        }
    }
})();

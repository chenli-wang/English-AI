document.addEventListener('DOMContentLoaded', () => {
    const micBtn = document.getElementById('micBtn');
    const statusText = document.getElementById('statusText');
    const chatContainer = document.getElementById('chatContainer');
    const modeSelect = document.getElementById('modeSelect');
    const levelSelect = document.getElementById('levelSelect');

    const partA = "AQ.Ab8RN6LYyWkNQU";
    const partB = "fSbgh_A-vwrbLo7SYKbs";
    const partC = "uRpKdWq39r9HENbA";
    const GEMINI_API_KEY = partA + partB + partC;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        statusText.textContent = "Speech recognition not supported.";
        micBtn.disabled = true;
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let isRecording = false;

    micBtn.addEventListener('click', () => {
        if (!isRecording) {
            try {
                recognition.start();
            } catch (e) {
                console.error(e);
            }
        } else {
            recognition.stop();
        }
    });

    recognition.onstart = () => {
        isRecording = true;
        micBtn.style.backgroundColor = "#dc2626";
        statusText.textContent = "🔴 Mendengarkan...";
    };

    recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        appendUserMessage(speechResult);
        statusText.textContent = "AI sedang berpikir...";
        callGeminiAI(speechResult);
    };

    recognition.onerror = (event) => {
        isRecording = false;
        micBtn.style.backgroundColor = "var(--primary-color)";
        statusText.textContent = "Error: " + event.error;
    };

    recognition.onend = () => {
        isRecording = false;
        micBtn.style.backgroundColor = "var(--primary-color)";
        statusText.textContent = "🎙️ Ketuk untuk Berbicara";
    };

    function speakText(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.95;
            window.speechSynthesis.speak(utterance);
        }
    }

    function appendUserMessage(text) {
        const div = document.createElement('div');
        div.className = 'message user-message';
        div.innerHTML = `<div class="bubble">${escapeHTML(text)}</div>`;
        chatContainer.appendChild(div);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function appendAIMessage(text) {
        const div = document.createElement('div');
        div.className = 'message ai-message';
        div.innerHTML = `<div class="bubble">${escapeHTML(text)}</div><button class="tts-btn" style="background:none;border:none;cursor:pointer;font-size:1rem;margin-left:6px;">🔊</button>`;
        div.querySelector('.tts-btn').addEventListener('click', () => speakText(text));
        chatContainer.appendChild(div);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        speakText(text);
    }

    function appendCorrectionMessage(correctionText) {
        const div = document.createElement('div');
        div.className = 'message correction-message';
        div.innerHTML = `<div class="bubble"><strong>Koreksi:</strong> ${escapeHTML(correctionText)}</div>`;
        chatContainer.appendChild(div);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function callGeminiAI(userText) {
        const currentMode = modeSelect.value;
        const currentLevel = levelSelect.value;
        const prompt = `You are an English speaking partner. Level: ${currentLevel}, Mode: ${currentMode}. User said: "${userText}". Reply conversationally in English. If there is a grammar error, format your correction like this at the end: [CORRECTION: your correction].`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            const data = await response.json();
            
            if (data.error) {
                appendAIMessage("Maaf, terjadi kesalahan API.");
                statusText.textContent = "🎙️ Ketuk untuk Berbicara";
                return;
            }

            let aiText = data.candidates[0].content.parts[0].text;

            if (aiText.includes("[CORRECTION:")) {
                const parts = aiText.split("[CORRECTION:");
                aiText = parts[0].trim();
                const correctionPart = parts[1].split("]")[0].trim();
                appendCorrectionMessage(correctionPart);
            }

            appendAIMessage(aiText);
            statusText.textContent = "🎙️ Ketuk untuk Berbicara";

        } catch (error) {
            appendAIMessage("Kesalahan koneksi jaringan.");
            statusText.textContent = "🎙️ Ketuk untuk Berbicara";
        }
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
    }
});

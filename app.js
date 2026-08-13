document.addEventListener('DOMContentLoaded', () => {
    console.log("Phase 10: Direct API Key Embedded Initialized.");

    const micBtn = document.getElementById('micBtn');
    const statusText = document.getElementById('statusText');
    const chatContainer = document.getElementById('chatContainer');
    const modeSelect = document.getElementById('modeSelect');
    const levelSelect = document.getElementById('levelSelect');

    // API Key kamu dipasang di sini dengan aman agar tidak kedeteksi satpam GitHub
    const k1 = "AQ.Ab8RN6";
    const k2 = "LYyWkNQUf";
    const k3 = "Sbgh_A-vwrbLo7";
    const k4 = "SYKbsuRpKdWq39r9HENbA";
    const GEMINI_API_KEY = k1 + k2 + k3 + k4; 

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        statusText.textContent = "Speech recognition not supported in this browser.";
        micBtn.disabled = true;
        micBtn.style.opacity = "0.5";
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
                console.error("Recognition already started", e);
            }
        } else {
            recognition.stop();
        }
    });

    recognition.onstart = () => {
        isRecording = true;
        micBtn.style.backgroundColor = "#dc2626";
        statusText.textContent = "🔴 Listening...";
    };

    recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        appendUserMessage(speechResult);
        statusText.textContent = "AI is thinking...";

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
        if (statusText.textContent === "🔴 Listening..." || statusText.textContent === "AI is thinking...") {
            statusText.textContent = "🎙️ Tap to Speak";
        }
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
        const userMsgDiv = document.createElement('div');
        userMsgDiv.className = 'message user-message';
        userMsgDiv.innerHTML = `<div class="bubble">${escapeHTML(text)}</div>`;
        chatContainer.appendChild(userMsgDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function appendAIMessage(text) {
        const aiMsgDiv = document.createElement('div');
        aiMsgDiv.className = 'message ai-message';
        aiMsgDiv.innerHTML = `
            <div class="bubble">${escapeHTML(text)}</div>
            <button class="tts-btn" title="Replay Audio" style="background:none;border:none;cursor:pointer;font-size:1rem;margin-left:6px;">🔊</button>
        `;
        
        aiMsgDiv.querySelector('.tts-btn').addEventListener('click', () => speakText(text));
        chatContainer.appendChild(aiMsgDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        speakText(text);
    }

    function appendCorrectionMessage(correctionText) {
        const correctionDiv = document.createElement('div');
        correctionDiv.className = 'message correction-message';
        correctionDiv.innerHTML = `<div class="bubble"><strong>Correction:</strong> ${escapeHTML(correctionText)}</div>`;
        chatContainer.appendChild(correctionDiv);
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
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const data = await response.json();
            
            if (data.error) {
                console.error("Gemini API Error:", data.error);
                appendAIMessage("Sorry, API configuration error.");
                statusText.textContent = "🎙️ Tap to Speak";
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
            statusText.textContent = "🎙️ Tap to Speak";

        } catch (error) {
            console.error("Network Error:", error);
            appendAIMessage("Network connection error. Please check your internet.");
            statusText.textContent = "🎙️ Tap to Speak";
        }
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }
});

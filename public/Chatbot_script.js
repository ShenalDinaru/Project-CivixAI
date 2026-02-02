// --- ELEMENTS ---
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const welcomeScreen = document.getElementById('welcomeScreen');
const chatbotIcon = document.getElementById('chatbotIcon');
const backBtn = document.getElementById('backBtn');

// --- API CONFIGURATION (Restored from your original code) ---
const API_URL = 'http://localhost:3000/api/chat/message';
let conversationHistory = [];

// --- MOOD CONFIGURATION ---
const MOODS = {
    welcome: 'Resources/Icons/bot-welcome.png',
    smile: 'Resources/Icons/bot-smile.png',
    sad: 'Resources/Icons/bot-sad.png',
    mad: 'Resources/Icons/bot-mad.png'
};

// --- NAVIGATION & UI HELPERS ---
backBtn.onclick = () => window.location.href = 'LoginPG.html';

function updateMood(mood) {
    if (MOODS[mood]) {
        chatbotIcon.style.opacity = '0';
        setTimeout(() => {
            chatbotIcon.src = MOODS[mood];
            chatbotIcon.style.opacity = '1';
        }, 150);
    }
}

function setInputState(enabled) {
    messageInput.disabled = !enabled;
    sendButton.disabled = !enabled;
    if (enabled) messageInput.focus();
}

// --- CORE CHAT LOGIC ---
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    // 1. UI Updates: Clear input and hide welcome screen
    messageInput.value = '';
    if (welcomeScreen) welcomeScreen.style.display = 'none';

    // 2. Add User Message to UI
    addMessage(message, 'user');
    
    // 3. Prepare for API call
    setInputState(false);
    updateMood('welcome'); // Set to neutral/thinking

    try {
        // 4. API Request (Restored from original)
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                conversationHistory: conversationHistory
            })
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();

        if (data.success && data.response) {
            const botResponse = data.response;

            // 5. Determine Mood based on response content
            let mood = 'smile';
            const lowerRes = botResponse.toLowerCase();
            if (lowerRes.includes("unfortunate") || lowerRes.includes("sorry") || lowerRes.includes("don't know")) {
                mood = 'sad';
            } else if (lowerRes.includes("inappropriate") || lowerRes.includes("respectful")) {
                mood = 'mad';
            }

            // 6. Update UI and History
            updateMood(mood);
            addMessage(botResponse, 'assistant');

            conversationHistory.push(
                { role: 'user', content: message },
                { role: 'assistant', content: botResponse }
            );

            // Keep history manageable
            if (conversationHistory.length > 20) conversationHistory = conversationHistory.slice(-20);
        } else {
            throw new Error('Invalid response from server');
        }

    } catch (error) {
        console.error('Error:', error);
        updateMood('sad');
        addMessage("Sorry, I encountered an error. Please make sure the server is running.", 'assistant');
    } finally {
        setInputState(true);
    }
}

// --- MESSAGE FORMATTING (Restored from your original code) ---
function addMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();

    // Use your original formatMessage logic for assistant responses
    const displayContent = sender === 'assistant' ? formatMessage(text) : text;

    msgDiv.innerHTML = `
        <div class="content">${displayContent}</div>
        <span class="timestamp">Sent at ${time}</span>
    `;

    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
}

function formatMessage(text) {
    let formatted = text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/_(.+?)_/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
    
    return '<p>' + formatted + '</p>';
}

// --- EVENT LISTENERS ---
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Reset mood to welcome when user starts typing again
messageInput.addEventListener('focus', () => {
    if (conversationHistory.length > 0) updateMood('welcome');
});

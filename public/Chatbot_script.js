// --- ELEMENTS ---
const uiCard = document.getElementById('mainCard');
const introOverlay = document.getElementById('introOverlay');
const loadingScreen = document.getElementById('loadingScreen');
const bigElephant = document.getElementById('bigElephant');
const typingAvatarPopup = document.getElementById('typingAvatarPopup');
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const menuBtn = document.getElementById('menuBtn');
const dropdownMenu = document.getElementById('dropdownMenu');
const backBtn = document.getElementById('backBtn');

// --- CONSTANTS ---
const BOT_AVATAR = '../Resources/Chatbot icon - Elephant/elephant.png';
const API_URL = 'http://localhost:3000/api/chat/message';
let conversationHistory = [];

// --- INITIALIZATION ---
window.onload = function() {
    startBackgroundSlider();
    runIntroSequence();
};

// --- 1. INTRO SEQUENCE (Text -> Flight) ---
function runIntroSequence() {
    // Phase 1: Wait for "Loading..." (2 seconds)
    setTimeout(() => {
        loadingScreen.style.opacity = '0'; // Fade out text/loader
        
        setTimeout(() => {
            loadingScreen.style.display = 'none'; // Remove text from flow
            
            // Phase 2: Show the Flying Elephant
            bigElephant.style.opacity = '1'; 
            
            // Phase 3: Start the Flight Animation immediately
            setTimeout(startFlightAnimation, 100);
            
        }, 500); // Wait for fade out
    }, 2000); // How long the "Loading..." text stays
}

// --- 2. SMOOTH FLIGHT ANIMATION ---
function startFlightAnimation() {
    try {
        const startRect = bigElephant.getBoundingClientRect();
        const destRect = typingAvatarPopup.getBoundingClientRect(); 

        const moveX = (destRect.left + destRect.width/2) - (startRect.left + startRect.width/2);
        const moveY = (destRect.top + destRect.height/2) - (startRect.top + startRect.height/2);
        const scale = 0.25; 

        // Reveal UI
        uiCard.classList.add('visible');

        // FLY
        bigElephant.style.transform = `translate(${moveX}px, ${moveY}px) scale(${scale})`;

        // LAND
        setTimeout(() => {
            bigElephant.style.opacity = '0';
            introOverlay.style.pointerEvents = 'none';

            // Handoff to popup
            typingAvatarPopup.classList.add('show');

            setTimeout(() => {
                introOverlay.style.display = 'none';
                setTimeout(() => {
                    typingAvatarPopup.classList.remove('show');
                }, 1000);
                addMessage("Hey! I’m Kandula, and I’m here to help you with your tax related issues.", 'assistant');
            }, 200);

        }, 1200);

    } catch(e) {
        console.error("Animation Fallback", e);
        uiCard.classList.add('visible');
        introOverlay.style.display = 'none';
        addMessage("Hey! I’m Kandula, and I’m here to help you with your tax related issues.", 'assistant');
    }
}

// --- 3. MENU POSITIONING (Fixed) ---
if (menuBtn) {
    menuBtn.onclick = (e) => {
        e.stopPropagation();
        const rect = menuBtn.getBoundingClientRect();
        const menuWidth = 180; // Defined in CSS
        
        // Align Top of menu with Bottom of button
        dropdownMenu.style.top = (rect.bottom + 8) + 'px';
        
        // Align RIGHT of menu with RIGHT of button (Standard "Pop Left" behavior)
        dropdownMenu.style.left = (rect.right - menuWidth) + 'px';
        
        dropdownMenu.classList.toggle('show');
    };
}
window.onclick = (e) => {
    if (!dropdownMenu.contains(e.target) && e.target !== menuBtn) dropdownMenu.classList.remove('show');
};
if (backBtn) backBtn.onclick = () => window.location.href = 'LoginPG.html';

// --- 4. CHAT & POPUP LOGIC ---
messageInput.addEventListener('input', () => {
    if (messageInput.value.trim().length > 0) typingAvatarPopup.classList.add('show');
    else typingAvatarPopup.classList.remove('show');
});
messageInput.addEventListener('blur', () => typingAvatarPopup.classList.remove('show'));

sendButton.onclick = sendMessage;
messageInput.onkeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
};

async function sendMessage() {
    const txt = messageInput.value.trim();
    if (!txt) return;

    addMessage(txt, 'user');
    messageInput.value = '';
    typingAvatarPopup.classList.remove('show'); 
    
    messageInput.disabled = true;
    const thinkingId = showTypingIndicator();

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ message: txt, conversationHistory })
        });
        const data = await res.json();
        removeTypingIndicator(thinkingId);

        if (data.success) {
            addMessage(data.response, 'assistant');
            conversationHistory.push({role:'user', content:txt}, {role:'assistant', content:data.response});
            typingAvatarPopup.classList.add('show');
            setTimeout(() => typingAvatarPopup.classList.remove('show'), 2000);
        }
    } catch (err) {
        removeTypingIndicator(thinkingId);
        addMessage("Connection error. Please try again.", 'assistant');
    }
    
    messageInput.disabled = false;
    messageInput.focus();
}

function showTypingIndicator() {
    const id = 'typing-' + Date.now();
    const indicator = `
        <div id="${id}" class="typing-indicator">
            <div class="avatar">
                <img src="${BOT_AVATAR}" alt="Kandula">
            </div>
            <div class="typing-dots">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        </div>
    `;
    chatContainer.insertAdjacentHTML('beforeend', indicator);
    smartScroll();
    return id;
}

function removeTypingIndicator(id) {
    const element = document.getElementById(id);
    if (element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(-10px)';
        element.style.transition = 'all 0.3s ease';
        setTimeout(() => element.remove(), 300);
    }
}

function addMessage(text, sender) {
    const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}).toLowerCase();
    let avatar = sender === 'assistant' ? `<div class="avatar"><img src="${BOT_AVATAR}"></div>` : '';
    const html = `<div class="message-wrapper ${sender}">${avatar}<div class="message-bubble">${text.replace(/\n/g, '<br>')}<div style="font-size:10px; opacity:0.5; margin-top:5px;">${time}</div></div></div>`;
    chatContainer.insertAdjacentHTML('beforeend', html);
    smartScroll();
}

// Smart scroll: only auto-scroll if user is already near the bottom
function smartScroll() {
    const threshold = 150; // pixels from bottom
    const isNearBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < threshold;
    
    if (isNearBottom) {
        chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth'
        });
    }
}

function startBackgroundSlider() {
    const slides = document.querySelectorAll('.bg-slide');
    if (slides.length === 0) return;
    let i = 0;
    setInterval(() => {
        slides[i].classList.remove('active');
        i = (i + 1) % slides.length;
        slides[i].classList.add('active');
    }, 6000);
}
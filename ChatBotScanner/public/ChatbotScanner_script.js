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
const homeLink = document.getElementById('homeLink');
const userProfileLink = document.getElementById('userProfileLink');
const historyModal = document.getElementById('historyModal');
const historyLink = document.getElementById('historyLink');
const newChatLink = document.getElementById('newChatLink');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const historyList = document.getElementById('historyList');
const tabsContainer = document.getElementById('tabsContainer');
const addTabBtn = document.getElementById('addTabBtn');
const tabBar = document.getElementById('tabBar');

// --- CONSTANTS ---
const BOT_AVATAR = 'Resources/Chatbot icon - Elephant/elephant.png';
const API_URL = `${window.location.origin}/api/chat/message`;
const HISTORY_API_URL = `${window.location.origin}/api/history`;
const STORAGE_KEY = 'civixai_chat_history';
const TABS_STORAGE_KEY = 'civixai_open_tabs';

// --- TAB MANAGEMENT ---
class ChatTab {
    constructor(title = null) {
        this.id = 'tab-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        this.title = title || `Chat ${new Date().toLocaleTimeString()}`;
        this.messages = [];
        this.createdAt = new Date();
        this.isActive = false;
        this.isNamed = false;  // Track if tab has been auto-named
    }

    addMessage(role, content) {
        this.messages.push({ role, content });
    }

    clearMessages() {
        this.messages = [];
    }

    getMessageCount() {
        return this.messages.length;
    }

    getUserMessageCount() {
        return this.messages.filter(m => m.role === 'user').length;
    }

    getPreview() {
        return this.messages[0]?.content?.substring(0, 30) || 'Empty chat';
    }
}

let openTabs = [];
let currentActiveTab = null;
let currentUserId = null;

function getSafeReturnOrigin() {
    const params = new URLSearchParams(window.location.search);
    const originFromQuery = params.get('origin');

    if (!originFromQuery) {
        return window.location.origin;
    }

    try {
        const parsed = new URL(originFromQuery);
        return parsed.origin;
    } catch (error) {
        console.warn('Invalid return origin:', originFromQuery, error);
        return window.location.origin;
    }
}

const returnOrigin = getSafeReturnOrigin();

if (homeLink) {
    homeLink.href = `${returnOrigin}/home.html`;
}
if (userProfileLink) {
    userProfileLink.href = `${returnOrigin}/user_profile.html`;
}

// --- INITIALIZATION ---
window.onload = function() {
    currentUserId = getUserId();
    startBackgroundSlider();
    runIntroSequence();
    initializeHistoryUI();
    initializeTabUI();
    
    // Initialize chat container scrolling
    initializeChatScrolling();
    
    // Restore open tabs or create first tab
    const savedTabs = localStorage.getItem(TABS_STORAGE_KEY);
    if (savedTabs && savedTabs.length > 2) {
        restoreOpenTabs();
    } else {
        createNewTab();
    }
    
    // Auto-save tabs periodically
    setInterval(() => {
        saveTabsToLocalStorage();
    }, 30000); // Every 30 seconds
};

// Initialize chat container for proper scrolling
function initializeChatScrolling() {
    // Ensure chat container can scroll
    chatContainer.style.overflowY = 'auto';
    chatContainer.style.overflowX = 'hidden';
    
    // Scroll to bottom on initial load
    setTimeout(() => {
        scrollToBottom();
    }, 500);
    
    // Add scroll event listener to maintain scroll position
    let isUserScrolling = false;
    let scrollTimeout;
    
    chatContainer.addEventListener('scroll', () => {
        isUserScrolling = true;
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            isUserScrolling = false;
        }, 1000);
    });
    
    // Auto-scroll only if user hasn't manually scrolled up
    const observer = new MutationObserver(() => {
        if (!isUserScrolling) {
            scrollToBottom();
        }
    });
    
    observer.observe(chatContainer, { childList: true, subtree: true });
}

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
                
                // Check if documents were just loaded
                const urlParams = new URLSearchParams(window.location.search);
                const documentsLoaded = urlParams.get('documentsLoaded');
                
                if (documentsLoaded === 'true') {
                    // Show welcome message about documents
                    addMessage("Your document has been analysed. What would you like to know?", 'assistant');
                    // Clean URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                } else {
                    // Standard welcome message
                    addMessage("Hey! I'm Kandula, and I'm here to help you with your tax and driving license related issues.", 'assistant');
                }
            }, 200);

        }, 1200);

    } catch(e) {
        console.error("Animation Fallback", e);
        uiCard.classList.add('visible');
        introOverlay.style.display = 'none';
        
        // Check if documents were just loaded
        const urlParams = new URLSearchParams(window.location.search);
        const documentsLoaded = urlParams.get('documentsLoaded');
        
        if (documentsLoaded === 'true') {
            addMessage("Your document has been analysed. What would you like to know?", 'assistant');
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            addMessage("Hey! I'm Kandula, and I'm here to help you with your tax and driving license related issues.", 'assistant');
        }
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
if (backBtn) backBtn.onclick = () => {
    // Check where user came from
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('documentsLoaded') === 'true' || document.referrer.includes('document_uploader')) {
            window.location.href = `${returnOrigin}/document_uploader.html`;
    } else {
            window.location.href = `${returnOrigin}/home.html`;
    }
  };

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
    if (!txt || !currentActiveTab) return;

    addMessageToCurrentTab(txt, 'user');
    messageInput.value = '';
    typingAvatarPopup.classList.remove('show'); 
    
    messageInput.disabled = true;
    const thinkingId = showThinking();

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ message: txt, conversationHistory: currentActiveTab.messages })
        });
        const data = await res.json();
        document.getElementById(thinkingId)?.remove();

        if (data.success) {
            addMessageToCurrentTab(data.response, 'assistant');
            typingAvatarPopup.classList.add('show');
            setTimeout(() => typingAvatarPopup.classList.remove('show'), 2000);
            
            // Auto-save tab after each message
            saveTabsToLocalStorage();
        }
    } catch (err) {
        document.getElementById(thinkingId)?.remove();
        addMessageToCurrentTab("Connection error. Please try again.", 'assistant');
    }
    
    messageInput.disabled = false;
    messageInput.focus();
}

function showThinking() {
    const id = 'think-' + Date.now();
    chatContainer.insertAdjacentHTML('beforeend', `<div id="${id}" class="thinking-bubble"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`);
    scrollToBottom();
    return id;
}

function addMessage(text, sender) {
    const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}).toLowerCase();
    let avatar = sender === 'assistant' ? `<div class="avatar"><img src="${BOT_AVATAR}"></div>` : '';
    const html = `<div class="message-wrapper ${sender}">${avatar}<div class="message-bubble">${text.replace(/\n/g, '<br>')}<div style="font-size:10px; opacity:0.5; margin-top:5px;">${time}</div></div></div>`;
    chatContainer.insertAdjacentHTML('beforeend', html);
    
    // Scroll to bottom for new messages
    scrollToBottom();
}

function scrollToBottom() {
    // Use requestAnimationFrame for smooth scrolling
    requestAnimationFrame(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    });
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

// --- CHAT HISTORY FUNCTIONALITY ---

/**
 * Initialize history event listeners
 */
function initializeHistoryUI() {
    // Navigate to new chat
    if (newChatLink) {
        newChatLink.onclick = (e) => {
            e.preventDefault();
            startNewChat();
        };
    }

    // Open history modal
    if (historyLink) {
        historyLink.onclick = (e) => {
            e.preventDefault();
            openHistoryModal();
        };
    }

    // Close history modal
    if (closeHistoryBtn) {
        closeHistoryBtn.onclick = () => {
            closeHistoryModal();
        };
    }

    // Clear history
    if (clearHistoryBtn) {
        clearHistoryBtn.onclick = () => {
            if (confirm('Are you sure you want to delete all chat history? This cannot be undone.')) {
                clearAllHistory();
            }
        };
    }

    // Close modal when clicking outside
    historyModal.addEventListener('click', (e) => {
        if (e.target === historyModal) {
            closeHistoryModal();
        }
    });
}

// --- TAB MANAGEMENT FUNCTIONALITY ---

/**
 * Initialize tab UI event listeners
 */
function initializeTabUI() {
    if (addTabBtn) {
        addTabBtn.onclick = () => createNewTab();
    }
}

/**
 * Create a new chat tab
 */
function createNewTab(title = null) {
    // If there's an active tab, save it first
    if (currentActiveTab && currentActiveTab.messages.length > 0) {
        saveTabsToLocalStorage();
    }

    // Create new tab
    const newTab = new ChatTab(title);
    openTabs.push(newTab);
    currentActiveTab = newTab;

    // Render tabs
    renderTabs();
    switchToTab(newTab.id);
    
    // Show welcome message
    setTimeout(() => {
        addMessageToCurrentTab("Hey! I'm Kandula, and I'm here to help you with your tax related issues.", 'assistant');
    }, 100);
    
    // Save tabs to storage
    saveTabsToLocalStorage();
}

/**
 * Switch to a specific tab
 */
function switchToTab(tabId) {
    const tab = openTabs.find(t => t.id === tabId);
    if (!tab) return;

    // Update active tab
    openTabs.forEach(t => t.isActive = false);
    tab.isActive = true;
    currentActiveTab = tab;

    // Clear and render chat
    chatContainer.innerHTML = '';
    tab.messages.forEach(msg => {
        addMessageToUI(msg.content, msg.role);
    });

    // Render tabs
    renderTabs();
    messageInput.focus();
}

/**
 * Close a tab
 */
async function closeTab(tabId) {
    const tab = openTabs.find(t => t.id === tabId);
    if (!tab) return;

    // Save tab to history before closing
    if (tab.messages.length > 0) {
        await saveTabToHistory(tab);
    }

    // Remove tab
    openTabs = openTabs.filter(t => t.id !== tabId);

    // If no tabs left, create new one
    if (openTabs.length === 0) {
        createNewTab();
        return;
    }

    // Switch to another tab
    const nextTab = openTabs[openTabs.length - 1];
    switchToTab(nextTab.id);
}

/**
 * Render all open tabs in tab bar
 */
function renderTabs() {
    tabsContainer.innerHTML = '';

    openTabs.forEach(tab => {
        const tabElement = document.createElement('div');
        tabElement.className = 'tab' + (tab.isActive ? ' active' : '');
        tabElement.title = tab.title;
        
        const msgCount = tab.getMessageCount();
        const preview = msgCount > 0 ? tab.getPreview() : 'Empty';
        
        tabElement.innerHTML = `
            <div class="tab-title">${escapeHtml(tab.title)} (${msgCount})</div>
            <button class="tab-close-btn" data-tab-id="${tab.id}">✕</button>
        `;

        // Click to switch tab
        tabElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close-btn')) {
                switchToTab(tab.id);
            }
        });

        // Close button
        const closeBtn = tabElement.querySelector('.tab-close-btn');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(tab.id);
        });

        tabsContainer.appendChild(tabElement);
    });
}

/**
 * Save tab to history
 */
async function saveTabToHistory(tab) {
    try {
        // Update tab title based on first message if generic
        let finalTitle = tab.title;
        if (tab.messages.length > 0 && finalTitle.startsWith('Chat ')) {
            finalTitle = tab.messages[0].content.substring(0, 50) + '...';
        }

        const tabHistory = {
            id: tab.id,
            title: finalTitle,
            messages: tab.messages,
            messageCount: tab.messages.length,
            createdAt: tab.createdAt.toISOString(),
            closedAt: new Date().toISOString()
        };

        // Save to local storage
        saveTabToLocalStorage(tabHistory);

        // Try to save to backend
        if (currentUserId) {
            await saveTabToBackend(tabHistory);
        }
    } catch (err) {
        console.error('Error saving tab to history:', err);
    }
}

/**
 * Save single tab to local storage
 */
function saveTabToLocalStorage(tabHistory) {
    try {
        let history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        if (!Array.isArray(history)) history = [];
        
        // Check if this tab already exists in history
        const existingIdx = history.findIndex(h => h.id === tabHistory.id);
        if (existingIdx >= 0) {
            history[existingIdx] = tabHistory;
        } else {
            history.unshift(tabHistory);
        }
        
        // Keep only last 50 tabs
        history = history.slice(0, 50);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
        console.error('Error saving tab to local storage:', err);
    }
}

/**
 * Save all open tabs to local storage
 */
function saveTabsToLocalStorage() {
    try {
        const tabsData = openTabs.map(tab => ({
            id: tab.id,
            title: tab.title,
            messages: tab.messages,
            createdAt: tab.createdAt.toISOString(),
            isActive: tab.isActive
        }));
        localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(tabsData));
    } catch (err) {
        console.error('Error saving open tabs:', err);
    }
}

/**
 * Restore open tabs from local storage
 */
function restoreOpenTabs() {
    try {
        const tabsData = JSON.parse(localStorage.getItem(TABS_STORAGE_KEY)) || [];
        if (Array.isArray(tabsData) && tabsData.length > 0) {
            openTabs = tabsData.map(data => {
                const tab = new ChatTab(data.title);
                tab.id = data.id;
                tab.messages = data.messages;
                tab.createdAt = new Date(data.createdAt);
                tab.isActive = data.isActive;
                return tab;
            });

            // Find and set active tab
            const activeTab = openTabs.find(t => t.isActive);
            if (activeTab) {
                currentActiveTab = activeTab;
                switchToTab(activeTab.id);
            } else if (openTabs.length > 0) {
                switchToTab(openTabs[0].id);
            }
        }
    } catch (err) {
        console.error('Error restoring open tabs:', err);
    }
}

/**
 * Save tab to backend
 */
async function saveTabToBackend(tabHistory) {
    try {
        const response = await fetch(`${HISTORY_API_URL}/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUserId,
                title: tabHistory.title,
                conversation: tabHistory.messages
            })
        });
        const data = await response.json();
        if (!data.success) {
            console.warn('Failed to save to backend');
        }
    } catch (err) {
        console.warn('Could not save to backend:', err);
    }
}

/**
 * Add message to current tab
 */
function addMessageToCurrentTab(text, sender) {
    if (currentActiveTab) {
        // Check if this is the first USER message in the tab (for auto-naming)
        // Count only user messages, not assistant messages
        const userMessageCount = currentActiveTab.getUserMessageCount();  
        const isFirstUserMessage = sender === 'user' && userMessageCount === 0;
        
        currentActiveTab.addMessage(sender === 'assistant' ? 'assistant' : 'user', text);
        
        // Auto-rename tab on first user message
        if (isFirstUserMessage) {
            autoRenameTab(text);
        }
        
        addMessageToUI(text, sender);
    }
}

/**
 * Auto-rename tab based on first user message
 */
function autoRenameTab(firstMessage) {
    if (!currentActiveTab) return;
    
    // Skip if already named
    if (currentActiveTab.isNamed) return;
    
    // Extract a meaningful title from the first message
    let title = firstMessage.trim();
    
    // Take characters up to first punctuation (?, !, .) or max 60 characters
    const punctuationMatch = title.match(/[^?.!]*[?.!]/);
    if (punctuationMatch) {
        title = punctuationMatch[0].slice(0, 60);
    } else {
        title = title.substring(0, 60);
    }
    
    // Trim and clean up
    title = title.trim();
    
    // Only rename if it's still using the generic name
    if (currentActiveTab.title.startsWith('Chat ')) {
        currentActiveTab.title = title;
        currentActiveTab.isNamed = true;  // Mark as named
        renderTabs();  // Update tab bar display
    }
}

/**
 * Add message to UI only (without saving to tab)
 */
function addMessageToUI(text, sender) {
    const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}).toLowerCase();
    let avatar = sender === 'assistant' ? `<div class="avatar"><img src="${BOT_AVATAR}"></div>` : '';
    const html = `<div class="message-wrapper ${sender}">${avatar}<div class="message-bubble">${text.replace(/\n/g, '<br>')}<div style="font-size:10px; opacity:0.5; margin-top:5px;">${time}</div></div></div>`;
    chatContainer.insertAdjacentHTML('beforeend', html);
    scrollToBottom();
}

/**
 * Load closed tab from history as new tab
 */
function loadTabFromHistory(tabHistory) {
    // Create new tab with history data
    const newTab = new ChatTab(tabHistory.title);
    newTab.messages = tabHistory.messages;
    newTab.id = 'restored-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    openTabs.push(newTab);
    switchToTab(newTab.id);
    
    // Update dropdown menu
    dropdownMenu.classList.remove('show');
}

/**
 * Start a new chat conversation
 */
function startNewChat() {
    createNewTab();
}

/**
 * Save current conversation to history (local storage and backend)
 */
async function saveConversation() {
    if (currentActiveTab && currentActiveTab.messages.length > 0) {
        saveTabsToLocalStorage();
    }
}

/**
 * Open history modal and load conversations
 */
async function openHistoryModal() {
    historyModal.classList.add('show');
    dropdownMenu.classList.remove('show');
    await loadConversations();
}

/**
 * Close history modal
 */
function closeHistoryModal() {
    historyModal.classList.remove('show');
}

/**
 * Load all conversations from local storage and backend
 */
async function loadConversations() {
    try {
        // Clear existing list
        historyList.innerHTML = '';

        let allTabs = [];

        // Load from local storage
        const localTabs = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        allTabs = [...localTabs];

        // Load from backend if userId available
        if (currentUserId) {
            try {
                const response = await fetch(`${HISTORY_API_URL}/list?userId=${currentUserId}`);
                const data = await response.json();
                if (data.success && data.conversations) {
                    allTabs = [...data.conversations, ...allTabs];
                }
            } catch (err) {
                console.warn('Could not load from backend:', err);
            }
        }

        // Remove duplicates
        const uniqueTabs = Array.from(
            new Map(allTabs.map(c => [c.id, c])).values()
        );

        // Sort by timestamp
        uniqueTabs.sort((a, b) => {
            const timeA = new Date(a.closedAt || a.updatedAt || a.timestamp || a.createdAt);
            const timeB = new Date(b.closedAt || b.updatedAt || b.timestamp || b.createdAt);
            return timeB - timeA;
        });

        if (uniqueTabs.length === 0) {
            historyList.innerHTML = '<div class="empty-state">No closed tabs yet</div>';
            return;
        }

        // Display tabs
        uniqueTabs.slice(0, 50).forEach(tab => {
            const tabTime = new Date(tab.closedAt || tab.updatedAt || tab.timestamp || tab.createdAt).toLocaleDateString();
            const msgCount = tab.messageCount || (tab.conversation ? tab.conversation.length : tab.messages ? tab.messages.length : 0);
            
            const tabElement = document.createElement('div');
            tabElement.className = 'history-item';
            tabElement.innerHTML = `
                <div class="history-item-text">
                    <div class="history-item-title">${escapeHtml(tab.title)}</div>
                    <div class="history-item-time">${tabTime} - ${msgCount} messages</div>
                </div>
                <button class="history-item-delete" data-id="${tab.id}">🗑️</button>
            `;

            // Click to restore tab
            tabElement.addEventListener('click', (e) => {
                if (!e.target.classList.contains('history-item-delete')) {
                    const tabData = {
                        id: tab.id,
                        title: tab.title,
                        messages: tab.conversation || tab.messages || [],
                        messageCount: msgCount
                    };
                    loadTabFromHistory(tabData);
                }
            });

            // Delete button
            tabElement.querySelector('.history-item-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Delete this tab history?')) {
                    deleteConversation(tab.id);
                }
            });

            historyList.appendChild(tabElement);
        });
    } catch (err) {
        console.error('Error loading conversations:', err);
        historyList.innerHTML = '<div class="empty-state">Error loading history</div>';
    }
}

/**
 * Load a specific conversation
 */
function loadConversation(conversation) {
    const tabData = {
        id: conversation.id,
        title: conversation.title,
        messages: conversation.conversation || conversation.messages || [],
        messageCount: conversation.messageCount
    };
    loadTabFromHistory(tabData);
}

/**
 * Delete a conversation
 */
async function deleteConversation(conversationId) {
    try {
        // Delete from local storage
        let history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        history = history.filter(c => c.id !== conversationId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));

        // Delete from backend if it's a backend conversation
        if (conversationId.startsWith('local-') === false && currentUserId) {
            try {
                await fetch(`${HISTORY_API_URL}/${currentUserId}/${conversationId}`, {
                    method: 'DELETE'
                });
            } catch (err) {
                console.warn('Could not delete from backend:', err);
            }
        }

        // Reload history list
        await loadConversations();
    } catch (err) {
        console.error('Error deleting conversation:', err);
    }
}

/**
 * Clear all chat history
 */
async function clearAllHistory() {
    try {
        // Clear local storage
        localStorage.removeItem(STORAGE_KEY);

        // Clear backend if userId available
        if (currentUserId) {
            try {
                await fetch(`${HISTORY_API_URL}/${currentUserId}/all`, {
                    method: 'DELETE'
                });
            } catch (err) {
                console.warn('Could not clear backend history:', err);
            }
        }

        // Reload history list
        await loadConversations();
        alert('All chat history has been deleted.');
    } catch (err) {
        console.error('Error clearing history:', err);
    }
}

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Get or create userId from localStorage
 */
function getUserId() {
    let userId = localStorage.getItem('civixai_user_id');
    if (!userId) {
        userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('civixai_user_id', userId);
    }
    return userId;
}
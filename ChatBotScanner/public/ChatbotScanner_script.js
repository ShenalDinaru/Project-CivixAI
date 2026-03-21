// --- ELEMENTS ---
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
const uiCard = document.getElementById('mainCard');
const conversationsList = document.getElementById('conversationsList');
const newConversationBtn = document.getElementById('newConversationBtn');
const currentChatTitle = document.getElementById('currentChatTitle');
const deleteConversationLink = document.getElementById('deleteConversationLink');
const clearAllLink = document.getElementById('clearAllLink');

// --- CONSTANTS ---
const BOT_AVATAR = 'Resources/Chatbot icon - Elephant/elephant.png';
const API_URL = `${window.location.origin}/api/chat/message`;
const HISTORY_API_URL = `${window.location.origin}/api/history`;
const STORAGE_KEY = 'civixai_chat_history';
const TABS_STORAGE_KEY = 'civixai_open_tabs';
const DELETED_KEY = 'civixai_deleted_conversations'; // Track deleted conversations
const MIN_TYPING_INDICATOR_MS = 700;

// --- MARKDOWN CONFIGURATION ---
if (typeof marked !== 'undefined') {
    marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: false,
        mangle: false
    });
}

// --- TAB MANAGEMENT ---
class ChatTab {
    constructor(title = null) {
        this.id = 'tab-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        this.title = title || `Chat ${new Date().toLocaleTimeString()}`;
        this.messages = [];
        this.createdAt = new Date();
        this.lastActivityAt = new Date();  // Track last activity for sorting
        this.isActive = false;
        this.isNamed = false;
    }

    addMessage(role, content, sources = []) {
        this.messages.push({ role, content, sources });
        this.lastActivityAt = new Date();  // Update activity time on new message
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
let allConversations = [];
const pendingResponses = new Map();

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
    initializeEventListeners();
    
    // Initialize chat container scrolling
    initializeChatScrolling();
    
    // Clean up deleted list to prevent it from growing too large
    cleanupDeletedList();
    
    // Restore open tabs or create first tab
    const savedTabs = localStorage.getItem(TABS_STORAGE_KEY);
    if (savedTabs && savedTabs.length > 2) {
        restoreOpenTabs();
    } else {
        createNewTab();
    }
    
    // Load all conversations for sidebar
    loadAllConversations();
    
    // Auto-save tabs periodically
    setInterval(() => {
        saveTabsToLocalStorage();
    }, 30000);
};

// Initialize chat container for proper scrolling
function initializeChatScrolling() {
    chatContainer.style.overflowY = 'auto';
    chatContainer.style.overflowX = 'hidden';
    
    setTimeout(() => {
        scrollToBottom();
    }, 500);
    
    let isUserScrolling = false;
    let scrollTimeout;
    
    chatContainer.addEventListener('scroll', () => {
        isUserScrolling = true;
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            isUserScrolling = false;
        }, 1000);
    });
    
    const observer = new MutationObserver(() => {
        if (!isUserScrolling) {
            scrollToBottom();
        }
    });
    
    observer.observe(chatContainer, { childList: true, subtree: true });
}

/**
 * Clean up old deleted conversation IDs - keeps them indefinitely
 * This ensures deleted conversations never reappear even if backend returns them
 */
function cleanupDeletedList() {
    // Deleted list should persist indefinitely to prevent resurrection
    // No cleanup needed - we want to remember deletes forever
}

// --- 1. INTRO SEQUENCE (Text -> Flight) ---
function runIntroSequence() {
    setTimeout(() => {
        loadingScreen.style.opacity = '0'; 
        
        setTimeout(() => {
            loadingScreen.style.display = 'none'; 
            
            bigElephant.style.opacity = '1'; 
            
            setTimeout(startFlightAnimation, 100);
            
        }, 500);
    }, 2000);
}

// --- 2. SMOOTH FLIGHT ANIMATION ---
function startFlightAnimation() {
    try {
        const startRect = bigElephant.getBoundingClientRect();
        const destRect = typingAvatarPopup.getBoundingClientRect(); 

        const moveX = (destRect.left + destRect.width/2) - (startRect.left + startRect.width/2);
        const moveY = (destRect.top + destRect.height/2) - (startRect.top + startRect.height/2);
        const scale = 0.25; 

        uiCard.classList.add('visible');

        bigElephant.style.transform = `translate(${moveX}px, ${moveY}px) scale(${scale})`;

        setTimeout(() => {
            bigElephant.style.opacity = '0';
            introOverlay.style.pointerEvents = 'none';

            typingAvatarPopup.classList.add('show');

            setTimeout(() => {
                introOverlay.style.display = 'none';
                setTimeout(() => {
                    typingAvatarPopup.classList.remove('show');
                }, 1000);
                
                const urlParams = new URLSearchParams(window.location.search);
                const documentsLoaded = urlParams.get('documentsLoaded');
                
                if (documentsLoaded === 'true') {
                    addMessage("Your document has been analysed. What would you like to know?", 'assistant');
                    window.history.replaceState({}, document.title, window.location.pathname);
                } else {
                    addMessage("Hey! I'm Kandula, and I'm here to help you with your tax and driving license related issues.", 'assistant');
                }
            }, 200);

        }, 1200);

    } catch(e) {
        console.error("Animation Fallback", e);
        uiCard.classList.add('visible');
        introOverlay.style.display = 'none';
        
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
        const menuWidth = 180;
        
        dropdownMenu.style.top = (rect.bottom + 8) + 'px';
        dropdownMenu.style.left = (rect.right - menuWidth) + 'px';
        
        dropdownMenu.classList.toggle('show');
    };
}
window.onclick = (e) => {
    if (!dropdownMenu.contains(e.target) && e.target !== menuBtn) dropdownMenu.classList.remove('show');
};

if (backBtn) backBtn.onclick = () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('documentsLoaded') === 'true' || document.referrer.includes('document_uploader')) {
        window.location.href = `${returnOrigin}/document_uploader.html`;
    } else {
        window.location.href = `${returnOrigin}/home.html`;
    }
};

// --- 4. CHAT & POPUP LOGIC ---
messageInput.addEventListener('input', updateTypingAvatarPopup);
messageInput.addEventListener('focus', updateTypingAvatarPopup);
messageInput.addEventListener('blur', () => {
    requestAnimationFrame(updateTypingAvatarPopup);
});

sendButton.onclick = sendMessage;
messageInput.onkeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
};

async function sendMessage() {
    const txt = messageInput.value.trim();
    const requestTab = currentActiveTab;
    if (!txt || !requestTab || messageInput.disabled) return;

    addMessageToTab(requestTab, txt, 'user');
    if (isTabActive(requestTab)) {
        addMessageToUI(txt, 'user');
    }
    messageInput.value = '';
    updateTypingAvatarPopup();

    messageInput.disabled = true;
    sendButton.disabled = true;
    pendingResponses.set(requestTab.id, { startedAt: performance.now() });

    if (isTabActive(requestTab)) {
        showAssistantTypingIndicator(requestTab.id);
    }

    updateTypingAvatarPopup();

    try {
        const conversationHistory = requestTab.messages.map(({ role, content }) => ({ role, content }));
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ message: txt, conversationHistory })
        });
        const data = await res.json().catch(() => ({}));
        const startedAt = pendingResponses.get(requestTab.id)?.startedAt || performance.now();
        await wait(Math.max(0, MIN_TYPING_INDICATOR_MS - (performance.now() - startedAt)));

        if (!res.ok || !data.success || !data.response) {
            throw new Error(data.error || 'Unable to get a response right now.');
        }

        await finalizeAssistantResponse(requestTab, data.response, data.sources || data.rag?.sources || []);
    } catch (err) {
        const startedAt = pendingResponses.get(requestTab.id)?.startedAt || performance.now();
        await wait(Math.max(0, MIN_TYPING_INDICATOR_MS - (performance.now() - startedAt)));
        await finalizeAssistantResponse(requestTab, 'Connection error. Please try again.', []);
    }

    saveTabsToLocalStorage();

    messageInput.disabled = false;
    sendButton.disabled = false;
    messageInput.focus();
    updateTypingAvatarPopup();
}

function addMessage(text, sender) {
    return addMessageToUI(text, sender);
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function isTabActive(tab) {
    return Boolean(tab && currentActiveTab && tab.id === currentActiveTab.id);
}

function updateTypingAvatarPopup() {
    const hasDraftText = document.activeElement === messageInput && messageInput.value.trim().length > 0;
    const assistantIsThinking = Boolean(currentActiveTab && pendingResponses.has(currentActiveTab.id));

    typingAvatarPopup.classList.toggle('show', hasDraftText || assistantIsThinking);
}

function getTypingIndicatorElement(tabId) {
    return chatContainer.querySelector(`[data-typing-indicator-for="${tabId}"]`);
}

function buildSourcesHtml(sources, sender) {
    if (!sources || !Array.isArray(sources) || sources.length === 0 || sender !== 'assistant') {
        return '';
    }

    return '<div class="message-sources"><span class="sources-label">Sources</span><ul class="sources-list">' +
        sources.map((s, i) => {
            const name = s.title || s.source || 'Source ' + (i + 1);
            const linkedName = s.url
                ? `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(name)}</a>`
                : escapeHtml(name);
            const parts = [linkedName];
            if (s.section) parts.push(escapeHtml(s.section));
            if (s.year) parts.push(String(s.year));
            return '<li class="source-item">' + parts.join(' · ') + '</li>';
        }).join('') +
        '</ul></div>';
}

function formatMessageContent(text, sender) {
    const safeText = typeof text === 'string' ? text : '';

    if (sender === 'assistant' && typeof marked !== 'undefined') {
        return marked.parse(safeText);
    }

    return escapeHtml(safeText).replace(/\n/g, '<br>');
}

function buildMessageBubbleHtml(text, sender, sources = []) {
    const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}).toLowerCase();
    const formattedContent = formatMessageContent(text, sender);
    const sourcesHtml = buildSourcesHtml(sources, sender);

    return `<div class="message-content">${formattedContent}</div><div class="message-meta">${time}</div>${sourcesHtml}`;
}

function createMessageElement(text, sender, sources = [], options = {}) {
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${sender}`;

    if (options.animateIn) {
        wrapper.classList.add('is-entering');
    }

    if (sender === 'assistant') {
        wrapper.insertAdjacentHTML('beforeend', `<div class="avatar"><img src="${BOT_AVATAR}" alt="Kandula"></div>`);
    }

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = buildMessageBubbleHtml(text, sender, sources);
    wrapper.appendChild(bubble);

    return wrapper;
}

function showAssistantTypingIndicator(tabId) {
    if (!tabId || !currentActiveTab || currentActiveTab.id !== tabId) {
        return null;
    }

    const existingIndicator = getTypingIndicatorElement(tabId);
    if (existingIndicator) {
        return existingIndicator;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper assistant is-typing';
    wrapper.dataset.typingIndicatorFor = tabId;
    wrapper.innerHTML = `
        <div class="avatar"><img src="${BOT_AVATAR}" alt="Kandula"></div>
        <div class="message-bubble typing-indicator-bubble">
            <div class="typing-indicator-shell">
                <div class="typing-indicator-row">
                    <div class="typing-indicator-badge">Kandula is typing</div>
                    <div class="typing-indicator-dots" aria-hidden="true">
                        <span class="typing-indicator-dot"></span>
                        <span class="typing-indicator-dot"></span>
                        <span class="typing-indicator-dot"></span>
                    </div>
                </div>
            </div>
        </div>
    `;

    chatContainer.appendChild(wrapper);
    scrollToBottom();

    requestAnimationFrame(() => {
        wrapper.classList.add('is-visible');
    });

    return wrapper;
}

async function morphTypingIndicatorIntoMessage(indicator, text, sources = []) {
    if (!indicator) {
        return null;
    }

    const bubble = indicator.querySelector('.message-bubble');
    indicator.classList.add('is-resolving');
    await wait(180);

    indicator.classList.remove('is-typing', 'is-resolving');
    indicator.removeAttribute('data-typing-indicator-for');
    bubble.className = 'message-bubble response-ready';
    bubble.innerHTML = buildMessageBubbleHtml(text, 'assistant', sources);
    scrollToBottom();

    return indicator;
}

async function finalizeAssistantResponse(tab, text, sources = []) {
    if (!tab) return;

    addMessageToTab(tab, text, 'assistant', sources);
    const shouldRenderInView = isTabActive(tab);
    const indicator = shouldRenderInView ? getTypingIndicatorElement(tab.id) : null;

    pendingResponses.delete(tab.id);

    if (indicator) {
        await morphTypingIndicatorIntoMessage(indicator, text, sources);
    } else if (shouldRenderInView) {
        addMessageToUI(text, 'assistant', sources, { animateIn: true });
    }
}

function scrollToBottom() {
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

// --- EVENT LISTENERS ---
function initializeEventListeners() {
    if (newConversationBtn) {
        newConversationBtn.onclick = () => createNewTab();
    }
    
    if (deleteConversationLink) {
        deleteConversationLink.onclick = (e) => {
            e.preventDefault();
            if (currentActiveTab && confirm('Delete this conversation?')) {
                deleteConversation(currentActiveTab.id);
            }
        };
    }
    
    if (clearAllLink) {
        clearAllLink.onclick = (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to delete ALL conversations? This cannot be undone.')) {
                clearAllConversations();
            }
        };
    }
}

// --- TAB MANAGEMENT FUNCTIONALITY ---

/**
 * Create a new chat tab
 */
function createNewTab(title = null) {
    if (currentActiveTab && currentActiveTab.messages.length > 0) {
        saveTabsToLocalStorage();
    }

    const newTab = new ChatTab(title);
    openTabs.push(newTab);
    currentActiveTab = newTab;

    updateSidebar();
    switchToTab(newTab.id);
    
    setTimeout(() => {
        addMessageToCurrentTab("Hey! I'm Kandula, and I'm here to help you with your tax related issues.", 'assistant');
    }, 100);
    
    saveTabsToLocalStorage();
}

/**
 * Switch to a specific tab
 */
function switchToTab(tabId) {
    const tab = openTabs.find(t => t.id === tabId);
    if (!tab) return;

    openTabs.forEach(t => t.isActive = false);
    tab.isActive = true;
    currentActiveTab = tab;

    chatContainer.innerHTML = '';
    tab.messages.forEach(msg => {
        addMessageToUI(msg.content, msg.role, msg.sources);
    });
    if (pendingResponses.has(tab.id)) {
        showAssistantTypingIndicator(tab.id);
    }

    updateSidebar();
    updateHeaderTitle();
    messageInput.focus();
    updateTypingAvatarPopup();
}

/**
 * Close a tab (save to history)
 */
async function closeTab(tabId) {
    const tab = openTabs.find(t => t.id === tabId);
    if (!tab) return;

    if (tab.messages.length > 0) {
        await saveTabToHistory(tab);
    }

    openTabs = openTabs.filter(t => t.id !== tabId);

    if (openTabs.length === 0) {
        createNewTab();
        return;
    }

    const nextTab = openTabs[openTabs.length - 1];
    switchToTab(nextTab.id);
}

/**
 * Update sidebar with all conversations
 */
function updateSidebar() {
    conversationsList.innerHTML = '';
    
    // Get list of deleted conversation IDs
    const deletedIds = JSON.parse(localStorage.getItem(DELETED_KEY)) || [];

    // Combine open tabs and closed conversations
    const allItems = [];

    // Add open tabs (that are not deleted)
    openTabs.forEach(tab => {
        if (!deletedIds.includes(tab.id)) {
            allItems.push({
                data: tab,
                isOpen: true,
                timestamp: new Date(tab.lastActivityAt).getTime()
            });
        }
    });

    // Add closed conversations (that are not deleted)
    allConversations.forEach(conv => {
        if (!deletedIds.includes(conv.id)) {
            const timestamp = new Date(conv.closedAt || conv.updatedAt || conv.timestamp || conv.createdAt).getTime();
            allItems.push({
                data: conv,
                isOpen: false,
                timestamp: timestamp
            });
        }
    });

    // Sort by timestamp - newest first
    allItems.sort((a, b) => b.timestamp - a.timestamp);

    // Render sorted conversations
    allItems.forEach(item => {
        const convItem = createConversationItem(item.data, item.isOpen);
        conversationsList.appendChild(convItem);
    });
}

/**
 * Create a conversation item element
 */
function createConversationItem(conversation, isOpen) {
    const item = document.createElement('div');
    item.className = 'conversation-item';
    
    if (currentActiveTab && currentActiveTab.id === conversation.id) {
        item.classList.add('active');
    }
    
    const title = conversation.title || 'New Conversation';
    
    item.innerHTML = `
        <span class="conversation-title" title="${escapeHtml(title)}">${escapeHtml(title)}</span>
        <button class="conversation-delete-btn" data-id="${conversation.id}" title="Delete">✕</button>
    `;

    item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('conversation-delete-btn')) {
            if (isOpen) {
                switchToTab(conversation.id);
            } else {
                loadConversationFromHistory(conversation);
            }
        }
    });

    const deleteBtn = item.querySelector('.conversation-delete-btn');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Delete this conversation?')) {
            if (isOpen) {
                closeTab(conversation.id);
            } else {
                deleteConversationFromHistory(conversation.id);
            }
        }
    });

    return item;
}

/**
 * Update header title to show current conversation
 */
function updateHeaderTitle() {
    if (currentActiveTab) {
        currentChatTitle.textContent = currentActiveTab.title || 'New Chat';
    } else {
        currentChatTitle.textContent = 'New Chat';
    }
}

/**
 * Save tab to history
 */
async function saveTabToHistory(tab) {
    try {
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

        saveConversationToLocal(tabHistory);

        if (currentUserId) {
            await saveTabToBackend(tabHistory);
        }
    } catch (err) {
        console.error('Error saving tab to history:', err);
    }
}

/**
 * Save conversation to local storage
 */
function saveConversationToLocal(tabHistory) {
    try {
        let history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        if (!Array.isArray(history)) history = [];
        
        const existingIdx = history.findIndex(h => h.id === tabHistory.id);
        if (existingIdx >= 0) {
            history[existingIdx] = tabHistory;
        } else {
            history.unshift(tabHistory);
        }
        
        history = history.slice(0, 50);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
        console.error('Error saving conversation to local storage:', err);
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
            lastActivityAt: tab.lastActivityAt.toISOString(),
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
        // Get list of deleted conversation IDs
        const deletedIds = JSON.parse(localStorage.getItem(DELETED_KEY)) || [];
        
        const tabsData = JSON.parse(localStorage.getItem(TABS_STORAGE_KEY)) || [];
        if (Array.isArray(tabsData) && tabsData.length > 0) {
            // Filter out deleted tabs
            const validTabsData = tabsData.filter(data => !deletedIds.includes(data.id));
            
            openTabs = validTabsData.map(data => {
                const tab = new ChatTab(data.title);
                tab.id = data.id;
                tab.messages = data.messages;
                tab.createdAt = new Date(data.createdAt);
                tab.lastActivityAt = new Date(data.lastActivityAt || data.createdAt);
                tab.isActive = data.isActive;
                return tab;
            });

            const activeTab = openTabs.find(t => t.isActive);
            if (activeTab) {
                currentActiveTab = activeTab;
                switchToTab(activeTab.id);
            } else if (openTabs.length > 0) {
                switchToTab(openTabs[0].id);
            } else {
                // If all open tabs were deleted, create a new one
                createNewTab();
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
 * Add message to a tab
 */
function addMessageToTab(tab, text, sender, sources) {
    if (!tab) return;

    const userMessageCount = tab.getUserMessageCount();
    const isFirstUserMessage = sender === 'user' && userMessageCount === 0;

    tab.addMessage(sender === 'assistant' ? 'assistant' : 'user', text, sources || []);

    if (isFirstUserMessage) {
        autoRenameTab(tab, text);
    }

    updateSidebar();

    if (isTabActive(tab)) {
        updateHeaderTitle();
    }
}

function addMessageToCurrentTab(text, sender, sources) {
    if (!currentActiveTab) return;

    addMessageToTab(currentActiveTab, text, sender, sources);
    addMessageToUI(text, sender, sources);
}

/**
 * Auto-rename tab based on first user message
 */
function autoRenameTab(tab, firstMessage) {
    if (!tab || tab.isNamed) return;
    
    let title = firstMessage.trim();
    
    const punctuationMatch = title.match(/[^?.!]*[?.!]/);
    if (punctuationMatch) {
        title = punctuationMatch[0].slice(0, 60);
    } else {
        title = title.substring(0, 60);
    }
    
    title = title.trim();
    
    if (tab.title.startsWith('Chat ')) {
        tab.title = title;
        tab.isNamed = true;
        updateSidebar();

        if (isTabActive(tab)) {
            updateHeaderTitle();
        }
    }
}

/**
 * Add message to UI only (without saving to tab)
 */
function addMessageToUI(text, sender, sources, options = {}) {
    const messageElement = createMessageElement(text, sender, sources, options);
    chatContainer.appendChild(messageElement);

    if (options.animateIn) {
        requestAnimationFrame(() => {
            messageElement.classList.add('is-visible');
        });
    }

    scrollToBottom();
    return messageElement;
}

/**
 * Load all conversations for sidebar
 */
async function loadAllConversations() {
    try {
        // Get list of deleted conversation IDs
        const deletedIds = JSON.parse(localStorage.getItem(DELETED_KEY)) || [];
        
        let loaded = [];

        const localConvs = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        loaded = [...localConvs];

        if (currentUserId) {
            try {
                const response = await fetch(`${HISTORY_API_URL}/list?userId=${currentUserId}`);
                const data = await response.json();
                if (data.success && data.conversations) {
                    loaded = [...data.conversations, ...loaded];
                }
            } catch (err) {
                console.warn('Could not load from backend:', err);
            }
        }

        // Filter out deleted conversations
        loaded = loaded.filter(c => !deletedIds.includes(c.id));

        const unique = Array.from(
            new Map(loaded.map(c => [c.id, c])).values()
        );

        unique.sort((a, b) => {
            const timeA = new Date(a.closedAt || a.updatedAt || a.timestamp || a.createdAt);
            const timeB = new Date(b.closedAt || b.updatedAt || b.timestamp || b.createdAt);
            return timeB - timeA;
        });

        allConversations = unique.slice(0, 50);
        updateSidebar();
    } catch (err) {
        console.error('Error loading conversations:', err);
    }
}

/**
 * Load conversation from history
 */
function loadConversationFromHistory(conversation) {
    const newTab = new ChatTab(conversation.title);
    newTab.messages = conversation.messages || conversation.conversation || [];
    newTab.id = 'restored-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    openTabs.push(newTab);
    switchToTab(newTab.id);
}

/**
 * Delete conversation from history
 */
async function deleteConversationFromHistory(conversationId) {
    try {
        // Add to deleted list to track it
        let deletedIds = JSON.parse(localStorage.getItem(DELETED_KEY)) || [];
        if (!deletedIds.includes(conversationId)) {
            deletedIds.push(conversationId);
            localStorage.setItem(DELETED_KEY, JSON.stringify(deletedIds));
        }

        // Delete from local storage
        let history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        const originalLength = history.length;
        history = history.filter(c => c.id !== conversationId);
        
        // Only update localStorage if something was actually deleted
        if (history.length !== originalLength) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        }

        // Delete from backend if not a local conversation
        if (!conversationId.startsWith('local-') && currentUserId) {
            try {
                await fetch(`${HISTORY_API_URL}/${currentUserId}/${conversationId}`, {
                    method: 'DELETE'
                });
            } catch (err) {
                console.warn('Could not delete from backend:', err);
            }
        }

        // Remove from all conversations list
        allConversations = allConversations.filter(c => c.id !== conversationId);
        updateSidebar();
    } catch (err) {
        console.error('Error deleting conversation:', err);
    }
}

/**
 * Delete current conversation
 */
async function deleteConversation(tabId) {
    try {
        // Add to deleted list to track it
        let deletedIds = JSON.parse(localStorage.getItem(DELETED_KEY)) || [];
        if (!deletedIds.includes(tabId)) {
            deletedIds.push(tabId);
            localStorage.setItem(DELETED_KEY, JSON.stringify(deletedIds));
        }

        // Delete from local storage
        let history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        history = history.filter(c => c.id !== tabId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));

        // Delete from backend if not local
        if (!tabId.startsWith('local-') && currentUserId) {
            try {
                await fetch(`${HISTORY_API_URL}/${currentUserId}/${tabId}`, {
                    method: 'DELETE'
                });
            } catch (err) {
                console.warn('Could not delete from backend:', err);
            }
        }
    } catch (err) {
        console.error('Error deleting conversation:', err);
    }

    // Remove from open tabs
    openTabs = openTabs.filter(t => t.id !== tabId);

    if (openTabs.length === 0) {
        createNewTab();
    } else {
        switchToTab(openTabs[openTabs.length - 1].id);
    }
    
    await loadAllConversations();
}

/**
 * Escape HTML entities
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Get user ID
 */
function getUserId() {
    const userString = localStorage.getItem('currentUser');
    if (userString) {
        try {
            const user = JSON.parse(userString);
            return user.uid || user.id;
        } catch (e) {
            return null;
        }
    }
    return null;
}

/**
 * Clear all conversations (both local storage and backend)
 */
async function clearAllConversations() {
    try {
        // Clear local storage
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(TABS_STORAGE_KEY);
        localStorage.removeItem(DELETED_KEY);

        // Clear backend if user is logged in
        if (currentUserId) {
            try {
                await fetch(`${HISTORY_API_URL}/${currentUserId}/all`, {
                    method: 'DELETE'
                });
            } catch (err) {
                console.warn('Could not clear backend history:', err);
            }
        }

        // Reset UI
        allConversations = [];
        openTabs = [];
        currentActiveTab = null;
        createNewTab();
        updateSidebar();
        
        console.log('All conversations cleared successfully');
    } catch (err) {
        console.error('Error clearing all conversations:', err);
    }
}

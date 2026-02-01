// Gazette slider functionality with auto-loop and drag support
const gazetteTrack = document.getElementById('gazetteTrack');
const slides = document.querySelectorAll('.slide');
const sliderContainer = document.querySelector('.slider-container');

let slideIndex = 0;
let autoSlideTimer = null;

function applySlideTransform(shiftPercent, withTransition = true) {
  if (!gazetteTrack) return;
  gazetteTrack.style.transition = withTransition ? 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'none';
  gazetteTrack.style.transform = `translateX(${shiftPercent}%)`;
}

function goToSlide(index) {
  if (!gazetteTrack || !slides.length) return;
  slideIndex = (index + slides.length) % slides.length;
  const shift = slideIndex * -100;
  applySlideTransform(shift, true);
}

function nextSlide() {
  goToSlide(slideIndex + 1);
}

function prevSlide() {
  goToSlide(slideIndex - 1);
}

function startAutoSlide() {
  stopAutoSlide();
  autoSlideTimer = setInterval(nextSlide, 10000); // every 10 seconds
}

function stopAutoSlide() {
  if (autoSlideTimer) {
    clearInterval(autoSlideTimer);
    autoSlideTimer = null;
  }
}

// Initialize slider
if (slides.length > 0) {
  goToSlide(0);
  startAutoSlide();
}

// Drag / swipe handling
if (sliderContainer) {
  let isDragging = false;
  let startX = 0;
  let currentShift = 0;

  const onPointerDown = (event) => {
    isDragging = true;
    startX = event.touches ? event.touches[0].clientX : event.clientX;
    sliderContainer.classList.add('is-dragging');
    stopAutoSlide();

    // base shift for the current slide
    currentShift = slideIndex * -100;
    applySlideTransform(currentShift, false);
  };

  const onPointerMove = (event) => {
    if (!isDragging) return;
    const currentX = event.touches ? event.touches[0].clientX : event.clientX;
    const deltaX = currentX - startX;
    const width = sliderContainer.offsetWidth || 1;
    const deltaPercent = (deltaX / width) * 100;

    // Move track along with the cursor, without transition
    applySlideTransform(currentShift + deltaPercent, false);
  };

  const onPointerUp = (event) => {
    if (!isDragging) return;
    const endX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
    const deltaX = endX - startX;
    const width = sliderContainer.offsetWidth || 1;
    const threshold = width * 0.15; // 15% of width to trigger slide change

    if (Math.abs(deltaX) > threshold) {
      if (deltaX < 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    } else {
      goToSlide(slideIndex);
    }

    isDragging = false;
    sliderContainer.classList.remove('is-dragging');
    startAutoSlide();
  };

  sliderContainer.addEventListener('mousedown', onPointerDown);
  sliderContainer.addEventListener('touchstart', onPointerDown, { passive: true });

  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('touchmove', onPointerMove, { passive: true });

  window.addEventListener('mouseup', onPointerUp);
  window.addEventListener('touchend', onPointerUp);
}

// Clicking the arrow inside the gazette box also moves to the next slide
document.querySelectorAll('.slide-next-btn').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    stopAutoSlide();
    nextSlide();
    startAutoSlide();
  });
});

// "Start conversation" button
const askBtn = document.getElementById('askNowBtn');
if (askBtn) {
  askBtn.addEventListener('click', () => {
    console.log("Start conversation clicked - navigate to chat page");
    // TODO: Navigate to chat page
    alert('Opening chat page...');
  });
}

// Scanner card click
const scannerCard = document.getElementById('scannerCard');
if (scannerCard) {
  scannerCard.addEventListener('click', () => {
    console.log("Scanner clicked - navigate to scanner page");
    // TODO: Navigate to scanner page
    alert('Opening scanner page...');
  });
}

// Vault card click
const vaultCard = document.getElementById('vaultCard');
if (vaultCard) {
  vaultCard.addEventListener('click', () => {
    console.log("Vault clicked - navigate to vault page");
    // TODO: Navigate to vault page
    alert('Opening vault page...');
  });
}

// Chat history rendering
const historyBox = document.getElementById('chatHistory');
const historyList = document.getElementById('historyList');

function renderChatHistoryFromStorage() {
  if (!historyBox || !historyList) return;

  let data = [];
  try {
    const raw = localStorage.getItem('civixaiChatHistory');
    if (raw) {
      data = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Unable to parse chat history from storage.', e);
  }

  historyList.innerHTML = '';

  if (!Array.isArray(data) || data.length === 0) {
    // Show a single glass card stating there is no history yet
    const emptyCard = document.createElement('div');
    emptyCard.className = 'glass-card history-item';

    const iconWrap = document.createElement('div');
    iconWrap.className = 'icon-circle-bg';
    const iconImg = document.createElement('img');
    iconImg.src = 'Resources/Icons/Chat Icon.svg';
    iconImg.alt = 'Chat';
    iconWrap.appendChild(iconImg);

    const textWrap = document.createElement('div');
    textWrap.className = 'history-text';

    const title = document.createElement('p');
    title.textContent = 'No chat history yet';

    const subtitle = document.createElement('small');
    subtitle.textContent = 'Start a conversation to see it here.';

    textWrap.appendChild(title);
    textWrap.appendChild(subtitle);

    emptyCard.appendChild(iconWrap);
    emptyCard.appendChild(textWrap);

    historyList.appendChild(emptyCard);
    historyBox.style.display = 'block';
    return;
  }

  data.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'glass-card history-item';
    card.style.animationDelay = `${index * 0.1}s`;

    const iconWrap = document.createElement('div');
    iconWrap.className = 'icon-circle-bg';
    const iconImg = document.createElement('img');
    iconImg.src = 'Resources/Icons/Chat Icon.svg';
    iconImg.alt = 'Chat';
    iconWrap.appendChild(iconImg);

    const textWrap = document.createElement('div');
    textWrap.className = 'history-text';

    const title = document.createElement('p');
    title.textContent = item.title || 'Chat history';

    const date = document.createElement('small');
    date.textContent = item.date || '';

    textWrap.appendChild(title);
    textWrap.appendChild(date);

    const arrow = document.createElement('img');
    arrow.src = 'Resources/Icons/Next Icon.svg';
    arrow.alt = 'Open';
    arrow.className = 'arrow-icon history-open-icon';

    card.appendChild(iconWrap);
    card.appendChild(textWrap);
    card.appendChild(arrow);

    // Click handler for history item
    card.addEventListener('click', () => {
      console.log(`Opening chat: ${item.title}`);
      // TODO: Navigate to chat page with this conversation
      alert(`Opening chat: ${item.title}`);
    });

    historyList.appendChild(card);
  });

  historyBox.style.display = 'block';
}

// Allow other parts of the app to signal that chat has been updated
window.addEventListener('civixai:chat-updated', renderChatHistoryFromStorage);

// On first load, render from localStorage if the user has chatted before
renderChatHistoryFromStorage();

// Profile circle click
const profileCircle = document.querySelector('.profile-circle');
if (profileCircle) {
  profileCircle.addEventListener('click', () => {
    console.log('Profile clicked');
    alert('Profile settings coming soon!');
  });
}

// Notification button click
const notifBtn = document.querySelector('.notif-btn');
if (notifBtn) {
  notifBtn.addEventListener('click', () => {
    console.log('Notifications clicked');
    alert('You have 3 new notifications!');
  });
}

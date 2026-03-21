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
    console.log('Start conversation clicked - navigate to chatbot');
    const chatbotUrl = window.APP_CONFIG?.chatbotUrl || 'http://localhost:3000/ChatbotScanner.html';
    const separator = chatbotUrl.includes('?') ? '&' : '?';
    window.location.href = `${chatbotUrl}${separator}origin=${encodeURIComponent(window.location.origin)}`;
  });
}

// Scanner card click
const scannerCard = document.getElementById('scannerCard');
if (scannerCard) {
  scannerCard.addEventListener('click', () => {
    console.log('Scanner clicked - navigate to document uploader');
    const scannerUrl = window.APP_CONFIG?.scannerUrl || 'http://localhost:3000/document_uploader.html';
    const separator = scannerUrl.includes('?') ? '&' : '?';
    window.location.href = `${scannerUrl}${separator}origin=${encodeURIComponent(window.location.origin)}`;
  });
}

// Vault card click
const vaultCard = document.getElementById('vaultCard');
if (vaultCard) {
  vaultCard.addEventListener('click', () => {
    console.log("Vault clicked - navigate to vault page");
    window.location.href = 'vault.html';
  });
}

// Profile circle click
const profileCircle = document.querySelector('.profile-circle');
if (profileCircle) {
  profileCircle.addEventListener('click', () => {
    console.log('Profile clicked - navigate to profile page');
    window.location.href = 'user_profile.html';
  });
}

// Notifications
const notifBtn = document.getElementById('notifBtn');
const notifBadge = document.getElementById('notifBadge');
const notifPanel = document.getElementById('notifPanel');
const notifList = document.getElementById('notifList');

// Example notifications – can be wired to real data later
const notifications = [
  {
    title: 'Gazette Update',
    description: 'New Income Tax regulations updated for 2026.'
  },
  {
    title: 'TIN Deadline',
    description: 'Complete your TIN registration before the end of this month.'
  },
  {
    title: 'Legal Framework',
    description: 'Amendments to the Companies Act are now in effect.'
  }
];

function renderNotifications() {
  if (!notifBadge || !notifList) return;

  const count = notifications.length;
  if (count > 0) {
    notifBadge.textContent = count;
    notifBadge.classList.remove('hidden');
  } else {
    notifBadge.classList.add('hidden');
  }

  notifList.innerHTML = '';

  if (count === 0) {
    const li = document.createElement('li');
    li.className = 'notif-item';
    li.innerHTML = '<span class="notif-item-title">You are all caught up</span><span class="notif-item-desc">No new notifications right now.</span>';
    notifList.appendChild(li);
    return;
  }

  notifications.forEach((n) => {
    const li = document.createElement('li');
    li.className = 'notif-item';

    const title = document.createElement('span');
    title.className = 'notif-item-title';
    title.textContent = n.title;

    const desc = document.createElement('span');
    desc.className = 'notif-item-desc';
    desc.textContent = n.description;

    li.appendChild(title);
    li.appendChild(desc);
    notifList.appendChild(li);
  });
}

renderNotifications();

if (notifBtn && notifPanel) {
  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    notifPanel.classList.toggle('open');
  });

  // Close panel when clicking outside
  document.addEventListener('click', (e) => {
    if (!notifPanel.classList.contains('open')) return;
    if (notifPanel.contains(e.target) || notifBtn.contains(e.target)) return;
    notifPanel.classList.remove('open');
  });
}

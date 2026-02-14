// Get DOM elements
const video = document.getElementById('camera');
const captureBtn = document.getElementById('captureBtn');
const attachBtn = document.getElementById('attachBtn');
const galleryBtn = document.getElementById('galleryBtn');
const backBtn = document.getElementById('backBtn');
const menuBtn = document.getElementById('menuBtn');
const optionsMenu = document.getElementById('optionsMenu');

// Camera constraints based on device
function getCameraConstraints() {
  const isMobile = window.innerWidth < 768;
  
  return {
    video: {
      facingMode: 'environment', // Use back camera on mobile
      width: { ideal: isMobile ? 1080 : 1920 },
      height: { ideal: isMobile ? 1440 : 1080 },
      aspectRatio: { ideal: isMobile ? 3/4 : 16/9 }
    },
    audio: false
  };
}

// Initialize camera
async function initCamera() {
  try {
    const constraints = getCameraConstraints();
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
  } catch (error) {
    console.error('Error accessing camera:', error);
    alert('Unable to access camera. Please ensure camera permissions are granted.');
  }
}

// Capture photo
function capturePhoto() {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // Convert to blob and download
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-scan-${Date.now()}.jpg`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/jpeg', 0.95);
  
  // Visual feedback
  captureBtn.style.transform = 'translateX(-50%) translateY(50%) scale(0.9)';
  setTimeout(() => {
    captureBtn.style.transform = 'translateX(-50%) translateY(50%) scale(1)';
  }, 150);
}

// Handle attach button
function handleAttach() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,application/pdf';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('File attached:', file.name);
      // Handle file upload here
    }
  };
  input.click();
}

// Handle gallery button
function handleGallery() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Image selected from gallery:', file.name);
      // Handle image selection here
    }
  };
  input.click();
}

// Event listeners
captureBtn.addEventListener('click', capturePhoto);
attachBtn.addEventListener('click', handleAttach);
galleryBtn.addEventListener('click', handleGallery);

// Back button
if (backBtn) {
  backBtn.addEventListener('click', () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = 'home.html';
    }
  });
}

// Menu toggle
if (menuBtn && optionsMenu) {
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    optionsMenu.classList.toggle('active');
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!optionsMenu.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) {
      optionsMenu.classList.remove('active');
    }
  });
}

// Reinitialize camera on window resize (orientation change)
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      initCamera();
    }
  }, 500);
});

// Initialize camera on page load
initCamera();

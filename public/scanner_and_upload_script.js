// Get DOM elements
const video = document.getElementById('camera');
const captureBtn = document.getElementById('captureBtn');
const attachBtn = document.getElementById('attachBtn');
const galleryBtn = document.getElementById('galleryBtn');
const backBtn = document.getElementById('backBtn');
const menuBtn = document.getElementById('menuBtn');
const optionsMenu = document.getElementById('optionsMenu');
const actionButtons = document.getElementById('actionButtons');
const cancelScanBtn = document.getElementById('cancelScanBtn');
const retakeBtn = document.getElementById('retakeBtn');
const proceedBtn = document.getElementById('proceedBtn');

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
    console.warn('Invalid return origin in scanner:', originFromQuery, error);
    return window.location.origin;
  }
}

const RETURN_ORIGIN = getSafeReturnOrigin();

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

// Store captured image
let capturedImageData = null;

// Capture photo
function capturePhoto() {
  // Create canvas to capture frame
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // Convert to base64
  capturedImageData = canvas.toDataURL('image/jpeg', 0.8);
  
  // Freeze video to simulate capture
  video.pause();
  
  // Visual feedback
  captureBtn.style.transform = 'translateX(-50%) translateY(50%) scale(0.9)';
  setTimeout(() => {
    captureBtn.style.transform = 'translateX(-50%) translateY(50%) scale(1)';
    
    // Hide capture UI, show actions
    captureBtn.style.display = 'none';
    document.querySelector('.bottom-bar').style.display = 'none';
    actionButtons.style.display = 'flex';
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

if (retakeBtn) {
  retakeBtn.addEventListener('click', () => {
    capturedImageData = null;
    video.play();
    actionButtons.style.display = 'none';
    captureBtn.style.display = 'flex';
    document.querySelector('.bottom-bar').style.display = 'flex';
  });
}

if (cancelScanBtn) {
  cancelScanBtn.addEventListener('click', () => {
    // Cancel implies exiting the scanner or going back
    if (window.history.length > 1) window.history.back();
  });
}

if (proceedBtn) {
  proceedBtn.addEventListener('click', () => {
    if (capturedImageData) {
      // Redirect to document upload page with scanned image
      const uploadUrl = `${window.location.origin}/document_uploader.html?scannedImage=${encodeURIComponent(capturedImageData)}&origin=${encodeURIComponent(RETURN_ORIGIN)}`;
      window.location.href = uploadUrl;
    } else {
      alert('Please capture an image first');
    }
  });
}

// Back button
if (backBtn) {
  backBtn.addEventListener('click', () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = `${RETURN_ORIGIN}/home.html`;
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

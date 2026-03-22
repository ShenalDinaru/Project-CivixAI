//getting elements-S //
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const askNowBtn = document.getElementById('askNowBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const progressBar = document.querySelector('.progress');
const progressText = document.getElementById('progress-percent');
const LANDING_LOADER_KEY = 'landingLoaderShown';


// Loading Animation Functions
let progress = 0;
let loadingInterval = null;

function updateProgress() {
    if (progress < 100) {
        progress += 10;
        if (progress > 100) progress = 100;
        
        if (progressBar) progressBar.style.width = progress + '%';
        if (progressText) progressText.textContent = progress;
    }
}

function hasSeenLandingLoader() {
    try {
        return sessionStorage.getItem(LANDING_LOADER_KEY) === 'true';
    } catch (error) {
        console.warn('Unable to read landing loader state:', error);
        return false;
    }
}

function markLandingLoaderSeen() {
    try {
        sessionStorage.setItem(LANDING_LOADER_KEY, 'true');
    } catch (error) {
        console.warn('Unable to save landing loader state:', error);
    }
}

function resetLoadingProgress() {
    progress = 0;
    if (progressBar) progressBar.style.width = '0%';
    if (progressText) progressText.textContent = '0';
}

function hideLoadingOverlay() {
    if (loadingInterval) {
        clearInterval(loadingInterval);
        loadingInterval = null;
    }

    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
}

function playLandingLoaderOnce() {
    if (!loadingOverlay || hasSeenLandingLoader()) {
        hideLoadingOverlay();
        return;
    }

    resetLoadingProgress();
    loadingOverlay.classList.remove('hidden');

    loadingInterval = setInterval(updateProgress, 300);

    setTimeout(() => {
        if (loadingInterval) {
            clearInterval(loadingInterval);
            loadingInterval = null;
        }

        progress = 100;
        if (progressBar) progressBar.style.width = '100%';
        if (progressText) progressText.textContent = '100';

        markLandingLoaderSeen();

        setTimeout(() => {
            hideLoadingOverlay();
        }, 500);
    }, 1500);
}

document.addEventListener('DOMContentLoaded', () => {
    playLandingLoaderOnce();
});


const authButtons = [loginBtn, signupBtn];                      //login & signup button effects-S //

authButtons.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
        btn.style.transform = "translateY(-5px)";
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.transform = "translateY(0)";
    });
});


askNowBtn.addEventListener('mouseenter', () => {                 //Chat button glow effect-S //
    askNowBtn.style.transform = "scale(1.05)";
    askNowBtn.style.filter = "brightness(1.2)";
});
askNowBtn.addEventListener('mouseleave', () => {
    askNowBtn.style.transform = "scale(1)";
    askNowBtn.style.filter = "brightness(1)";
});


// Navigation Redirects with Loading Animation
loginBtn.onclick = () => {
    window.location.href = 'LoginPG.html';
};

signupBtn.onclick = () => {
    window.location.href = 'SignupPG.html';
};

askNowBtn.onclick = () => {
    window.location.href = 'Chatbot.html';
};

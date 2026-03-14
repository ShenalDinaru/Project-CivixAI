//getting elements-S //
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const askNowBtn = document.getElementById('askNowBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const progressBar = document.querySelector('.progress');
const progressText = document.getElementById('progress-percent');


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

function showLoadingOverlay(destination) {
    progress = 0;
    if (progressBar) progressBar.style.width = '0%';
    if (progressText) progressText.textContent = '0';
    
    loadingOverlay.classList.remove('hidden');
    
    loadingInterval = setInterval(updateProgress, 300);
    
    // Complete loading after 1 second and redirect
    setTimeout(() => {
        clearInterval(loadingInterval);
        progress = 100;
        if (progressBar) progressBar.style.width = '100%';
        if (progressText) progressText.textContent = '100';
        
        setTimeout(() => {
            window.location.href = destination;
        }, 500);
    }, 1000);
}

// Show loading overlay on page load
window.addEventListener('load', () => {
    if (loadingOverlay.classList.contains('hidden') === false) {
        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
        }, 1500);
    }
});

// Show loading on initial page load
document.addEventListener('DOMContentLoaded', () => {
    // Display loading overlay briefly on page load
    loadingInterval = setInterval(updateProgress, 300);
    setTimeout(() => {
        clearInterval(loadingInterval);
        progress = 100;
        if (progressBar) progressBar.style.width = '100%';
        if (progressText) progressText.textContent = '100';
        
        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
        }, 500);
    }, 1500);
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
loginBtn.onclick = () => showLoadingOverlay('LoginPG.html');
signupBtn.onclick = () => showLoadingOverlay('ignupPG.html');
askNowBtn.onclick = () => showLoadingOverlay('Chatbot.html');
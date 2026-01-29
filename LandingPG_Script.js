//getting elements-S //
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const askNowBtn = document.getElementById('askNowBtn');


const authButtons = [loginBtn, signupBtn];                      //login & signup button aeffects-S //

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


loginBtn.onclick = () => window.location.href = 'LoginPG.html';      //NAVIGATION REDIRECTS-S //
signupBtn.onclick = () => window.location.href = 'signup.html';
askNowBtn.onclick = () => window.location.href = 'chat.html';
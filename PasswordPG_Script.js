document.addEventListener('DOMContentLoaded', () => {
    const card = document.getElementById('passwordCard');
    const passInput = document.getElementById('pass');
    const confirmInput = document.getElementById('confirm');
    const strengthBar = document.getElementById('strengthBar');
    const submitBtn = document.getElementById('submitBtn');
    
    // Icon paths
    const viewIcon = 'Resources/Icons/Password View Eye Icon.svg';
    const hideIcon = 'Resources/Icons/Password Hidden Eye Icon.svg'; 

    // 1. Smooth Entry Animation
    requestAnimationFrame(() => {
        card.style.transition = 'all 0.9s cubic-bezier(0.23, 1, 0.32, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    });

    // 2. Navigation
    document.getElementById('backBtn').onclick = () => {
        window.location.href = 'SignupPG.html'; // Adjust this filename if your signup page has a different name
    };

    // 3. Visibility Toggle Logic
    document.querySelectorAll('.toggle-password').forEach(img => {
        img.onclick = () => {
            const input = document.getElementById(img.dataset.target);
            if (input.type === 'password') {
                input.type = 'text';
                img.src = hideIcon;
                img.style.opacity = '1';
            } else {
                input.type = 'password';
                img.src = viewIcon;
                img.style.opacity = '0.5';
            }
        };
    });

    // 4. Validation & Strength Meter (3 of 4 Rule)
    const reqs = {
        len: v => v.length >= 8 && v.length <= 20,
        upper: v => /[A-Z]/.test(v),
        lower: v => /[a-z]/.test(v),
        spec: v => /[0-9!@#$%^&*]/.test(v)
    };

    passInput.oninput = () => {
        let passedCount = 0;
        const value = passInput.value;

        // Check each requirement
        Object.keys(reqs).forEach(id => {
            const element = document.getElementById(id);
            if (reqs[id](value)) {
                element.style.color = "#4CAF50"; // Green
                element.style.opacity = "1";
                passedCount++;
            } else {
                element.style.color = ""; // Default
                element.style.opacity = "0.6";
            }
        });

        // Update Strength Bar Color and Width
        strengthBar.style.width = (passedCount / 4) * 100 + "%";
        
        if (passedCount < 2) strengthBar.style.background = "#ff4d4d"; // Red
        else if (passedCount === 3) strengthBar.style.background = "#ffd700"; // Gold/Yellow
        else if (passedCount === 4) strengthBar.style.background = "#4CAF50"; // Green

        // Final Validation: Enable button only if 3 or more conditions are met
        if (passedCount >= 3) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = "1";
            submitBtn.style.cursor = "pointer";
        } else {
            submitBtn.disabled = true;
            submitBtn.style.opacity = "0.5";
            submitBtn.style.cursor = "not-allowed";
        }
    };

    // 5. Submit Flow
    document.getElementById('passwordForm').onsubmit = (e) => {
        e.preventDefault();
        
        // Final password match check
        if (passInput.value !== confirmInput.value) {
            alert("Passwords do not match!");
            return;
        }
        
        submitBtn.innerHTML = "CREATING ACCOUNT...";
        submitBtn.disabled = true;

        // Simulate Account Creation
        setTimeout(() => {
            window.location.href = 'LoginPG.html';
        }, 1500);
    };
});
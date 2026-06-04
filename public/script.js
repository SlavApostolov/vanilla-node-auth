const registerForm = document.getElementById('registerForm');
const regMessage = document.getElementById('reg-message');
const captchaImage = document.getElementById('captchaImage');
const reloadCaptchaBtn = document.getElementById('reloadCaptcha');

reloadCaptchaBtn.addEventListener('click', () => {
    captchaImage.src = `http://127.0.0.1:3000/api/captcha?time=${Date.now()}`;
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    regMessage.textContent = "Loading...";
    regMessage.style.color = "black";

    const payload = {
        names: document.getElementById('reg-names').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value,
        captchaAnswer: document.getElementById('reg-captcha').value
    };

    try {
        const response = await fetch('http://127.0.0.1:3000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            regMessage.style.color = "green";
            regMessage.textContent = "Success: " + data.message;
            registerForm.reset();
            reloadCaptchaBtn.click();
        } else {
            regMessage.style.color = "red";
            regMessage.textContent = "Error: " + data.error;
        }

    } catch (error) {
        console.error(error);
        regMessage.style.color = "red";
        regMessage.textContent = "Failed to connect to the server.";
    }
});

const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('login-message');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    loginMessage.textContent = "Loading...";
    loginMessage.style.color = "black";

    const payload = {
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
    };

    try {
        const response = await fetch('http://127.0.0.1:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            loginMessage.style.color = "green";
            loginMessage.textContent = `Welcome, ${data.user.names}`;
            loginForm.reset();
        } else {
            loginMessage.style.color = "red";
            loginMessage.textContent = "Error: " + data.error;
        }
    } catch (error) {
        console.error(error);
        loginMessage.style.color = "red";
        loginMessage.textContent = "Failed to connect to the server.";
    }
});
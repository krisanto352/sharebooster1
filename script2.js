const serverUrls = {
    server1: 'https://server1-project502.onrender.com',
    server2: 'https://server2-project502.onrender.com',
    server3: 'https://server3-project502.onrender.com'
};

const encodedKeysByDay = {
    0: 'S0VZX0JFVExPRw==',
    1: 'S0VZX01BS0FOVE9USU4=',
    2: 'S0VZX1RBTkdB',
    3: 'S0VZX0tVUEFM',
    4: 'S0VZX1VMT0w=',
    5: 'S0VZX0JVR09L',
    6: 'S0VZX05JR0dFUg=='
};

function decodeBase64(str) {
    try {
        return atob(str);
    } catch {
        return '';
    }
}

function getTodayPremiumKey() {
    const today = new Date().getDay();
    return decodeBase64(encodedKeysByDay[today]);
}

function isPremiumUser() {
    const key = document.getElementById('premium-key').value.trim();
    return key === getTodayPremiumKey();
}

function isPremiumActivated() {
    return localStorage.getItem('isPremiumActivated') === 'true';
}

function setCooldown(serverKey, minutes) {
    const cooldownUntil = Date.now() + minutes * 60 * 1000;
    localStorage.setItem(`cooldown_${serverKey}`, cooldownUntil);
    updateServerText(serverKey);
}

function getCooldownRemaining(serverKey) {
    const cooldownUntil = parseInt(localStorage.getItem(`cooldown_${serverKey}`) || '0');
    return cooldownUntil - Date.now();
}

function isCooldownActive(serverKey) {
    return !isPremiumActivated() && getCooldownRemaining(serverKey) > 0;
}

function updateServerText(serverKey) {
    const option = document.querySelector(`#server option[value="${serverKey}"]`);
    const baseText = option.textContent.split(' (')[0];
    const remaining = getCooldownRemaining(serverKey);

    if (!isPremiumActivated()) {
        option.disabled = true;
        if (remaining > 0) {
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            option.textContent = `${baseText} (cooldown ${minutes}:${seconds.toString().padStart(2, '0')})`;
        } else {
            option.textContent = `${baseText} (locked)`;
        }
    } else {
        option.disabled = false;
        option.textContent = `${baseText} (active)`;
        localStorage.removeItem(`cooldown_${serverKey}`);
    }
}

function refreshCooldownUI() {
    ['server1', 'server2', 'server3'].forEach(serverKey => updateServerText(serverKey));
}

setInterval(refreshCooldownUI, 1000);

async function checkServerStatus() {
    const servers = document.querySelectorAll('#server option');
    let allDown = true;
    const submitButton = document.getElementById('submit-button');

    for (const server of servers) {
        const serverKey = server.value;
        try {
            const response = await fetch(serverUrls[serverKey]);
            if (response.ok && !isCooldownActive(serverKey)) {
                server.textContent = `${server.textContent.split(' (')[0]} (active)`;
                server.disabled = !isPremiumActivated();
                allDown = false;
            } else if (!isCooldownActive(serverKey)) {
                server.textContent = `${server.textContent.split(' (')[0]} (down)`;
                server.disabled = true;
            }
        } catch {
            server.textContent = `${server.textContent.split(' (')[0]} (down)`;
            server.disabled = true;
        }
    }

    submitButton.disabled = allDown;
}

document.getElementById('share-boost-form').onsubmit = async function (event) {
    event.preventDefault();
    const modal = document.getElementById('responseModal');
    const message = document.getElementById('responseMessage');
    const url = document.getElementById('urls').value;
    const amount = parseInt(document.getElementById('amounts').value);
    const cookie = document.getElementById('cookies').value;
    const interval = parseInt(document.getElementById('intervals').value);
    const serverValue = document.getElementById('server').value;

    if (isCooldownActive(serverValue)) {
        alert(`This server is on cooldown. Please wait before using it again.`);
        return;
    }

    message.textContent = 'Processing your request, please wait...';
    modal.style.display = 'flex';

    try {
        const server = serverUrls[serverValue];
        const response = await fetch(`${server}/api/submit`, {
            method: 'POST',
            body: JSON.stringify({ cookie, url, amount, interval }),
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (data.status === 200) {
            message.textContent = 'Your request was submitted successfully!';
            if (!isPremiumActivated()) {
                setCooldown(serverValue, 1440);
            }
        } else {
            message.textContent = `Error: ${data.message}`;
        }
    } catch {
        message.textContent = 'Network error, please try again.';
    } finally {
        setTimeout(() => modal.style.display = 'none', 3000);
    }
};

function updateDateTime() {
    const dateTimeElement = document.getElementById('date-time');
    const now = new Date();
    const options = { timeZone: 'Asia/Manila', hour12: true };
    dateTimeElement.textContent = `Date/Time : ${now.toLocaleString('en-US', options)}`;
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const modeSwitch = document.getElementById('mode-switch');
    modeSwitch.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
}

document.getElementById('mode-switch').addEventListener('click', toggleDarkMode);

async function fetchCatFact() {
    const display = document.getElementById('catfact-text');
    display.textContent = 'Fetching cat fact...';
    try {
        const response = await fetch('https://catfact.ninja/fact');
        const data = await response.json();
        display.textContent = data.fact || 'Could not fetch a cat fact.';
    } catch {
        display.textContent = 'An error occurred. Please try again.';
    }
}

document.getElementById('fetch-catfact-button').addEventListener('click', fetchCatFact);

window.onload = () => {
    checkServerStatus();
    updateDateTime();
    fetchCatFact();
    refreshCooldownUI();

    const premiumInput = document.getElementById('premium-key');
    const savedKey = localStorage.getItem('premiumKey') || '';
    premiumInput.value = savedKey;

    premiumInput.addEventListener('input', () => {
        localStorage.setItem('premiumKey', premiumInput.value.trim());
    });

    if (!isPremiumActivated()) {
        const serverOptions = document.querySelectorAll('#server option');
        serverOptions.forEach(option => {
            option.disabled = true;
            option.textContent = `${option.textContent.split(' (')[0]} (locked)`;
        });
    }
};

function activatePremium() {
    if (!isPremiumUser()) {
        alert('Invalid premium key.');
        return;
    }

    localStorage.setItem('isPremiumActivated', 'true');

    ['server1', 'server2', 'server3'].forEach(serverKey => {
        localStorage.removeItem(`cooldown_${serverKey}`);
        const option = document.querySelector(`#server option[value="${serverKey}"]`);
        option.disabled = false;
        option.textContent = `${option.textContent.split(' (')[0]} (active)`;
    });

    alert('Premium activated! Cooldowns removed and servers unlocked.');
        }

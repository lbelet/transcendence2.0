
document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const errorMessageElement = document.getElementById('UserLoginErrorMessage');
    errorMessageElement.style.display = 'none';

    const csrfToken = getCSRFToken();
    console.log(csrfToken);


    fetch('/api/api_login/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({
            username: username,
            password: password,
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            localStorage.setItem('username', username);
            console.log("les datas sont: ", data)
            if (data['2fa_required']) {
                if (data['2fa_method'] === 'qr') {
                    const qrCodeImgSrc = data['qr_code_img'];
                    document.getElementById('qr-code-img').src = qrCodeImgSrc;
                    showQrTwoFactorForm();
                } else {
                    showTwoFactorForm();
                }
            } else {
                if (data.login_successful == true) {
                    console.log('Login successful:', data);
                    localStorage.setItem('access_token', data.access);
                    localStorage.setItem('refresh_token', data.refresh);
                    localStorage.setItem('language', data.language);
                    localStorage.setItem('avatarURL', data.avatar_url);
                    localStorage.setItem('userID', data.id);

                    console.log('refresh token: ', localStorage.getItem('refresh_token'))
                    setupTokenRefresh();
                    document.getElementById('hiddenNav').classList.remove('hidden');
                    loadTranslations(data.language)
                        .then( ret => {
                        navigateWithTokenCheck('game');
                        window.updateUserUI();

                        openWebSocketConnection();
                        });
                }
                else{
                    displayErrorMessageLogin()
                }
            }
        })
        .catch(error => {
        });
});


async function showAlert(key) {
    var lang = localStorage.getItem('language');

    try {
        const response = await fetch('./locales/alerts.json');
        const messages = await response.json();

        if (messages[key] && messages[key][lang]) {
            var message = messages[key][lang];
        } else {
        }
    } catch (error) {
    }
}

function logout() {

    if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.close();
        console.log("socket close: ", websocket)
    }
    const csrfToken = getCSRFToken();

    fetch('/api/logout/', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({})
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log(data.message);

            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('username');
            localStorage.setItem('in1v1', "no");
            localStorage.removeItem('inGame');
            localStorage.removeItem('inTournament');
            localStorage.removeItem('inPongGame');


            stopTokenRefreshInterval();
            localStorage.removeItem('gameSocket_ID');
            document.getElementById('hiddenNav').classList.add('hidden');
            stopAudio();
            navigateTo('home');
        })
        .catch(error => {
        });
}

document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    fetch('/api/api_login/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: password,
        })
    })
        .then(response => response.json().then(data => ({ status: response.status, body: data })))
        .then(obj => {
            if (obj.status === 200) {
                localStorage.setItem('username', username);

                if (obj.body['2fa_required']) {
                    if (obj.body['2fa_method'] === 'qr') {
                        const qrCodeImgSrc = obj.body['qr_code_img'];
                        document.getElementById('qr-code-img').src = qrCodeImgSrc;
                        showQrTwoFactorForm();
                    } else {
                        showTwoFactorForm();
                    }
                } else {
                    localStorage.setItem('access_token', obj.body.access);
                    localStorage.setItem('refresh_token', obj.body.refresh);
                    localStorage.setItem('language', obj.body.language);

                    loadTranslations(obj.body.language);
                    showWelcome();
                    openWebSocketConnection();
                    document.getElementById('hiddenNav').classList.remove('hidden');
                }
            } else {
                alert(obj.body.error);
            }
        })
        .catch(error => {
            alert('Une erreur est survenue lors de la tentative de connexion.');
        });
});



function logout() {

    if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.close();
        console.log("socket close: ", websocket)
    }

    fetch('/api/logout/', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
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
            localStorage.removeItem('language');
            localStorage.removeItem('gameSocket_ID');
            document.getElementById('hiddenNav').classList.add('hidden');
            navigateTo('home');
        })
        .catch(error => {
            alert('Erreur lors de la déconnexion');
        });
}
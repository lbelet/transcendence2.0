

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
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            localStorage.setItem('username', username);

            if (data['2fa_required']) {
                if (data['2fa_method'] === 'qr') {
                    const qrCodeImgSrc = data['qr_code_img'];
                    document.getElementById('qr-code-img').src = qrCodeImgSrc;
                    showQrTwoFactorForm();
                } else {
                    showTwoFactorForm();
                }
            } else {
                console.log('Login successful:', data);
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                localStorage.setItem('language', data.language);
                // Après une connexion réussie
                const burgerMenu = document.getElementById('bMenu');
                burgerMenu.classList.remove('hidden');

                const searchingBar = document.getElementById('searchU');
                searchingBar.classList.remove('hidden');

                console.log("Burger menu should be visible now");


                loadTranslations(data.language); // Charger les traductions pour la langue récupérée
                showWelcome();
                openWebSocketConnection();
            }
        })
        .catch(error => {
            console.error('Login error:', error);
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

            const burgerMenu = document.getElementById('bMenu');
            burgerMenu.classList.add('hidden');
            
            const burgerMenuContent = document.getElementById('burgerMenuContent');
            burgerMenuContent.classList.add('hidden');

            const searchingBar = document.getElementById('searchU');
            searchingBar.classList.add('hidden');

            console.log("Burger menu should be hidden now");

            navigateTo('home');
        })
        .catch(error => {
            console.error('Erreur lors de la déconnexion:', error);
        });
}
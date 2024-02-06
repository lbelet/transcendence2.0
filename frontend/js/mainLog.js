// document.getElementById('loginForm').addEventListener('submit', function (event) {
//     event.preventDefault();
//     const username = document.getElementById('login-username').value;
//     const password = document.getElementById('login-password').value;

//     const errorMessageElement = document.getElementById('UserLoginErrorMessage');
//     errorMessageElement.style.display = 'none';

//     fetch('/api/api_login/', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             username: username,
//             password: password,
//         })
//     })
//     .then(response => response.json())
//     .then(data => {
//         localStorage.setItem('username', username);
//         if (data['2fa_required']) {
//             if (data['2fa_method'] === 'qr') {
//                 const qrCodeImgSrc = data['qr_code_img'];
//                 document.getElementById('qr-code-img').src = qrCodeImgSrc;
//                 showQrTwoFactorForm();
//             } else {
//                 showTwoFactorForm();
//             }
//         }
        
//         if (data.login_successful) {
//             console.log('login ok')
//             localStorage.setItem('username', username);

//             if (data['2fa_required']) {
//                 if (data['2fa_method'] === 'qr') {
//                     const qrCodeImgSrc = data['qr_code_img'];
//                     document.getElementById('qr-code-img').src = qrCodeImgSrc;
//                     showQrTwoFactorForm();
//                 } else {
//                     showTwoFactorForm();
//                 }
//             } else {
//                 // Connexion réussie sans authentification à deux facteurs
//                 localStorage.setItem('access_token', data.access);
//                 localStorage.setItem('refresh_token', data.refresh);
//                 localStorage.setItem('language', data.language);
//                 localStorage.setItem('userID', data.id);
//                 localStorage.setItem('avatarURL', data.avatar_url);

//                 setupTokenRefresh();
//                 loadTranslations(data.language);
//                 window.updateUserUI();
//                 navigateWithTokenCheck('game');
//                 openWebSocketConnection();
//                 document.getElementById('hiddenNav').classList.remove('hidden');
//             }
//         } else {
//             console.log("data du login: ", data)
//             console.log('login paaaaas ok')
//             // Affichage d'un message d'erreur de connexion
//             // errorMessageElement.textContent = data.message; // Utiliser le message renvoyé par le serveur
//             // errorMessageElement.style.display = 'block'; // Assurez-vous que cet élément est correctement stylé pour afficher l'erreur
//             displayErrorMessageLogin(data.message)
//         }
//     })
//     .catch(error => {
//         console.error('Une erreur est survenue lors de la tentative de connexion:', error);
//         errorMessageElement.textContent = 'Une erreur technique est survenue. Veuillez réessayer plus tard.';
//         errorMessageElement.style.display = 'block';
//     });
// });

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
                window.updateUserUI();
                navigateWithTokenCheck('game');
                openWebSocketConnection();
                document.getElementById('hiddenNav').classList.remove('hidden');

                loadTranslations(data.language); // Charger les traductions pour la langue récupérée
                // showWelcome();
                openWebSocketConnection();
            }
        })
        .catch(error => {
            console.error('Login error:', error);
        });
});


async function showAlert(key) {
    var lang = localStorage.getItem('language');

    try {
        const response = await fetch('./locales/alerts.json');
        const messages = await response.json();

        if (messages[key] && messages[key][lang]) {
            var message = messages[key][lang];
            alert(message);
        } else {
            alert("Message not found for key: " + key + " and language: " + lang);
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
        alert("Unable to load messages.");
    }
}

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

            stopTokenRefreshInterval();
            // localStorage.removeItem('language');
            localStorage.removeItem('gameSocket_ID');
            document.getElementById('hiddenNav').classList.add('hidden');
            stopAudio();
            navigateTo('home');
        })
        .catch(error => {
            alert('Erreur lors de la déconnexion');
        });
}
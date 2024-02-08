
document.getElementById('EmailTwoFactorForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const twoFactorCode = document.getElementById('twoFactorCode').value;
    const username = localStorage.getItem('username'); // Assurez-vous que le nom d'utilisateur est stocké lors de la tentative de connexion initiale
    const csrfToken = getCSRFToken();

    fetch('/api/verify_two_factor_code/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'X-CSRFToken': csrfToken

        },
        body: JSON.stringify({
            username: username,
            two_factor_code: twoFactorCode,
        })
    })
        .then(response => {
            if (!response.ok) {
                localStorage.removeItem('username');
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('2FA Verification successful:', data);
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            localStorage.setItem('language', data.language);
            localStorage.setItem('avatarURL', data.avatar_url);
            localStorage.setItem('userID', data.id);

            setupTokenRefresh();

            // Après une connexion réussie
            // const burgerMenu = document.getElementById('bMenu');
            // burgerMenu.classList.remove('hidden');

            // const searchingBar = document.getElementById('searchU');
            // searchingBar.classList.remove('hidden');

            // console.log("Burger menu should be visible now");
            document.getElementById('hiddenNav').classList.remove('hidden');
            loadTranslations(data.language)
            .then( ret => {
              navigateWithTokenCheck('game');
              window.updateUserUI();

              // showWelcome();
              openWebSocketConnection();
            });
        })
        .catch(error => {
            console.error('2FA Verification error:', error);
            alert('Invalid 2FA code. Please try again.');
        });
});

// Event listener for the QR two-factor authentication form submission
// document.getElementById('qrTwoFactorForm').addEventListener('submit', function (event) {
//     event.preventDefault();
//     const qrTwoFactorCode = document.getElementById('qrTwoFactorCode').value;
//     const username = localStorage.getItem('username'); // Assuming username is stored in localStorage

//     fetch('/api/verify_two_factor_code/', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${localStorage.getItem('access_token')}`
//         },
//         body: JSON.stringify({
//             username: username,
//             two_factor_code: qrTwoFactorCode,
//         })
//     })
//         .then(response => {
//             console.log("la reponse est: ", response)
//             if (!response.ok) {
//                 localStorage.removeItem('username')
//                 throw new Error('Network response was not ok');
//             }
//             return response.json();
//         })
//         .then(data => {
//             console.log('QR 2FA Verification successful:', data);
//             localStorage.setItem('access_token', data.access);
//             localStorage.setItem('refresh_token', data.refresh);
//             localStorage.setItem('language', data.language);

//             setupTokenRefresh();

//             // Après une connexion réussie
//             // const burgerMenu = document.getElementById('bMenu');
//             // burgerMenu.classList.remove('hidden');

//             // const searchingBar = document.getElementById('searchU');
//             // searchingBar.classList.remove('hidden');

//             // console.log("Burger menu should be visible now");

//             navigateWithTokenCheck('game');
//             openWebSocketConnection();
//         })
//         .catch(error => {
//             console.error('QR 2FA Verification error:', error);
//             alert('Invalid QR 2FA code. Please try again.');
//         });
// });

document.getElementById('qrTwoFactorForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const qrTwoFactorCode = document.getElementById('qrTwoFactorCode').value;
    const username = localStorage.getItem('username'); // Assuming username is stored in localStorage
    const csrfToken = getCSRFToken();

    fetch('/api/verify_two_factor_code/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({
            username: username,
            two_factor_code: qrTwoFactorCode,
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('QR 2FA Verification successful:', data);
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            localStorage.setItem('language', data.language);
            localStorage.setItem('avatarURL', data.avatar_url);
            localStorage.setItem('userID', data.id);
            // Après une connexion réussie
            setupTokenRefresh();
            window.updateUserUI();
            navigateWithTokenCheck('game');
            openWebSocketConnection();
            document.getElementById('hiddenNav').classList.remove('hidden');
        })
        .catch(error => {
            // console.error('QR 2FA Verification error:', error);
            // alert('Invalid QR 2FA code. Please try again.');
        });
});
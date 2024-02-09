
document.getElementById('EmailTwoFactorForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const twoFactorCode = document.getElementById('twoFactorCode').value;
    const username = localStorage.getItem('username'); 
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
            if (data.error)
                displayErrorMessage2FA(data.error)
                else {
                console.log('2FA Verification successful:', data);
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                localStorage.setItem('language', data.language);
                localStorage.setItem('avatarURL', data.avatar_url);
                localStorage.setItem('userID', data.id);

                setupTokenRefresh();

                document.getElementById('hiddenNav').classList.remove('hidden');
                loadTranslations(data.language)
                .then( ret => {
                navigateWithTokenCheck('game');
                window.updateUserUI();

                openWebSocketConnection();
                });
            }
        })
        .catch(error => {
            displayErrorMessage2FA(data.error)
        });
});


document.getElementById('qrTwoFactorForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const qrTwoFactorCode = document.getElementById('qrTwoFactorCode').value;
    const username = localStorage.getItem('username'); 
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
            if (data.error)
                displayErrorMessage2FAQR(data.error)
            else {
                console.log('QR 2FA Verification successful:', data);
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                localStorage.setItem('language', data.language);
                localStorage.setItem('avatarURL', data.avatar_url);
                localStorage.setItem('userID', data.id);
                setupTokenRefresh();
                window.updateUserUI();
                navigateWithTokenCheck('game');
                openWebSocketConnection();
                document.getElementById('hiddenNav').classList.remove('hidden');
            }
        })
        .catch(error => {
        
        });
});
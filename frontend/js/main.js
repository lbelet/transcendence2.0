window.onload = async function () {
    console.log("onload....");
    if (localStorage.getItem('access_token')) {
        try {
            await refreshToken();
            setupTokenRefresh();
            document.getElementById('hiddenNav').classList.remove('hidden');
        } catch (error) {
            console.error("Error during token refresh:", error);
            document.getElementById('hiddenNav').classList.add('hidden');
            // Gérer l'erreur de rafraîchissement du token, si nécessaire
        }
    }
    const path = window.location.pathname.substring(1);
    if (path) {
        navigateWithTokenCheck(path);
    } else {
        navigateWithTokenCheck('home');
    }
};

window.onpopstate = function (event) {
    if (event.state && event.state.section) {
        navigateWithTokenCheck(event.state.section);
    } else {
        navigateWithTokenCheck('home');
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const userName = localStorage.getItem('username');
    if (userName) {
        document.getElementById('user-name-game').textContent = userName;
    }
    const avatar_url = localStorage.getItem('avatarURL')
    console.log('avatarURL: ', avatar_url)
    if (avatar_url) {
        document.getElementById('user-avatar').src = avatar_url;    }
});

window.updateUserUI = function() {
    const userName = localStorage.getItem('username');
    const avatarUrl = localStorage.getItem('avatarURL');

    if (userName) {
        document.getElementById('user-name-game').textContent = userName;
    }

    if (avatarUrl) {
        document.getElementById('user-avatar').src = avatarUrl;
    }
}

// Appeler au chargement de la page
document.addEventListener('DOMContentLoaded', updateUserUI);

// Vous pouvez également appeler updateUserUI() après des actions utilisateur comme la connexion ou la mise à jour du profil

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

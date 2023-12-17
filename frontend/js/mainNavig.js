
function showLoginForm() {
    navigateTo('login');
}

function showRegisterForm() {
    navigateTo('register');
}

function goTournament() {
    navigateTo('tournament')
}

function showTwoFactorForm() {
    navigateTo('email-two-factor');
}

function showQrTwoFactorForm() {
    navigateTo('qr-two-factor');
}

function hideAllSections() {
    document.getElementById('home-section').classList.add('hidden');
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('register-section').classList.add('hidden');
    document.getElementById('welcome-section').classList.add('hidden');
    document.getElementById('game-section').classList.add('hidden');
    document.getElementById('email-two-factor-section').classList.add('hidden');
    document.getElementById('pong-section').classList.add('hidden');
    document.getElementById('qr-two-factor-section').classList.add('hidden');
    document.getElementById('tournament-section').classList.add('hidden');
    document.getElementById('tournamentBracket-section').classList.add('hidden');
}

function navigateTo(sectionId) {
    if (!isValidToken() && sectionId !== 'login' && sectionId !== 'home' && sectionId !== 'register') {
        navigateTo('home');
        return;
    }
    hideAllSections();
    document.getElementById(sectionId + '-section').classList.remove('hidden');

    if (!window.location.pathname.endsWith(`/${sectionId}`)) {
        window.history.pushState({ section: sectionId }, '', `/${sectionId}`);
    }
}

function isValidToken() {
    const token = localStorage.getItem('access_token');
    // Ajoutez ici la logique pour vérifier la validité du token
    return token !== null;
}



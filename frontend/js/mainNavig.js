
function showLoginForm() {
    navigateTo('login');
}

function showRegisterForm() {
    navigateTo('register');
}

function goTournament() {
    navigateTo('tournament')
}

// function showEditUserForm() {
//     navigateTo('edit-user');
// }

// function showTournamentDetails() {
//     navigateTo('tournamentBracket')
// }

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
    // document.getElementById('edit-user-section').classList.add('hidden'); // Add this line 
    document.getElementById('email-two-factor-section').classList.add('hidden');
    document.getElementById('pong-section').classList.add('hidden');
    document.getElementById('qr-two-factor-section').classList.add('hidden');
    document.getElementById('tournament-section').classList.add('hidden');
    document.getElementById('tournamentBracket-section').classList.add('hidden');
}

function navigateTo(sectionId) {
    if (!isValidToken() && sectionId !== 'login' && sectionId !== 'home' && sectionId !== 'register') {
        // console.log("Redirection vers la page de connexion");
        navigateTo('home');
        return;
    }
    // console.log("Navigating to:", sectionId);
    hideAllSections();
    document.getElementById(sectionId + '-section').classList.remove('hidden');

    if (!window.location.pathname.endsWith(`/${sectionId}`)) {
        // console.log("Updating state to:", sectionId);
        window.history.pushState({ section: sectionId }, '', `/${sectionId}`);
    }
}

function toggleMenu() {
    const burgerMenuContent = document.getElementById('burgerMenuContent');

    if (burgerMenuContent.classList.contains('hidden')) {
        burgerMenuContent.classList.remove('hidden');
        // console.log("plus hidden....")
    } else {
        burgerMenuContent.classList.add('hidden');
        // console.log("de nouveau hidden....")
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // Ajouter l'écouteur d'événement au document entier
    document.addEventListener('click', (event) => {
        const burgerMenuContent = document.getElementById('burgerMenuContent');
        const burgerMenu = document.getElementById('bMenu');

        // Vérifier si le clic est en dehors du burgerMenuContent et si le menu est ouvert
        if (!burgerMenu.contains(event.target) && !burgerMenuContent.contains(event.target) && !burgerMenuContent.classList.contains('hidden')) {
            burgerMenuContent.classList.add('hidden');
        }
    });
});

function isValidToken() {
    const token = localStorage.getItem('access_token');
    // Ajoutez ici la logique pour vérifier la validité du token
    return token !== null; // Exemple simple
}




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
    return token !== null;
}

function openSearchResultsModal() {
    var myModal = new bootstrap.Modal(document.getElementById('searchResultsModal'));
    myModal.show();
}

function closeSearchResultsModal() {
    var myModal = bootstrap.Modal.getInstance(document.getElementById('searchResultsModal'));
    myModal.hide();
    var backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.remove();
    }
}

function openEditModal() {
    var myModal = new bootstrap.Modal(document.getElementById('editUserModal'));
    myModal.show();
}

function closeEditModal() {
    var myModal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
    myModal.hide();
    var backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.remove();
    }
}

function openTournamentModal() {
    var myModal = new bootstrap.Modal(document.getElementById('createTournamentModal'));
    myModal.show();
}

function closeTournamentModal() {
    var myModal = bootstrap.Modal.getInstance(document.getElementById('createTournamentModal'));
    myModal.hide();
    var backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.remove();
    }
}

function openFriendsModal() {
    loadFriendsList();
    var myModal = new bootstrap.Modal(document.getElementById('friendsModal'));
    myModal.show();
}

function closeFriendstModal() {
    var myModal = bootstrap.Modal.getInstance(document.getElementById('friendsModal'));
    myModal.hide();
    var backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.remove();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname;

    console.log('La page actuelle est :', currentPage);

    if (localStorage.getItem('access_token')) {
        document.getElementById('hiddenNav').classList.remove('hidden');
    }
    if (currentPage === '/welcome') {
        const username = localStorage.getItem('username');
        document.getElementById('user-name-welcome').textContent = username || 'Utilisateur';
    } 
});

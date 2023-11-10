function showLoginForm() {
    navigateTo('login');
}

function showRegisterForm() {
    navigateTo('register');
}

function showGameForm() {
    navigateTo('game');
}

function hideAllSections() {
    document.getElementById('home-section').classList.add('hidden');
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('register-section').classList.add('hidden');
    document.getElementById('welcome-section').classList.add('hidden');
    document.getElementById('game-section').classList.add('hidden');
}

// Initialiser la page sur la section d'accueil
window.onload = function () {
    const path = window.location.hash.substring(1);
    if (path) {
        navigateTo(path);
    } else {
        navigateTo('home');
    }
};

function navigateTo(sectionId) {
    console.log("Navigating to:", sectionId);
    hideAllSections();
    document.getElementById(sectionId + '-section').classList.remove('hidden');

    if (window.location.hash !== `#${sectionId}`) {
        console.log("Already in the section:", sectionId);
        window.history.pushState({ section: sectionId }, '', `#${sectionId}`);
    }
}

window.onpopstate = function (event) {
    console.log("Popstate event:", event.state);
    if (event.state && event.state.section) {
        navigateTo(event.state.section);
    } else {
        navigateTo('home');
    }
};

function showWelcome() {
    const username = localStorage.getItem('username');
    document.getElementById('user-name').textContent = username || 'Utilisateur';
    navigateTo('welcome');
}

document.getElementById('registerForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const firstName = document.getElementById('firstname').value;
    const lastName = document.getElementById('lastname').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const retypePassword = document.getElementById('retypePassword').value;

    if (password === retypePassword) {
        axios.post('/api/register/', {
            username: username,
            first_name: firstName,
            last_name: lastName,
            email: email,
            password: password,
        })
            .then(function (response) {
                console.log('Registered successfully:', response.data);
                //ici pour jwt je pense
                navigateTo('login');
            })
            .catch(function (error) {
                console.error('Registration error:', error);
            });
    } else {
        alert('Passwords do not match!');
    }
});

document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    axios.post('/api/api_login/', {
        username: username,
        password: password,
    })
        .then(function (response) {
            console.log('Login successful:', response.data);
            localStorage.setItem('username', username);
            showWelcome();
        })
        .catch(function (error) {
            console.error('Login error:', error);
        });
});


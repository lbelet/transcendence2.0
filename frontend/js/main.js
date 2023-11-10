function showLoginForm() {
    document.getElementById('home-section').classList.add('hidden');
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('register-section').classList.add('hidden');
    document.getElementById('welcome-section').classList.add('hidden');
    document.getElementById('game-section').classList.add('hidden');
    navigateTo('login');
}

function showRegisterForm() {
    document.getElementById('home-section').classList.add('hidden');
    document.getElementById('register-section').classList.remove('hidden');
    document.getElementById('welcome-section').classList.add('hidden');
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('game-section').classList.add('hidden');
    navigateTo('register');
}

function showGameForm() {
    document.getElementById('home-section').classList.add('hidden');
    document.getElementById('register-section').classList.add('hidden');
    document.getElementById('welcome-section').classList.add('hidden');
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('game-section').classList.remove('hidden');
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
    const path = window.location.hash.substring(1); // Retire le '#' de l'URL
    if (path) {
        navigateTo(path);
    } else {
        navigateTo('home');
    }
};

function navigateTo(sectionId) {
    hideAllSections();
    document.getElementById(sectionId + '-section').classList.remove('hidden');
    window.history.pushState({ section: sectionId }, '', `#${sectionId}`);
}

window.onpopstate = function (event) {
    if (event.state && event.state.section) {
        navigateTo(event.state.section);
    } else {
        navigateTo('home');
    }
};

// import axios from 'axios';

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
            // Incluez d'autres champs si nécessaire, comme 'age' si vous l'avez ajouté à votre modèle
        })
            .then(function (response) {
                console.log('Registered successfully:', response.data);
                // Vous pouvez rediriger l'utilisateur ou afficher un message de succès ici
                navigateTo('login'); // Mettez ici l'URL de votre page de connexion
            })
            .catch(function (error) {
                console.error('Registration error:', error);
                // Affichez un message d'erreur à l'utilisateur ici
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
            // Gérer la connexion réussie ici
            navigateTo('welcome'); // Par exemple, naviguer vers la section 'home'
        })
        .catch(function (error) {
            console.error('Login error:', error);
            // Afficher un message d'erreur ici
        });
});

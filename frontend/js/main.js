function showLoginForm() {
    navigateTo('login');
}

function showRegisterForm() {
    navigateTo('register');
}

function playPong() {
    navigateTo('pong')
}

function showGameForm() {
    const username = localStorage.getItem('username');
    console.log("1 username: ", username)
    document.getElementById('user-name-game').textContent = username || 'Utilisateur';
    navigateTo('game');
}

function hideAllSections() {
    document.getElementById('home-section').classList.add('hidden');
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('register-section').classList.add('hidden');
    document.getElementById('welcome-section').classList.add('hidden');
    document.getElementById('game-section').classList.add('hidden');
    document.getElementById('pong-section').classList.add('hidden');
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

function logout() {
    localStorage.removeItem('username');
    navigateTo('home');
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
    console.log("2 username: ", username)
    document.getElementById('user-name-welcome').textContent = username || 'Utilisateur';
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
            //ici pour jwt je pense
            console.log('Login successful:', response.data);
            localStorage.setItem('username', username);
            showWelcome();
            connectWebSocket();
        })
        .catch(function (error) {
            console.error('Login error:', error);
        });
});


//-------------------- SOCKETS -----------------

// Variable globale pour la connexion WebSocket
let socket;

// Fonction pour établir la connexion WebSocket
function connectWebSocket() {
    // Remplacez 'wss://votreurl.com' par votre URL WebSocket
    socket = new WebSocket('wss://localhost');
    console.log("socket: ", socket)
    socket.onopen = function (event) {
        console.log('WebSocket connecté');
        // Autres traitements à l'ouverture
    };

    socket.onmessage = function (event) {
        console.log('Message reçu:', event.data);
        // Traiter les messages entrants
    };

    socket.onerror = function (error) {
        console.error('Erreur WebSocket:', error);
    };

    socket.onclose = function (event) {
        console.log('WebSocket déconnecté');
        // Autres traitements à la fermeture
    };
}

// Fonction pour envoyer un message via WebSocket
function sendWebSocketMessage(message) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(message);
    }
}

// Fonction pour fermer la connexion WebSocket
function disconnectWebSocket() {
    if (socket) {
        socket.close();
    }
}

// Intégrer avec la connexion et la déconnexion de l'utilisateur
// Par exemple, appeler connectWebSocket() après une connexion utilisateur réussie
// et disconnectWebSocket() lors de la déconnexion de l'utilisateur



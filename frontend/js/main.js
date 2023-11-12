// --- Navigation Functions ---

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

function showEditUserForm() {
    navigateTo('edit-user');
}

function showTwoFactorForm() {
    navigateTo('two-factor');
}

function showQrTwoFactorForm() {
    navigateTo('qr-two-factor');
}

function showWelcome() {
    const username = localStorage.getItem('username');
    document.getElementById('user-name').textContent = username || 'Utilisateur';
    navigateTo('welcome');
}

// --- Utility Functions ---

// Function to hide all sections
function hideAllSections() {
    document.getElementById('home-section').classList.add('hidden');
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('register-section').classList.add('hidden');
    document.getElementById('welcome-section').classList.add('hidden');
    document.getElementById('game-section').classList.add('hidden');
    document.getElementById('edit-user-section').classList.add('hidden'); // Add this line 
    document.getElementById('two-factor-section').classList.add('hidden');
    document.getElementById('pong-section').classList.add('hidden');
    document.getElementById('qr-two-factor-section').classList.add('hidden');

}

// Function to navigate to a specific section
function navigateTo(sectionId) {
    console.log("Navigating to:", sectionId);
    hideAllSections();
    document.getElementById(sectionId + '-section').classList.remove('hidden');

    if (window.location.hash !== `#${sectionId}`) {
        console.log("Already in the section:", sectionId);
        window.history.pushState({ section: sectionId }, '', `#${sectionId}`);
    }
}

// Event Listeners

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

// --- Event Listeners ---

// Event listener for the registration form submission
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

// Event listener for the login form submission
document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    axios.post('/api/api_login/', {
        username: username,
        password: password,
    })
        .then(function (response) {
            localStorage.setItem('username', username);

            if (response.data['2fa_required']) {
                if (response.data['2fa_method'] === 'qr') {
                    const qrCodeImgSrc = response.data['qr_code_img'];
                    document.getElementById('qr-code-img').src = qrCodeImgSrc;
                    showQrTwoFactorForm();
                } else {
                    showTwoFactorForm();
                }
            } else {
                console.log('Login successful:', response.data);
                localStorage.setItem('username', username);
                localStorage.setItem('access_token', response.data.access);
                localStorage.setItem('refresh_token', response.data.refresh);
                showWelcome();
                connectWebSocket();
            }
        })
        .catch(function (error) {
            console.error('Login error:', error);
        });
});

// Event listener for the edit user form submission
document.getElementById('editUserForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const selectedTwoFactorMethod = document.getElementById('twoFactorMethod').value;

    axios.post('/api/user/update', {
        username: localStorage.getItem('username'),
        twoFactorMethod: selectedTwoFactorMethod,
    }, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
    }).then(response => {
        alert(`2FA preference updated to ${selectedTwoFactorMethod.toUpperCase()}.`);
        navigateTo('welcome');
    }).catch(error => {
        console.error('Error updating 2FA preference:', error);
        alert('Error updating 2FA preference. Please try again.');
    });
});

// Event listener for the two-factor authentication form submission
document.getElementById('twoFactorForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const twoFactorCode = document.getElementById('twoFactorCode').value;
    const username = localStorage.getItem('username'); // Ensure the username is stored during the initial login attempt

    axios.post('/api/verify_two_factor_code/', {
        username: username,
        two_factor_code: twoFactorCode,
    })
        .then(function (response) {
            console.log('2FA Verification successful:', response.data);
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            showWelcome();
        })
        .catch(function (error) {
            console.error('2FA Verification error:', error);
            alert('Invalid 2FA code. Please try again.');
        });
});

// Event listener for the QR two-factor authentication form submission
document.getElementById('qrTwoFactorForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const qrTwoFactorCode = document.getElementById('qrTwoFactorCode').value;
    const username = localStorage.getItem('username'); // Assuming username is stored in localStorage

    axios.post('/api/verify_two_factor_code/', {
        username: username,
        two_factor_code: qrTwoFactorCode,
    })
        .then(function (response) {
            console.log('QR 2FA Verification successful:', response.data);
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            showWelcome();
        })
        .catch(function (error) {
            console.error('QR 2FA Verification error:', error);
            alert('Invalid QR 2FA code. Please try again.');
        });
});

// --- Token Management ---

// Function to refresh the token
function refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
        console.log('No refresh token available');
        return;
    }

    axios.post('/api/token/refresh/', {
        refresh: refreshToken
    })
        .then(function (response) {
            console.log('Token refreshed successfully');
            localStorage.setItem('access_token', response.data.access);
        })
        .catch(function (error) {
            console.error('Error refreshing token:', error);
        });
}

// Function to verify the token
function verifyToken() {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
        console.log('No access token available');
        return;
    }

    axios.post('/api/token/verify/', {
        token: accessToken
    })
        .then(function (response) {
            console.log('Token is valid');
        })
        .catch(function (error) {
            console.error('Invalid token:', error);
        });
}

// Function to handle user logout
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');

    navigateTo('login');
}

// --- Page Initialization ---

// Function to initialize the page based on the URL hash
window.onload = function () {
    const path = window.location.hash.substring(1);
    if (path) {
        navigateTo(path);
    } else {
        navigateTo('home');
    }
};

// Handling browser back and forward navigation events
window.onpopstate = function (event) {
    console.log("Popstate event:", event.state);
    if (event.state && event.state.section) {
        navigateTo(event.state.section);
    } else {
        navigateTo('home');
    }
};

// Add this line to initialize the edit user form when the edit user page is loaded
if (window.location.hash === '#edit-user') {
    showEditUserForm();
}

//-------------------- SOCKETS -----------------

// Variable globale pour la connexion WebSocket
let socket;

// Fonction pour établir la connexion WebSocket
function connectWebSocket() {
    // Remplacez 'wss://votreurl.com' par votre URL WebSocket
    socket = new WebSocket('wss://localhost/');
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



// --- Navigation Functions ---

function quitPong3D() {
    fetch('/api/api_outGame/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({}) // Si vous avez des données à envoyer, sinon vous pouvez omettre cette ligne
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // ou .text() si vous attendez du texte
        })
        .then(data => {
            console.log('Success:', data);
            navigateTo('welcome');
        })
        .catch(error => {
            console.error('Error:', error);
        });
}


function showLoginForm() {
    navigateTo('login');
}

function showRegisterForm() {
    navigateTo('register');
}

function playPong() {
    fetch('/api/api_inGame/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({})  // Si vous avez des données à envoyer, sinon vous pouvez omettre cette ligne
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();  // ou .text() si vous attendez du texte
        })
        .then(data => {
            console.log('Success:', data);
            navigateTo('pong');
        })
        .catch(error => {
            console.error('Error:', error);
        });
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
    navigateTo('email-two-factor');
}

function showQrTwoFactorForm() {
    navigateTo('qr-two-factor');
}

function showWelcome() {
    const username = localStorage.getItem('username');
    document.getElementById('user-name-welcome').textContent = username || 'Utilisateur';

    // Fetch user avatar URL from the backend
    fetch(`/api/get_user_avatar/`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const avatarUrl = data.avatarUrl;
            document.getElementById('user-avatar').src = avatarUrl;
        })
        .catch(error => {
            console.error('Error fetching avatar:', error);
            document.getElementById('user-avatar').src = '/media/avatars/default.png';
        });

    navigateTo('welcome');
    showPendingFriendRequests();
}



function openSearchModal() {
    document.getElementById('searchUserModal').style.display = 'block';
}

function closeSearchModal() {
    document.getElementById('searchUserModal').style.display = 'none';
}

function searchUser() {
    var username = document.getElementById('search-username').value;
    fetch(`/api/search_users/?username=${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(users => {
            var resultsContainer = document.getElementById('search-results');

            // Effacer les résultats précédents
            resultsContainer.innerHTML = '';

            if (users.length === 0) {
                resultsContainer.textContent = 'Utilisateur non trouvé';
            } else {
                users.forEach(user => {
                    var userContainer = document.createElement('div');
                    userContainer.className = 'user-container';

                    // Nom de l'utilisateur
                    var userName = document.createElement('p');
                    userName.textContent = user.username;
                    userContainer.appendChild(userName);

                    // Avatar de l'utilisateur
                    if (user.avatarUrl) {
                        console.log("avatar search user: ", user.avatarUrl);
                        var userAvatar = document.createElement('img');
                        userAvatar.src = user.avatarUrl;
                        userAvatar.alt = 'Avatar de ' + user.username;
                        userAvatar.style.width = '50px'; // ajustez la taille selon vos besoins
                        userContainer.appendChild(userAvatar);
                    }

                    // Bouton Ajouter en ami
                    var addFriendButton = document.createElement('button');
                    addFriendButton.textContent = 'Ajouter en ami';
                    addFriendButton.className = 'btn btn-primary';
                    addFriendButton.onclick = function () {
                        addFriend(user.username);
                    };
                    userContainer.appendChild(addFriendButton);

                    // Ajout du conteneur de l'utilisateur dans les résultats
                    resultsContainer.appendChild(userContainer);
                });
            }
        })
        .catch(error => {
            console.error('Erreur lors de la recherche de l\'utilisateur:', error);
        });
}


function showPendingFriendRequests() {
    fetch('/api/pending_friend_requests/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(requests => {
            const requestsContainer = document.getElementById('pending-requests-container');

            // Effacer les demandes précédentes
            requestsContainer.innerHTML = '';

            requests.forEach(request => {
                const requestElement = document.createElement('div');
                requestElement.id = `friend-request-${request.id}`;
                requestElement.textContent = `Demande de ${request.sender}`;

                // Bouton pour accepter la demande d'ami
                const acceptButton = document.createElement('button');
                acceptButton.className = 'btn btn-primary';
                acceptButton.textContent = 'Accepter';
                acceptButton.onclick = function () {
                    acceptFriendRequest(request.id);
                };

                // Bouton pour refuser la demande d'ami
                const declineButton = document.createElement('button');
                declineButton.className = 'btn btn-primary';
                declineButton.textContent = 'Refuser';
                declineButton.onclick = function () {
                    declineFriendRequest(request.id);
                };

                requestElement.appendChild(acceptButton);
                requestElement.appendChild(declineButton);
                requestsContainer.appendChild(requestElement);
            });
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des demandes d\'ami:', error);
        });
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
    document.getElementById('email-two-factor-section').classList.add('hidden');
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

// --- Event Listeners ---

// Event listener for the registration form submission
document.getElementById('registerForm').addEventListener('submit', function (event) {
    event.preventDefault();

    let formData = new FormData();
    formData.append('username', document.getElementById('username').value);
    formData.append('first_name', document.getElementById('firstname').value);
    formData.append('last_name', document.getElementById('lastname').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('password', document.getElementById('password').value);

    let avatarFile = document.getElementById('avatar').files[0];
    if (avatarFile) {
        formData.append('avatar', avatarFile);
    }

    if (document.getElementById('password').value === document.getElementById('retypePassword').value) {
        fetch('/api/register/', {
            method: 'POST',
            body: formData
            // Pas d'en-tête 'Content-Type' ici car il est automatiquement défini avec FormData
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Registered successfully:', data);
                navigateTo('login');
            })
            .catch(error => {
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

    fetch('/api/api_login/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: password,
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            localStorage.setItem('username', username);

            if (data['2fa_required']) {
                if (data['2fa_method'] === 'qr') {
                    const qrCodeImgSrc = data['qr_code_img'];
                    document.getElementById('qr-code-img').src = qrCodeImgSrc;
                    showQrTwoFactorForm();
                } else {
                    showTwoFactorForm();
                }
            } else {
                console.log('Login successful:', data);
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                showWelcome();
                connectWebSocket();
            }
        })
        .catch(error => {
            console.error('Login error:', error);
        });
});


// Event listener for the edit user form submission
document.getElementById('editUserForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const selectedTwoFactorMethod = document.getElementById('twoFactorMethod').value;

    fetch('/api/user/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
            username: localStorage.getItem('username'),
            twoFactorMethod: selectedTwoFactorMethod,
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(() => {
            alert(`2FA preference updated to ${selectedTwoFactorMethod.toUpperCase()}.`);
            navigateTo('welcome');
        })
        .catch(error => {
            console.error('Error updating 2FA preference:', error);
            alert('Error updating 2FA preference. Please try again.');
        });
});


// Event listener for the two-factor authentication form submission
document.getElementById('EmailTwoFactorForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const twoFactorCode = document.getElementById('twoFactorCode').value;
    const username = localStorage.getItem('username'); // Assurez-vous que le nom d'utilisateur est stocké lors de la tentative de connexion initiale

    fetch('/api/verify_two_factor_code/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
            username: username,
            two_factor_code: twoFactorCode,
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('2FA Verification successful:', data);
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            showWelcome();
        })
        .catch(error => {
            console.error('2FA Verification error:', error);
            alert('Invalid 2FA code. Please try again.');
        });
});


// Event listener for the QR two-factor authentication form submission
document.getElementById('qrTwoFactorForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const qrTwoFactorCode = document.getElementById('qrTwoFactorCode').value;
    const username = localStorage.getItem('username'); // Assuming username is stored in localStorage

    fetch('/api/verify_two_factor_code/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
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
            console.log('QR 2FA Verification successful:', data);
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            showWelcome();
        })
        .catch(error => {
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

    fetch('/api/token/refresh/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            refresh: refreshToken
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Token refreshed successfully');
            localStorage.setItem('access_token', data.access);
        })
        .catch(error => {
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

    fetch('/api/token/verify/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            token: accessToken
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            console.log('Token is valid');
        })
        .catch(error => {
            console.error('Invalid token:', error);
        });
}


// Function for friends
function addFriend(receiverUsername) {
    fetch('/api/send_friend_request/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
            receiver_username: receiverUsername
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log(data.message);
            // Vous pouvez également mettre à jour l'interface utilisateur ici
        })
        .catch(error => {
            console.error('Erreur lors de l\'envoi de la demande d\'ami:', error);
        });
}


function acceptFriendRequest(requestId) {
    fetch(`/api/accept_friend_request/${requestId}/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({}) // Corps vide mais formaté en JSON
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log(data.message);
            const requestElement = document.getElementById(`friend-request-${requestId}`);
            if (requestElement) {
                requestElement.remove();
            }
        })
        .catch(error => {
            console.error('Erreur lors de l\'acceptation de la demande d\'ami:', error);
        });
}


function declineFriendRequest(requestId) {
    fetch(`/api/decline_friend_request/${requestId}/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({}) // Corps vide mais formaté en JSON
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log(data.message);
            // Mettre à jour l'interface utilisateur ici
            // Retirer l'élément de demande d'ami du DOM
            const requestElement = document.getElementById(`friend-request-${requestId}`);
            if (requestElement) {
                requestElement.remove();
            }
        })
        .catch(error => {
            console.error('Erreur lors du refus de la demande d\'ami:', error);
        });
}


function showFriendsModal() {
    document.getElementById('friendsModal').style.display = 'block';
    loadFriendsList(); // Fonction pour charger la liste des amis
}

function closeFriendsModal() {
    document.getElementById('friendsModal').style.display = 'none';
}

function loadFriendsList() {
    fetch('/api/get_friends/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(friends => {
            const friendsListContainer = document.getElementById('friends-list-container');
            friendsListContainer.innerHTML = ''; // Effacer la liste actuelle

            friends.forEach(friend => {
                // Création du conteneur pour chaque ami
                const friendElement = document.createElement('div');
                friendElement.className = 'friend-item';

                // Ajout du nom de l'ami
                const friendName = document.createElement('p');
                friendName.textContent = friend.username;
                friendElement.appendChild(friendName);

                // Ajout de l'avatar (si disponible)
                if (friend.avatarUrl) {
                    const friendAvatar = document.createElement('img');
                    friendAvatar.src = friend.avatarUrl;
                    friendAvatar.alt = `Avatar de ${friend.username}`;
                    friendAvatar.style.width = '50px'; // Ajustez la taille selon vos besoins
                    friendElement.appendChild(friendAvatar);
                }

                const friendStatus = document.createElement('p');
                friendStatus.textContent = friend.status;
                friendElement.appendChild(friendStatus);

                // Ajouter le conteneur de l'ami au conteneur principal
                friendsListContainer.appendChild(friendElement);
            });
        })
        .catch(error => {
            console.error('Erreur lors de la récupération de la liste des amis:', error);
        });
}





// Function to handle user logout
function logout() {
    fetch('/api/logout/', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({}) // Corps vide mais formaté en JSON
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log(data.message);

            // Supprimer les tokens et autres données de l'utilisateur du localStorage
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('username');

            // Rediriger vers la page d'accueil
            navigateTo('home');
        })
        .catch(error => {
            console.error('Erreur lors de la déconnexion:', error);
        });
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



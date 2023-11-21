
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

// function openSearchModal() {
//     document.getElementById('searchUserModal').style.display = 'block';
// }

// function closeSearchModal() {
//     document.getElementById('searchUserModal').style.display = 'none';
// }

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
            openSearchResultsModal();
        })
        .catch(error => {
            console.error('Erreur lors de la recherche de l\'utilisateur:', error);
        });
}

function openSearchResultsModal() {
    document.getElementById('searchResultsModal').style.display = 'block';
}

function closeSearchResultsModal() {
    document.getElementById('searchResultsModal').style.display = 'none';
}

function openEditUserModal() {
    document.getElementById('editUserModal').style.display = 'block';
}

function closeEditUserModal() {
    document.getElementById('editUserModal').style.display = 'none';
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
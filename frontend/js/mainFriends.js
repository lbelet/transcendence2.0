
function addFriend(receiverUsername) {
    const errorMessageElement = document.getElementById('friendRequestErrorMessage');
	errorMessageElement.style.display = 'none';
    const csrfToken = getCSRFToken();

    fetch('/api/send_friend_request/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({
            receiver_username: receiverUsername
        })
    })
    .then(response => response.json())  // Toujours parser le JSON
    .then(data => {
        if (!data.success) {
            let errorMessage = `${data.message} ${receiverUsername}`;
            displayErrorMessageFriendRequest(errorMessage);  // Utiliser le message d'erreur du serveur
        }
        // console.log(data.message);  // Afficher le message de succès
    })
    .catch(error => {
        alert(`Erreur lors du traitement de la demande: ${error.message}`);
    });
}


function acceptFriendRequest(requestId) {
    const csrfToken = getCSRFToken();

    fetch(`/api/accept_friend_request/${requestId}/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
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
            alert('Erreur lors de l\'acceptation de la demande d\'ami:');
        });
}

function declineFriendRequest(requestId) {
    const csrfToken = getCSRFToken();

    fetch(`/api/decline_friend_request/${requestId}/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
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
            alert('Erreur lors du refus de la demande d\'ami');
        });
}

function showFriendsModal() {
    document.getElementById('friendsModal').style.display = 'block';
    loadFriendsList(); // Fonction pour charger la liste des amis
}

function closeFriendsModal() {
    document.getElementById('friendsModal').style.display = 'none';
}

function closeWarningModal() {
    document.getElementById('warningModal').style.display = 'none';
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

            // Ajout du nom de l'ami avec popover
            const friendName = document.createElement('p');
            friendName.textContent = friend.username;
            friendName.setAttribute('data-bs-toggle', 'popover');
            friendName.setAttribute('title', friend.username);
            friendName.setAttribute('data-bs-html', 'true');
            let lastGamesHtml = '<ul>';
            friend.recent_games.slice(0, 5).forEach(game => { // Assurez-vous que `recent_games` est trié par date, du plus récent au plus ancien
                lastGamesHtml += `<li>${game.date}: ${game.opponent_username} - ${game.user_score}:${game.opponent_score}</li>`;
            });
            lastGamesHtml += '</ul>';
            // Mettre à jour data-bs-content avec la liste des 5 derniers jeux
            friendName.setAttribute('data-bs-content', `Nombre de jeux: ${friend.nbreGames}<br>Victoires: ${friend.victories}<br>${lastGamesHtml}`);            friendElement.appendChild(friendName);

            if (friend.avatarUrl) {
                const friendAvatar = document.createElement('img');
                friendAvatar.src = friend.avatarUrl;
                friendAvatar.alt = `Avatar de ${friend.username}`;
                friendAvatar.style.width = '50px'; // Ajustez la taille selon vos besoins
                friendElement.appendChild(friendAvatar);
            }

            const friendStatus = document.createElement('p');
            friendStatus.textContent = friend.status;
            if (friend.status === "en ligne") {
                friendStatus.style.color = "green";
            }
            friendElement.appendChild(friendStatus);

            // Ajouter le conteneur de l'ami au conteneur principal
            friendsListContainer.appendChild(friendElement);
        });

        // Initialisez les popovers après la création de tous les éléments d'amis
        initializePopovers();
    })
    .catch(error => {
        console.error('Erreur lors de la récupération de la liste des amis:', error);
        alert('Erreur lors de la récupération de la liste des amis');
    });
}
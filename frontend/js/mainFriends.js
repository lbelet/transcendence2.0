
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
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
    .then(response => response.json()) 
    .then(data => {
        if (!data.success) {
            let errorMessage = `${data.message} ${receiverUsername}`;
            displayErrorMessageFriendRequest(errorMessage);  
        }
    })
    .catch(error => {
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
        body: JSON.stringify({}) 
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
        body: JSON.stringify({})
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
        });
}

function showFriendsModal() {
    document.getElementById('friendsModal').style.display = 'block';
    loadFriendsList();
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
        friendsListContainer.innerHTML = '';

        friends.forEach(friend => {
            const friendElement = document.createElement('div');
            friendElement.className = 'friend-item';

            const friendName = document.createElement('p');
            friendName.textContent = friend.username;
            friendName.setAttribute('data-bs-toggle', 'popover');
            friendName.setAttribute('title', friend.username);
            friendName.setAttribute('data-bs-html', 'true');
            let lastGamesHtml = '<ul>';
            friend.recent_games.slice(0, 5).forEach(game => { 
                lastGamesHtml += `<li>${game.date}: ${game.opponent_username} - ${game.user_score}:${game.opponent_score}</li>`;
            });
            lastGamesHtml += '</ul>';
            friendName.setAttribute('data-bs-content', `Nombre de jeux: ${friend.nbreGames}<br>Victoires: ${friend.victories}<br>${lastGamesHtml}`);            friendElement.appendChild(friendName);

            if (friend.avatarUrl) {
                const friendAvatar = document.createElement('img');
                friendAvatar.src = friend.avatarUrl;
                friendAvatar.alt = `Avatar de ${friend.username}`;
                friendAvatar.style.width = '50px'; 
                friendElement.appendChild(friendAvatar);
            }

            const friendStatus = document.createElement('p');
            friendStatus.textContent = friend.status;
            if (friend.status === "en ligne") {
                friendStatus.style.color = "green";
            }
            friendElement.appendChild(friendStatus);

            friendsListContainer.appendChild(friendElement);
        });

        initializePopovers();
    })
    .catch(error => {
    });
}
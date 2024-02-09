
function initializePopovers() {
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popovers = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    document.addEventListener('click', function (event) {
        popovers.forEach(function (popover) {
            if (!popover._element.contains(event.target)) {
                popover.hide();
            }
        });
    });
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
        resultsContainer.innerHTML = '';
        if (users.length === 0) {
            resultsContainer.textContent = 'Aucun utilisateur trouvé';
        } else {
            users.forEach(user => {
                var userContainer = document.createElement('div');
                userContainer.className = 'user-container';
                
                var userName = document.createElement('p');
                userName.textContent = user.username; 

                userName.setAttribute('data-bs-toggle', 'popover');
                userName.setAttribute('title', user.username);
                userName.setAttribute('data-bs-html', 'true');
                userName.setAttribute('data-bs-content', `Nombre de jeux: ${user.nbreGames}<br>Victoires: ${user.victories}`);
                
                userContainer.appendChild(userName);

                if (user.avatarUrl) {
                    var userAvatar = document.createElement('img');
                    userAvatar.src = user.avatarUrl;
                    userAvatar.alt = 'Avatar de ' + user.username;
                    userAvatar.style.width = '50px';
                    userContainer.appendChild(userAvatar);
                }

                var addFriendButton = document.createElement('button');
                addFriendButton.className = 'btn btn-outline-secondary mx-2';
                
                switch(user.friendStatus) {
                    case "envoyée":
                        addFriendButton.textContent = 'Demande envoyée';
                        addFriendButton.disabled = true;
                        break;
                    case "reçue":
                        addFriendButton.textContent = 'Répondre à la demande';
                        break;
                    case "ami":
                        addFriendButton.textContent = 'Ami';
                        addFriendButton.disabled = true;
                        break;
                    default:
                        addFriendButton.textContent = 'Ajouter en ami';
                        addFriendButton.onclick = function () {
                            addFriendButton.textContent = 'Demande envoyée';
                            addFriendButton.disabled = true;
                
                            addFriend(user.username);
                        };
                }

                userContainer.appendChild(addFriendButton);
                resultsContainer.appendChild(userContainer);
            });
            
            initializePopovers(); 
        }
        openSearchResultsModal(); 
    })
    .catch(error => {
    });
}


function addFriendButtonState(button, friendStatus) {
    switch(friendStatus) {
        case "envoyée":
            button.textContent = 'Demande envoyée';
            button.disabled = true;
            break;
        case "reçue":
            button.textContent = 'Répondre à la demande';
            button.disabled = false; 
            break;
        case "ami":
            button.textContent = 'Ami';
            button.disabled = true;
            break;
        default:
            button.textContent = 'Ajouter en ami';
            button.disabled = false;
            button.onclick = function () {
                addFriend(user.username);
            };
    }
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
            requestsContainer.innerHTML = '';
            requests.forEach(request => {
                const requestElement = document.createElement('div');
                requestElement.id = `friend-request-${request.id}`;
                requestElement.textContent = `Demande de ${request.sender}`;
                const acceptButton = document.createElement('button');
                acceptButton.className = 'btn btn-outline-secondary mx-2';
                acceptButton.textContent = 'Accepter';
                acceptButton.onclick = function () {
                    acceptFriendRequest(request.id);
                };
                const declineButton = document.createElement('button');
                declineButton.className = 'btn btn-outline-secondary mx-2';
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
        });
}
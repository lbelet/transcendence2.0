// function showWelcome() {
//     const username = localStorage.getItem('username');
//     document.getElementById('user-name-welcome').textContent = username || 'Utilisateur';
//     fetch(`/api/get_user_avatar/`, {
//         method: 'GET',
//         headers: {
//             'Authorization': `Bearer ${localStorage.getItem('access_token')}`
//         }
//     })
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Network response was not ok');
//             }
//             return response.json();
//         })
//         .then(data => {
//             const avatarUrl = data.avatarUrl;
//             document.getElementById('user-avatar').src = avatarUrl;
//         })
//         .catch(error => {
//             alert('Error fetching avatar');
//             document.getElementById('user-avatar').src = '/media/avatars/default.png';
//         });

//     navigateWithTokenCheck('game');
//     showPendingFriendRequests();
// }
function initializePopovers() {
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popovers = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Fermer les popovers lors du clic en dehors
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
                resultsContainer.textContent = 'Utilisateur non trouvé';
            } else {
                users.forEach(user => {
                    var userContainer = document.createElement('div');
                    userContainer.className = 'user-container';
                    
                    var userName = document.createElement('p');
                    userName.textContent = user.username; 

                    userName.setAttribute('data-bs-toggle', 'popover');
                    userName.setAttribute('title', user.username);
                    // userName.setAttribute('data-bs-content', `Nombre de jeux: ${user.nbreGames}, Victoires: ${user.victories}`);

                    var victoriesPercentage = (user.nbreGames > 0) ? ((user.victories / user.nbreGames) * 100) : 0;                
                    var progressBarHtml = `
                        <div class="progress" role="progressbar" aria-label="Basic example" aria-valuenow="${victoriesPercentage}" aria-valuemin="0" aria-valuemax="100">
                            <div class="progress-bar w-${victoriesPercentage}"></div>
                        </div>
                    `;
                    userName.setAttribute('data-bs-html', 'true');
                    userName.setAttribute('data-bs-content', `Nombre de jeux: ${user.nbreGames}<br>${progressBarHtml}`);
                
                

                    userContainer.appendChild(userName);

                    if (user.avatarUrl) {
                        var userAvatar = document.createElement('img');
                        userAvatar.src = user.avatarUrl;
                        userAvatar.alt = 'Avatar de ' + user.username;
                        userAvatar.style.width = '50px';
                        userContainer.appendChild(userAvatar);
                    }
                    var addFriendButton = document.createElement('button');
                    addFriendButton.textContent = 'Ajouter en ami';
                    addFriendButton.className = 'btn btn-outline-secondary';
                    addFriendButton.onclick = function () {
                        addFriend(user.username);
                    };
                    userContainer.appendChild(addFriendButton);
                    resultsContainer.appendChild(userContainer);
                });
                
                initializePopovers();

                // var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
                // popoverTriggerList.forEach(function (popoverTriggerEl) {
                //     new bootstrap.Popover(popoverTriggerEl);
                // });
            }
            openSearchResultsModal();
        })
        .catch(error => {
            alert('Erreur lors de la recherche de l\'utilisateur');
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
            requestsContainer.innerHTML = '';
            requests.forEach(request => {
                const requestElement = document.createElement('div');
                requestElement.id = `friend-request-${request.id}`;
                requestElement.textContent = `Demande de ${request.sender}`;
                const acceptButton = document.createElement('button');
                acceptButton.className = 'btn btn-outline-secondary';
                acceptButton.textContent = 'Accepter';
                acceptButton.onclick = function () {
                    acceptFriendRequest(request.id);
                };
                const declineButton = document.createElement('button');
                declineButton.className = 'btn btn-outline-secondary';
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
            alert('Erreur lors de la récupération des demandes d\'ami');
        });
}
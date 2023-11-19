let websocket;


function openWebSocketConnection() {
    websocket = new WebSocket('wss://localhost/ws/notifications/');

    websocket.onopen = function (event) {
        console.log('WebSocket ouvert :', event);
    };

    websocket.onmessage = function (event) {
        console.log('Message reçu :', event.data);
        try {
            const data = JSON.parse(event.data);

            if (data.socket_id) {
                console.log('Socket ID reçu:', data.socket_id);
                updateSocketId(data.socket_id);
            }

            // Gestion des nouvelles demandes d'amis
            if (data.type === 'friend_request') {
                console.log('Nouvelle demande d\'ami reçue:', data);
                addFriendRequestToDOM(data.request_id, data.sender);
            }

        } catch (error) {
            console.error('Erreur de parsing JSON:', error);
        }
    };

    function updateSocketId(socketId) {
        fetch('/api/update_socket_id/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify({ socket_id: socketId })
        })
            .then(response => response.json())
            .then(result => {
                console.log('Mise à jour du socket_id réussie:', result);
            })
            .catch(error => {
                console.error('Erreur lors de la mise à jour du socket_id:', error);
            });
    }

    function addFriendRequestToDOM(requestId, senderUsername) {
        const requestsContainer = document.getElementById('pending-requests-container');

        const requestElement = document.createElement('div');
        requestElement.id = `friend-request-${requestId}`;
        requestElement.textContent = `Demande de ${senderUsername}`;

        const acceptButton = document.createElement('button');
        acceptButton.className = 'btn btn-primary';
        acceptButton.textContent = 'Accepter';
        acceptButton.onclick = function () {
            acceptFriendRequest(requestId);
        };

        const declineButton = document.createElement('button');
        declineButton.className = 'btn btn-primary';
        declineButton.textContent = 'Refuser';
        declineButton.onclick = function () {
            declineFriendRequest(requestId);
        };

        requestElement.appendChild(acceptButton);
        requestElement.appendChild(declineButton);

        // Ajouter l'élément de la demande au conteneur
        requestsContainer.appendChild(requestElement);
    }

    websocket.onerror = function (error) {
        console.log('Erreur WebSocket :', error);
    };
}


let gameWebsocket;

function openGameWebSocketConnection() {
    gameWebsocket = new WebSocket('wss://localhost/ws/game/');

    gameWebsocket.onopen = function (event) {
        console.log('WebSocket de jeu ouvert :', event);
    };

    gameWebsocket.onmessage = function (event) {
        console.log('Message reçu du jeu :', event.data);
        try {
            const data = JSON.parse(event.data);

            if (data.game_socket_id) {
                console.log('Game Socket ID reçu:', data.game_socket_id);
                updateGameSocketId(data.game_socket_id);

                // Vous pouvez gérer les mises à jour spécifiques au jeu ici
                // Par exemple, mise à jour de la position des raquettes, de la balle, etc.
            }

            // Gérer d'autres types de messages spécifiques au jeu
            // ...

        } catch (error) {
            console.error('Erreur de parsing JSON dans le jeu:', error);
        }
    };

    gameWebsocket.onerror = function (error) {
        console.log('Erreur WebSocket de jeu:', error);
    };

    // Vous pouvez ajouter d'autres gestionnaires d'événements si nécessaire
}

function updateGameSocketId(GamesocketId) {
    fetch('/api/update_GameSocket_id/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ Game_socket_id: GamesocketId })
    })
        .then(response => response.json())
        .then(result => {
            console.log('Mise à jour du game_socket_id réussie:', result);
        })
        .catch(error => {
            console.error('Erreur lors de la mise à jour du game_socket_id:', error);
        });
}
// Appelez cette fonction au lancement du jeu
// openGameWebSocketConnection();

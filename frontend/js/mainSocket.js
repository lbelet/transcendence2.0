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
let websocket;


function openWebSocketConnection() {
    let wsHost = window.location.hostname;
    let wsPort = window.location.port ? `:${window.location.port}` : '';
    // let wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    let websocket = new WebSocket(`wss://${wsHost}${wsPort}/ws/notifications/`);
    
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

// ----------------------------------------------------------------------------------------------------
// let gameWebsocket;

function openGameWebSocketConnection() {
    return new Promise((resolve, reject) => {
        let gameWsHost = window.location.hostname;
        let gameWsPort = window.location.port ? `:${window.location.port}` : '';
        let gameWsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        gameWebsocket = new WebSocket(`${gameWsProtocol}://${gameWsHost}${gameWsPort}/ws/game/`);

        gameWebsocket.onopen = function (event) {
            console.log('WebSocket de jeu ouvert :', event);
            resolve(); // Résoudre la promesse ici
        };

        gameWebsocket.onmessage = function (event) {
            console.log('Message reçu du jeu :', event.data);
            try {
                const data = JSON.parse(event.data);

                console.log("data gamesocket: ", data);

                if (data.game_socket_id) {
                    console.log('Game Socket ID reçu:', data.game_socket_id);
                    updateGameSocketId(data.game_socket_id);
                    localStorage.setItem('gameSocket_ID', data.game_socket_id);
                    resolve(); // Résoudre la promesse ici
                }

                // Gestion du démarrage de la partie de Pong
                if (data.type === 'game_start') {
                    console.log('La partie de Pong commence, game_id:', data.game_id);
                    startPongGame(data.game_id);
                }

                if (data.type === 'paddle_position') {
                    console.log("data paddle_position: ", data)
                    window.updateOpponentPaddlePosition(data.x);
                }

                if (data.type === 'ball_position') {
                    console.log("ball postion ok...")
                    console.log("data ball: ", data.ball)
                    const updateEvent = new CustomEvent('ballUpdate', { detail: data.ball });
                    window.dispatchEvent(updateEvent);
                }
                // if (data.type === 'paddle_position') {
                //     updateOpponentPaddlePosition(data.x);
                // }


                // Gérer d'autres types de messages spécifiques au jeu
                // ...

            } catch (error) {
                console.error('Erreur de parsing JSON dans le jeu:', error);
                reject(error); // Rejeter la promesse en cas d'erreur
            }
        };

        gameWebsocket.onerror = function (error) {
            console.log('Erreur WebSocket de jeu:', error);
            reject(error); // Rejeter la promesse en cas d'erreur
        };
    });
}


function startPongGame(gameId) {
    // Logique pour initialiser et démarrer la partie de Pong
    console.log('Démarrage de la partie de Pong avec l\'ID :', gameId);

    // Afficher la section de jeu (s'assurer que l'élément est correctement référencé)
    // document.getElementById('pong-section').classList.remove('hidden');
    document.dispatchEvent(new Event("startPongGame"));
    navigateTo('pong')

    // Initialiser les positions des raquettes, de la balle, etc.
    // Cette partie dépend de la manière dont votre jeu est structuré.
    // Vous devrez probablement synchroniser l'état du jeu avec le serveur
    // et initialiser les éléments de jeu comme les raquettes et la balle.
}

function sendGameIdToWebSocket(gameId) {
    if (gameWebsocket && gameWebsocket.readyState === WebSocket.OPEN) {
        gameWebsocket.send(JSON.stringify({ game_id: gameId }));
        console.log("connexion OK..........")
    } else {
        console.error("La connexion WebSocket n'est pas ouverte.");
    }
}


function updateGameSocketId(Gamesocket_Id) {
    fetch('/api/update_GameSocket_id/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ game_socket_id: Gamesocket_Id })
    })
        .then(response => response.json())
        .then(result => {
            console.log('Mise à jour du game_socket_id réussie:', result);
        })
        .catch(error => {
            console.error('Erreur lors de la mise à jour du game_socket_id:', error);
        });
}

// function updateOpponentPaddlePosition(xPosition) {
//     // Assurez-vous que la position X reçue est dans les limites du terrain de jeu
//     // Mettez à jour la position X du paddle de l'adversaire
//     opponentPaddle.position.x = xPosition;
// }
// Appelez cette fonction au lancement du jeu
// openGameWebSocketConnection();

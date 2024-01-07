let websocket;


function openWebSocketConnection() {
    let wsHost = window.location.hostname;
    let wsPort = window.location.port ? `:${window.location.port}` : '';
    // let wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    let websocket = new WebSocket(`wss://${wsHost}${wsPort}/ws/notifications/`);

    websocket.onopen = function (event) {
        // console.log('WebSocket ouvert :', event);
    };

    websocket.onmessage = function (event) {
        // console.log('Message reçu :', event.data);
        try {
            const data = JSON.parse(event.data);
            console.log("data websocket: ", data)

            if (data.socket_id) {
                // console.log('Socket ID reçu:', data.socket_id);
                updateSocketId(data.socket_id);
            }

            if (data.type === 'tournament_update') {
                // Récupérer les détails à jour du tournoi
                fetchTournamentDetails(data.message.tournament_id)
            }

            // Gestion des nouvelles demandes d'amis
            if (data.type === 'friend_request') {
                // console.log('Nouvelle demande d\'ami reçue:', data);
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
                // console.log('Mise à jour du socket_id réussie:', result);
            })
            .catch(error => {
                alert('Erreur lors de la mise à jour du socket_id');
            });
    }

    function addFriendRequestToDOM(requestId, senderUsername) {
        const requestsContainer = document.getElementById('pending-requests-container');

        const requestElement = document.createElement('div');
        requestElement.id = `friend-request-${requestId}`;
        requestElement.textContent = `Demande de ${senderUsername}`;

        const acceptButton = document.createElement('button');
        acceptButton.className = 'btn btn-outline-secondary';
        acceptButton.textContent = 'Accepter';
        acceptButton.onclick = function () {
            acceptFriendRequest(requestId);
        };

        const declineButton = document.createElement('button');
        declineButton.className = 'btn btn-outline-secondary';
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

function openGameWebSocketConnection() {
    return new Promise((resolve, reject) => {
        let gameWsHost = window.location.hostname;
        let gameWsPort = window.location.port ? `:${window.location.port}` : '';
        let gameWsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        gameWebsocket = new WebSocket(`${gameWsProtocol}://${gameWsHost}${gameWsPort}/ws/game/`);

        gameWebsocket.onopen = function (event) {
            // console.log('WebSocket de jeu ouvert :', event);
            // resolve();
        };

        gameWebsocket.onmessage = function (event) {
            // console.log('Message reçu du jeu :', event.data);
            try {
                const data = JSON.parse(event.data);
                // console.log("data gamesocket: ", data);
                console.log("data type: ", data.type);

                if (data.game_socket_id) {
                    // console.log('Game Socket ID reçu:', data.game_socket_id);
                    resolve(data.game_socket_id);  // Résoudre avec game_socket_id
                }
                if (data.status === 'added_to_game') {
                    console.log('!!!!!!!dans le channel gameSocket');
                }

                if (data.type === 'game_start') {
                    console.log('!!!!La partie de Pong commence grace au sockets');
                    startPongGame(data.game_id);
                }

                else if (data.type === 'paddles_update') {
                    console.log("paddles_update ok")
                    applyGameState(data.paddles_state);
                }
                else if (data.type === 'ball_update') {
                    console.log("ball_update ok")
                    applyBallState(data.ball_state);
                }
                else if (data.type === 'score_update') {
                    console.log("data update score: ", data)
                    console.log("score1: ", data.score_state.player1, "score2: ", data.score_state.player2)
                    window.updateScores(data.score_state.player1, data.score_state.player2);
                }
                else if (data.type === 'game_over') {
                    // Fermer la connexion WebSocket
                    gameWebsocket.close();
                }

            } catch (error) {
                console.error('Erreur de parsing JSON dans le jeu:', error);
                reject(error);
            }
        };

        gameWebsocket.onerror = function (error) {
            console.log('Erreur WebSocket de jeu:', error);
            reject(error);
        };
    });
}

function applyGameState(newGameState) {
    if (window.updateGameFromState) {
        window.updateGameFromState(newGameState);
    }
}

function applyBallState(newBallState) {
    if (window.updateBallFromState) {
        window.updateBallFromState(newBallState);
    }
}

function startPongGame(gameId) {
    // Logique pour initialiser et démarrer la partie de Pong
    console.log('!!!!Démarrage de la partie de Pong STARTPONGGAME');
    navigateWithTokenCheck('pong');


    window.setPlayerRole();
}

function sendGameIdToWebSocket(gameId) {
    if (gameWebsocket && gameWebsocket.readyState === WebSocket.OPEN) {
        gameWebsocket.send(JSON.stringify({ game_id: gameId }));
        console.log("connexion OK..........")
    } else {
        console.error("La connexion WebSocket n'est pas ouverte.");
    }
}


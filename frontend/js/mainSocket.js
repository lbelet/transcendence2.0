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

            if (data.type === 'tournament_full') {
                console.log("tournament full: ", data.message);

                openGameWebSocketConnection()
                    .then(gameSocketId => {
                        console.log("Connexion WebSocket de jeu établie, ID:", gameSocketId);
                        updateGameSocketId(gameSocketId);
                    })
                    .catch(error => {
                        console.error("Erreur lors de l'établissement de la connexion WebSocket de jeu:", error);
                    }); 

                // Afficher un toast Bootstrap pour la notification
                const toastElement = document.createElement('div');
                toastElement.classList.add('toast');
                toastElement.setAttribute('role', 'alert');
                toastElement.setAttribute('aria-live', 'assertive');
                toastElement.setAttribute('aria-atomic', 'true');
                toastElement.innerHTML = `
                    <div class="toast-header">
                        <strong class="mr-auto">Tournoi Complet</strong>
                    </div>
                    <div class="toast-body">
                        ${data.message}
                        <div id="countdown">59</div>
                        <button id="readyButton" class="btn btn-success">Ready</button>
                        <button id="noButton" class="btn btn-danger">No</button>
                    </div>
                `;

                document.body.appendChild(toastElement);

                const toast = new bootstrap.Toast(toastElement, {
                    autohide: false // Empêche le toast de se cacher automatiquement
                });                
                toast.show();

                const countdownDisplay = document.getElementById('countdown');
                let countdownInterval = startCountdown(60, countdownDisplay, function () {
                    // Logique lorsque le compte à rebours est terminé
                    console.log("Le compte à rebours est terminé. Le tournoi est annulé.");
                    // Envoyer une requête au serveur pour annuler le tournoi
                    // ...
                    toast.dispose();
                });

                document.getElementById('readyButton').addEventListener('click', function() {
                    clearInterval(countdownInterval);
                    console.log("Le joueur est prêt.");
                    
                    const tournamentId = data.tournament_id; // Obtenir l'ID du tournoi
                
                    // Envoyer une requête au serveur pour confirmer la présence du joueur
                    fetch(`/api/set_player_ready/${tournamentId}/`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Réponse du serveur:', data);
                        if (data.error) {
                            alert(data.error);
                        } else {
                            console.log("Présence du joueur confirmée");
                            // Ouvrir la connexion WebSocket pour le jeu
                            // openGameWebSocketConnection()
                            //     .then(gameSocketId => {
                            //         console.log("Connexion WebSocket de jeu établie, ID:", gameSocketId);
                            //         updateGameSocketId(gameSocketId);
                            //     })
                            //     .catch(error => {
                            //         console.error("Erreur lors de l'établissement de la connexion WebSocket de jeu:", error);
                            //     }); 
                        }
                    })
                    .catch(error => {
                        console.error('Erreur lors de la confirmation de la présence du joueur:', error);
                    });
                
                    toast.dispose();
                });
                
                

                document.getElementById('noButton').addEventListener('click', function () {
                    clearInterval(countdownInterval);
                    console.log("Le joueur a refusé.");
                    // Envoyer une requête au serveur pour annuler le tournoi
                    // ...
                    toast.dispose();
                });
            }

        } catch (error) {
            console.error('Erreur de parsing JSON:', error);
        }
    };

    function startCountdown(duration, display, onCountdownFinished) {
        let timer = duration, minutes, seconds;
        const countdownInterval = setInterval(function () {
            seconds = parseInt(timer % 59, 10);
            seconds = seconds < 10 ? "0" + seconds : seconds;
            display.textContent = seconds;

            if (--timer < 0) {
                clearInterval(countdownInterval);
                onCountdownFinished();
            }
        }, 1000);
        return countdownInterval;
    }



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
                // console.log("data type: ", data.type);

                if (data.game_socket_id) {
                    // console.log('Game Socket ID reçu:', data.game_socket_id);
                    resolve(data.game_socket_id);  // Résoudre avec game_socket_id
                }
                if (data.status === 'added_to_game') {
                    console.log('!!!!!!!dans le channel gameSocket');
                }

                if (data.type === 'player_roles') {
                    var playerRole = (data.player_one_username === localStorage.getItem("username")) ? 1 : 2;
                    localStorage.setItem('playerRole', playerRole);
                    console.log("Mon rôle dans le match:", playerRole);
                }

                if (data.type === 'game_start') {
                    console.log('!!!!La partie de Pong commence grace au sockets');
                    startPongGame(data.game_id);
                }

                if (data.type === 'game_start_tournament') {
                    console.log('!!!!Le tournoi de Pong commence grace au sockets');
                    startPongTournament(data.game_id);
                }

                else if (data.type === 'paddles_update') {
                    console.log("paddles_update ok")
                    applyGameState(data.paddles_state);
                }

                else if (data.type === 'paddles_update_tournament') {
                    console.log("paddles_update_tournament ok")
                    applyGameState_tournament(data.paddles_state);
                }

                else if (data.type === 'ball_update') {
                    console.log("ball_update ok: ", data.ball_state)
                    applyBallState(data.ball_state);
                }

                else if (data.type === 'ball_update_tournament') {
                    console.log("ball_update_tournament ok: ", data.ball_state)
                    applyBallState_tournament(data.ball_state);
                }

                else if (data.type === 'score_update') {
                    console.log("data update score: ", data)
                    console.log("score1: ", data.score_state.player1, "score2: ", data.score_state.player2)
                    window.updateScores(data.score_state.player1, data.score_state.player2);
                }

                else if (data.type === 'score_update_tournament') {
                    console.log("data update score: ", data)
                    console.log("score1: ", data.score_state.player1, "score2: ", data.score_state.player2)
                    window.updateScores_tournament(data.score_state.player1, data.score_state.player2, data.player1_state, data.player2_state);
                }

                else if (data.type === 'game_over') {
                    // Fermer la connexion WebSocket
                    gameWebsocket.close();
                }

                else if (data.type === 'game_over_tournament') {
                    // Fermer la connexion WebSocket
                    // gameWebsocket.close();
                    navigateWithTokenCheck('waitingRoom')
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

function applyGameState_tournament(newGameState) {
    if (window.updateGameFromState) {
        window.updateGameFromState_tournament(newGameState);
    }
}

function applyBallState_tournament(newBallState) {
    if (window.updateBallFromState_tournament) {
        window.updateBallFromState_tournament(newBallState);
    }
}

function startPongGame(gameId) {
    fetch('/api/update_nbre_games/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                console.error(data.error);
                alert('Erreur lors du traitement de la demande');
            } else {
                console.log(data.message, 'Nombre de jeux:', data.nbre_games);
            }
        })
        .catch(error => {
            console.error('Erreur lors du traitement de la demande:', error);
            alert('Erreur lors du traitement de la demande');
        });

    // Logique pour initialiser et démarrer la partie de Pong
    console.log('!!!!Démarrage de la partie de Pong STARTPONGGAME');
    navigateWithTokenCheck('pong');

    window.setPlayerRole();
}

function startPongTournament(gameId) {
    fetch('/api/update_nbre_games/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                console.error(data.error);
                alert('Erreur lors du traitement de la demande');
            } else {
                console.log(data.message, 'Nombre de jeux:', data.nbre_games);
            }
        })
        .catch(error => {
            console.error('Erreur lors du traitement de la demande:', error);
            alert('Erreur lors du traitement de la demande');
        });

    // Logique pour initialiser et démarrer la partie de Pong
    console.log('!!!!Démarrage du tournoi pongTournament');
    navigateWithTokenCheck('pongTournament');
    localStorage.setItem('currentGameId', gameId)
    window.setPlayerRole_tournament();
}


function sendGameIdToWebSocket(gameId) {
    if (gameWebsocket && gameWebsocket.readyState === WebSocket.OPEN) {
        gameWebsocket.send(JSON.stringify({ game_id: gameId }));
        console.log("connexion OK..........")
    } else {
        console.error("La connexion WebSocket n'est pas ouverte.");
    }
}


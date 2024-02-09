let websocket;


function openWebSocketConnection() {
    let wsHost = window.location.hostname;
    let wsPort = window.location.port ? `:${window.location.port}` : '';
    let websocket = new WebSocket(`wss://${wsHost}${wsPort}/ws/notifications/`);

    websocket.onopen = function (event) {
    };

    websocket.onmessage = function (event) {
        try {
            const data = JSON.parse(event.data);

            if (data.socket_id) {
                updateSocketId(data.socket_id);
            }

            if (data.type === 'friend_request') {
                addFriendRequestToDOM(data.request_id, data.sender);
            }
        } catch (error) {
            console.error('Erreur de parsing JSON:', error);
        }
    };

    function updateSocketId(socketId) {
        const csrfToken = getCSRFToken();

        fetch('/api/update_socket_id/', {            
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({ socket_id: socketId })
        })
            .then(response => response.json())
            .then(result => {
            })
            .catch(error => {
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

        requestsContainer.appendChild(requestElement);
    }

    websocket.onerror = function (error) {
    };
}

function getGamePlayers(gameId) {
    return new Promise((resolve, reject) => {
        fetch(`/api/get_game_players/${gameId}/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
        })
        .then(response => response.json())
        .then(data => {
            localStorage.setItem('player_one', data.player_one);
            localStorage.setItem('player_two', data.player_two);
            resolve(data); 
        })
        .catch(error => {
            console.error('Erreur: ', error);
            reject(error); 
        });
    });
}

function getGamePlayers_tournament(gameId) {
    return new Promise((resolve, reject) => {
        fetch(`/api/get_game_players_tournament/${gameId}/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
        })
        .then(response => response.json())
        .then(data => {
            localStorage.setItem('player_one', data.player_one);
            localStorage.setItem('player_two', data.player_two);
            resolve();
        })
        .catch(error => {
            console.error('Erreur: ', error);
            reject(); 
        });
    });
}


// ----------------------------------------------------------------------------------------------------
let toastElement = null
let toast = null

function openGameWebSocketConnection() {
    return new Promise((resolve, reject) => {
        let gameWsHost = window.location.hostname;
        let gameWsPort = window.location.port ? `:${window.location.port}` : '';
        let gameWsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        gameWebsocket = new WebSocket(`${gameWsProtocol}://${gameWsHost}${gameWsPort}/ws/game/`);

        gameWebsocket.onopen = function (event) {
        };

        gameWebsocket.onmessage = function (event) {
            try {
                const data = JSON.parse(event.data);


                if (data.game_socket_id) {
                    resolve(data.game_socket_id); 
                }

                if (data.type === 'tournament_full') {

                    toastElement = document.createElement('div');
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
                            <div id="countdown">15</div>
                            <button id="readyButton" class="btn btn-success">Ready</button>
                            <button id="noButton" class="btn btn-danger">No</button>
                        </div>
                    `;

                    document.body.appendChild(toastElement);

                    toast = new bootstrap.Toast(toastElement, {
                        autohide: false 
                    });
                    toast.show();

                    const countdownDisplay = document.getElementById('countdown');
                    let countdownInterval = startCountdown(15, countdownDisplay, function () {

                        const tournamentId = data.tournament_id; 
                        const csrfToken = getCSRFToken();
                        fetch(`/api/delete_tournament/${tournamentId}/`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                                'Content-Type': 'application/json',
                                'X-CSRFToken': csrfToken
                            }
                        })
                        .then(response => response.json())
                        .catch(error => {
                            console.error('Erreur lors de la suppression du tournoi:', error);
                        });
                    });

                    document.getElementById('readyButton').addEventListener('click', function() {
                        clearInterval(countdownInterval);

                        const tournamentId = data.tournament_id; 
                        const csrfToken = getCSRFToken();

                        fetch(`/api/set_player_ready/${tournamentId}/`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                                'Content-Type': 'application/json',
                                'X-CSRFToken': csrfToken
                            }
                        })
                        .then(response => response.json())
                        .catch(error => {
                            console.error('Erreur lors de la confirmation de la présence du joueur:', error);
                        });

                        toast.dispose();
                        toast = null;
                    });

                    document.getElementById('noButton').addEventListener('click', function () {
                        clearInterval(countdownInterval);

                        const tournamentId = data.tournament_id;
                        const csrfToken = getCSRFToken();
                        fetch(`/api/delete_tournament/${tournamentId}/`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                                'Content-Type': 'application/json',
                                'X-CSRFToken': csrfToken
                            }
                        })
                        .then(response => response.json())
                        .catch(error => {
                            console.error('Erreur lors de la suppression du tournoi:', error);
                        });

                        toast.dispose();
                        toast = null;
                        navigateWithTokenCheck('game')
                    });
                }

                if (data.type === 'tournament_deleted') {
					gameWebsocket.close()

                    if (toast != null) {
                        toast.hide(); 
                    }
                    navigateWithTokenCheck('game')

                }

                if (data.type === 'tournament_update') {
                    fetchTournamentDetailsWaitingPage(data.tournamentId);
                }

                if (data.type === 'player_roles') {
                    var playerRole = (data.player_one_username === localStorage.getItem("username")) ? 1 : 2;
                    localStorage.setItem('playerRole', playerRole);
                }

                if (data.type === 'game_start') {
                    getGamePlayers(data.game_id).then(data => {
                        const player1Name = data.player_one;
                        const player2Name = data.player_two;


                        startPongGame(data.game_id, player1Name, player2Name);
                        playPong();
                    });
                }

                if (data.type === 'game_start_tournament') {
                    getGamePlayers_tournament(data.game_id).then(() => {
                        const player1Name = localStorage.getItem('player_one');
                        const player2Name = localStorage.getItem('player_two');

                        startPongTournament(data.game_id, player1Name, player2Name);
                        playPong_tournament();
                    });
                }


                else if (data.type === 'paddles_update') {
                    applyGameState(data.paddles_state);
                }

                else if (data.type === 'paddles_update_tournament') {
                    applyGameState_tournament(data.paddles_state);
                }

                else if (data.type === 'ball_update') {
                    applyBallState(data.ball_state);
                }

                else if (data.type === 'ball_update_tournament') {
                    applyBallState_tournament(data.ball_state);
                }

                else if (data.type === 'score_update') {
                    const player1Name = localStorage.getItem('player_one')
                    const player2Name = localStorage.getItem('player_two')
                    window.updateScores(data.score_state.player1, data.score_state.player2, player1Name, player2Name);
                }

                else if (data.type === 'score_update_tournament') {
                    const player1Name = localStorage.getItem('player_one')
                    const player2Name = localStorage.getItem('player_two')
                    window.updateScores_tournament(data.score_state.player1, data.score_state.player2, player1Name, player2Name);
                }

                else if (data.type === 'game_over') {
                    setTimeout(() => {
                        gameWebsocket.close();
                    	localStorage.setItem('in1v1', "no");
                        localStorage.removeItem('player_one')
                        localStorage.removeItem('player_two')
                        localStorage.removeItem('playerRole')
                        navigateWithTokenCheck('gameResults')
                    }, 2000);

                }

                else if (data.type === 'game_over_tournament') {
                    localStorage.removeItem('player_one')
                    localStorage.removeItem('player_two')
                    localStorage.removeItem('playerRole')
                    const currentUserId = localStorage.getItem('userID');
                    if (data.winner_id && data.winner_id == currentUserId && data.round == 'Semifinal') {
                        navigateWithTokenCheck('waitingRoom');
                    } else {
						gameWebsocket.close();
                        navigateWithTokenCheck('game');
                    }
                }

                else if (data.type === 'game_start_tournament_final') {
                    getGamePlayers_tournament(data.game_id).then(() => {
                        const player1Name = localStorage.getItem('player_one');
                        const player2Name = localStorage.getItem('player_two');

                        startPongTournament(data.game_id, player1Name, player2Name);
                        playPong_tournament();
                    });
                }

            } catch (error) {
                console.error('Erreur de parsing JSON dans le jeu:', error);
                reject(error);
            }
        };

        gameWebsocket.onerror = function (error) {
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

function startPongGame(gameId, player1Name, player2Name) {
    const csrfToken = getCSRFToken();

    fetch('/api/update_nbre_games/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'X-CSRFToken': csrfToken
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
            } else {
            }
        })
        .catch(error => {
        });

    navigateWithTokenCheck('pong');

    window.setPlayerRole(player1Name, player2Name);
}

function startPongTournament(gameId, player1Name, player2Name) {
    const csrfToken = getCSRFToken();

    fetch('/api/update_nbre_games/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'X-CSRFToken': csrfToken
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
            } else {
            }
        })
        .catch(error => {
            console.error('Erreur lors du traitement de la demande:', error);
        });

    navigateWithTokenCheck('pongTournament');
    localStorage.setItem('currentGameId', gameId)
    window.setPlayerRole_tournament(player1Name, player2Name);
}


function sendGameIdToWebSocket(gameId) {
    if (gameWebsocket && gameWebsocket.readyState === WebSocket.OPEN) {
        gameWebsocket.send(JSON.stringify({ game_id: gameId }));
    } else {
        console.error("La connexion WebSocket n'est pas ouverte.");
    }
}

function sendGameIdToWebSocket_tournament(tournamentId) {
    if (gameWebsocket && gameWebsocket.readyState === WebSocket.OPEN) {
        gameWebsocket.send(JSON.stringify({ tournament_id: tournamentId }));
    } else {
        console.error("La connexion WebSocket n'est pas ouverte.");
    }
}

function startCountdown(duration, display, onCountdownFinished) {
    let timer = duration, seconds;
    const countdownInterval = setInterval(function () {
        seconds = parseInt(timer % 60, 10); 
        seconds = seconds < 10 ? "0" + seconds : seconds;
        display.textContent = seconds;

        if (--timer < 0) {
            clearInterval(countdownInterval);
            onCountdownFinished();
        }
    }, 1000);
    return countdownInterval;
}


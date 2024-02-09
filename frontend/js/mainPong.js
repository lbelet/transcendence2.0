function loadUserGamesHistory() {
    fetch('/api/user_games_history/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
    })
        .then(response => response.json())
        .then(data => {
            const accordionElement = document.getElementById('accordion-section');
            accordionElement.innerHTML = '';
            data.forEach((user, index) => {
                const userItem = `
                    <div class="accordion-item">
                        <h2 class="accordion-header" id="heading${index}">
                            <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${index}" aria-expanded="true" aria-controls="collapse${index}">
                                ${user.username}
                            </button>
                        </h2>
                        <div id="collapse${index}" class="accordion-collapse collapse ${index === 0 ? "show" : ""}" aria-labelledby="heading${index}" data-bs-parent="#accordionExample">
                            <div class="accordion-body">
                                ${user.games.map(game => `<p>${user.username} vs ${game.opponent}, winner: ${game.result === 'win' ? user.username : game.opponent}, Date: ${game.date}</p>`).join('')
                            }
                            </div>
                        </div>
                    </div>`;
                accordionElement.innerHTML += userItem;
            });
        });
        navigateWithTokenCheck('accordion');
}


function playPong() {
    const csrfToken = getCSRFToken();
    fetch('/api/api_inGame/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
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
            console.log('Success:', data);
        })
        .catch(error => {
        });
}

function playPong_tournament() {
    const csrfToken = getCSRFToken();
    fetch('/api/api_inGame/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
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
            console.log('Success:', data);
        })
        .catch(error => {
        });
}

function quitPong3D() {
    const gameId = localStorage.getItem('currentGameId');
    const csrfToken = getCSRFToken();

    fetch('/api/api_outGame/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ game_id: gameId })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            localStorage.removeItem('currentGameId');
            localStorage.removeItem('playerRole');
            localStorage.removeItem('')
            navigateWithTokenCheck('game');
        })
        .catch(error => {
        });
}

function quitPong3D_tournament() {
    const gameId = localStorage.getItem('currentGameId');
    const csrfToken = getCSRFToken();

    fetch('/api/api_outGame_tournament/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ game_id: gameId })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            localStorage.removeItem('currentGameId');
            localStorage.removeItem('playerRole');
            localStorage.removeItem('')
            navigateWithTokenCheck('game');
        })
        .catch(error => {
        });
}

async function joinGameQueue() {
    try {
        const gameSocketId = await openGameWebSocketConnection();

        localStorage.setItem('gameSocket_ID', gameSocketId)

        await updateGameSocketId(gameSocketId);
        const csrfToken = getCSRFToken();

        const response = await fetch('/api/join_game_queue/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({ game_socket_id: gameSocketId })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Erreur pour rejoindre la file');
        }
        if (data.error)
            displayErrorMessageJoinGame(data.error)
        if (data.game_id) {
            localStorage.setItem('in1v1', "yes")
            localStorage.setItem('currentGameId', data.game_id);
            sendGameIdToWebSocket(data.game_id);
            localStorage.setItem('playerRole', data.player_role);
            if (data.message.includes('Partie en cours')) {
                console.log("!!!!!partie en cours ok")
            }
            if (data.message.includes('waitingRoomAccess')) {
                localStorage.setItem('inGame', true)
                navigateWithTokenCheck('waitingRoom')
            }
        }
    } catch (error) {
        console.error('Erreur lors de la tentative de rejoindre la file d attente:', error);
    }
}


async function updateGameSocketId(Gamesocket_Id) {
    const csrfToken = getCSRFToken();
    
    fetch('/api/update_GameSocket_id/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ game_socket_id: Gamesocket_Id })
    })
        .then(response => response.json())
        .then(result => {
        })
        .catch(error => {
        });
}

async function loadGameResults(gameId) {
    fetch(`/api/game_info/${gameId}/`, {
        method: 'GET',
        headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
    })
        .then(response => response.json())
        .then(results => {
            console.log(results)
            document.getElementById('results-players').textContent = `${results.players[0]} : ${results.players[1]}`
			document.getElementById('results-winner').textContent = results.winner
            document.getElementById('results-scores').textContent = `${results.score[0]} : ${results.score[1]}`
        })
        .catch(error => {
            
        })
}


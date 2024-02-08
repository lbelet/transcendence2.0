function loadUserGamesHistory() {
    fetch('/api/user_games_history/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
    }) // Assurez-vous que l'URL est correcte.
        .then(response => response.json())
        .then(data => {
            const accordionElement = document.getElementById('accordion-section');
            accordionElement.innerHTML = ''; // Nettoyer l'élément avant d'ajouter de nouveaux éléments d'accordéon.
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
    fetch('/api/api_inGame/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({})  // Si vous avez des données à envoyer, sinon vous pouvez omettre cette ligne
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();  // ou .text() si vous attendez du texte
        })
        .then(data => {
            console.log('Success:', data);
            // openGameWebSocketConnection();

            // navigateWithTokenCheck('pong');
            // openGameWebSocketConnection()

        })
        .catch(error => {
            alert('Error');
        });
}

function playPong_tournament() {
    fetch('/api/api_inGame/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({})  // Si vous avez des données à envoyer, sinon vous pouvez omettre cette ligne
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();  // ou .text() si vous attendez du texte
        })
        .then(data => {
            console.log('Success:', data);
            // openGameWebSocketConnection();

            // navigateWithTokenCheck('pong');
            // // openGameWebSocketConnection()

        })
        .catch(error => {
            alert('Error');
        });
}

function quitPong3D() {
    const gameId = localStorage.getItem('currentGameId');  // Récupérer l'ID de la partie

    fetch('/api/api_outGame/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ game_id: gameId })  // Envoyer l'ID de la partie dans le corps de la requête
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // ou .text() si vous attendez du texte
        })
        .then(data => {
            // console.log('Success:', data);
            localStorage.removeItem('currentGameId');
            localStorage.removeItem('playerRole');
            localStorage.removeItem('')
            navigateWithTokenCheck('game');
        })
        .catch(error => {
            alert('Error');
        });
}

function quitPong3D_tournament() {
    const gameId = localStorage.getItem('currentGameId');  // Récupérer l'ID de la partie

    fetch('/api/api_outGame_tournament/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ game_id: gameId })  // Envoyer l'ID de la partie dans le corps de la requête
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // ou .text() si vous attendez du texte
        })
        .then(data => {
            // console.log('Success:', data);
            localStorage.removeItem('currentGameId');
            localStorage.removeItem('playerRole');
            localStorage.removeItem('')
            navigateWithTokenCheck('game');
        })
        .catch(error => {
            alert('Error');
        });
}

// document.getElementById('joinGameButton').addEventListener('click', joinGameQueue);
// function updatePlayerRole(newRole) {
//     localStorage.setItem('playerRole', newRole);
//     document.dispatchEvent(new CustomEvent('playerRoleChanged', { detail: newRole }));
// }


async function joinGameQueue() {
    try {
        // Attendre l'ouverture de la connexion WebSocket et la réception du game_socket_id
        const gameSocketId = await openGameWebSocketConnection();
        // console.log("gameSocketID: ", gameSocketId);

        localStorage.setItem('gameSocket_ID', gameSocketId)
        // const gameSocketId = localStorage.getItem('gameSocket_ID');
        // console.log("gameSocketID: ", localStorage.getItem('gameSocket_ID'));
        await updateGameSocketId(gameSocketId);

        // Envoyer la requête POST pourz rejoindre la file d'attente
        const response = await fetch('/api/join_game_queue/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify({ game_socket_id: gameSocketId })
        });

        const data = await response.json();
        // console.log('Réponse du serveur:', data);
        if (!response.ok) {
            throw new Error(data.error || 'Erreur pour rejoindre la file');
        }
        if (data.error)
            displayErrorMessageJoinGame(data.error)
        if (data.game_id) {
            localStorage.setItem('in1v1', "yes")
            localStorage.setItem('currentGameId', data.game_id);
            sendGameIdToWebSocket(data.game_id);
            localStorage.setItem('playerRole', data.player_role);  // Stocker le rôle du joueur
            // updatePlayerRole(data.player_role);  // Mettre à jour le rôle du joueur
            if (data.message.includes('Partie en cours')) {
                console.log("!!!!!partie en cours ok")
                // startPongGame(data.game_id);
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
            // console.log('Mise à jour du game_socket_id réussie:', result);
        })
        .catch(error => {
            alert('Erreur lors de la mise à jour du game_socket_id');
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
            document.getElementById('results-scores').textContent = `${results.score[0]} : ${results.score[1]}`
        })
        .catch(error => (
            alert('Erreur lors du chargement des resultats')
        ))
}



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
            // console.log('Success:', data);
            openGameWebSocketConnection();

            navigateTo('pong');
            // openGameWebSocketConnection()

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
            navigateTo('welcome');
        })
        .catch(error => {
            alert('Error');
        });
}

function showGameForm() {
    const username = localStorage.getItem('username');
    // console.log("1 username: ", username)
    document.getElementById('user-name-game').textContent = username || 'Utilisateur';
    // openGameWebSocketConnection();
    navigateTo('game');
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

        if (data.game_id) {
            localStorage.setItem('currentGameId', data.game_id);
            sendGameIdToWebSocket(data.game_id);
            localStorage.setItem('playerRole', data.player_role);  // Stocker le rôle du joueur
            // updatePlayerRole(data.player_role);  // Mettre à jour le rôle du joueur
            if (data.message.includes('Partie en cours')) {
                console.log("!!!!!partie en cours ok")
                // startPongGame(data.game_id);
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



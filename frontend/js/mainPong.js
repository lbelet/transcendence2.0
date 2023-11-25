
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
            openGameWebSocketConnection();

            navigateTo('pong');
            // openGameWebSocketConnection()

        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function quitPong3D() {
    fetch('/api/api_outGame/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({}) // Si vous avez des données à envoyer, sinon vous pouvez omettre cette ligne
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // ou .text() si vous attendez du texte
        })
        .then(data => {
            console.log('Success:', data);
            navigateTo('welcome');
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function showGameForm() {
    const username = localStorage.getItem('username');
    console.log("1 username: ", username)
    document.getElementById('user-name-game').textContent = username || 'Utilisateur';
    // openGameWebSocketConnection();
    navigateTo('game');
}

// document.getElementById('joinGameButton').addEventListener('click', joinGameQueue);

async function joinGameQueue() {
    try {
        // Attendre l'ouverture de la connexion WebSocket et la réception du game_socket_id
        await openGameWebSocketConnection();

        const gameSocketId = localStorage.getItem('gameSocket_ID');
        console.log("gameSocketID: ", gameSocketId);

        // Envoyer la requête POST pour rejoindre la file d'attente
        const response = await fetch('/api/join_game_queue/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify({ game_socket_id: gameSocketId })
        });

        const data = await response.json();
        console.log('Réponse du serveur:', data);

        if (data.game_id) {
            localStorage.setItem('currentGameId', data.game_id);
            sendGameIdToWebSocket(data.game_id);
            if (data.message.includes('Partie en cours')) {
                console.log("partie en cours ok")
                startPongGame(data.game_id);
            }
        }
    } catch (error) {
        console.error('Erreur lors de la tentative de rejoindre la file d attente:', error);
    }
}





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
    openGameWebSocketConnection();
    navigateTo('game');
}

// document.getElementById('joinGameButton').addEventListener('click', joinGameQueue);

function joinGameQueue() {
    const gameSocketId = localStorage.getItem('gameSocket_ID'); // Assurez-vous que cette valeur est correctement définie

    fetch('/api/join_game_queue/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ game_socket_id: gameSocketId }) // Envoyez le game_socket_id
    })
    .then(response => response.json())
    .then(data => {
        console.log('Réponse du serveur:', data);
        // Traitez la réponse ici
    })
    .catch(error => {
        console.error('Erreur:', error);
    });
}


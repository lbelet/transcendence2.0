
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
    navigateTo('game');
}
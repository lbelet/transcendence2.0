function openTournamentModal() {
    document.getElementById('createTournamentModal').style.display = 'block';
}

function closeCreateTournamentModal() {
    document.getElementById('createTournamentModal').style.display = 'none';
}

// Ajouter un écouteur d'événement pour le changement des options de la date de début
document.getElementById('startAtSpecificTime').addEventListener('change', function () {
    document.getElementById('specificDateTime').disabled = !this.checked;
});

// Gérer la soumission du formulaire
document.getElementById('createTournamentForm').addEventListener('submit', function(event) {
    event.preventDefault();

    // Récupérer les valeurs du formulaire
    const tournamentName = document.getElementById('tournamentName').value;
    const numberOfPlayers = document.querySelector('input[name="numberOfPlayers"]:checked').value;
    const startDateOption = document.querySelector('input[name="startDateOption"]:checked').value;
    let specificStartDate = null;

    if (startDateOption === 'specificTime') {
        specificStartDate = document.getElementById('specificDateTime').value;
    }

    // Préparer les données à envoyer
    const data = {
        name: tournamentName,
        number_of_players: numberOfPlayers,
        start_date_option: startDateOption,
        specific_start_date: specificStartDate
    };

    // Obtenir le token d'authentification stocké

    // Faire la requête POST
    fetch('/api/create_tournament/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`  // Utiliser le token dans les en-têtes
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        // Vous pouvez gérer la réponse ici
    })
    .catch((error) => {
        console.error('Error:', error);
        // Gérer les erreurs ici
    });
});



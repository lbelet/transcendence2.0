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
        if (data.success) {
            // Appeler la fonction pour inscrire l'utilisateur au tournoi
            registerUserToTournament(data.tournament_id);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        // Gérer les erreurs ici
    });
});

function registerUserToTournament(tournamentId) {
    fetch(`/api/register_to_tournament/${tournamentId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Inscription Success:', data);
        // Gérer l'inscription réussie
    })
    .catch((error) => {
        console.error('Inscription Error:', error);
    });
}

function loadAvailableTournaments() {
    fetch('/api/available_tournaments/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
    })
    .then(response => response.json())
    .then(tournaments => {
        console.log("tournois dispo? :", tournaments)
        displayTournaments(tournaments);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function displayTournaments(tournaments) {
    const container = document.getElementById('available-tournaments');
    container.innerHTML = ''; // Effacer les tournois précédents

    tournaments.forEach(tournament => {
        const tournamentButton = document.createElement('button');
        tournamentButton.className = 'btn btn-primary tournament-btn';
        tournamentButton.innerHTML = `${tournament.name} - Début : ${tournament.start_date} - Participants : ${tournament.current_participants}/${tournament.number_of_players}`;
        
        // Ajouter un gestionnaire d'événements onclick pour chaque bouton
        tournamentButton.onclick = function() {
            displayTournamentDetails(tournament);
        };

        container.appendChild(tournamentButton);
    });
}

// function displayTournamentDetails(tournamentData) {
//     console.log("tournament data: ", tournamentData)
//     const tournamentSection = document.getElementById('tournamentBracket-section');
//     tournamentSection.innerHTML = ''; // Effacer les contenus précédents
//     tournamentSection.classList.remove('hidden');

//     // Ajouter le nom du tournoi
//     const tournamentName = document.createElement('h2');
//     tournamentName.id = 'tournament-name';
//     tournamentName.textContent = tournamentData.name;
//     tournamentSection.appendChild(tournamentName);

//     // Créer et ajouter les demi-finales
//     const semiFinals = createRound(tournamentData, 'semi-final');
//     tournamentSection.appendChild(semiFinals);

//     // Créer et ajouter la finale
//     const final = createRound(tournamentData, 'final');
//     tournamentSection.appendChild(final);
// }

// function createRound(tournamentData, roundType) {
//     const roundDiv = document.createElement('div');
//     roundDiv.className = 'round';

//     // Supposons que tournamentData.matches est un tableau de matches
//     // Vous devrez filtrer ou sélectionner les matches en fonction de roundType
//     tournamentData.matches.forEach(match => {
//         if (match.round === roundType) {
//             const matchDiv = document.createElement('div');
//             matchDiv.className = 'match';
//             matchDiv.id = `${roundType}-${match.id}`;

//             const player1Div = document.createElement('div');
//             player1Div.className = 'player';
//             player1Div.id = `player-${match.player1.id}`;
//             player1Div.textContent = match.player1.name;

//             const player2Div = document.createElement('div');
//             player2Div.className = 'player';
//             player2Div.id = `player-${match.player2.id}`;
//             player2Div.textContent = match.player2.name;

//             matchDiv.appendChild(player1Div);
//             matchDiv.appendChild(player2Div);
//             roundDiv.appendChild(matchDiv);
//         }
//     });

//     return roundDiv;
// }

function displayTournamentDetails(tournamentData) {
    const tournamentSection = document.getElementById('tournamentBracket-section');
    tournamentSection.innerHTML = '';
    navigateTo('tournamentBracket'); // Assurez-vous que cette fonction existe pour gérer la navigation

    const tournamentName = document.createElement('h2');
    tournamentName.textContent = tournamentData.name;
    tournamentSection.appendChild(tournamentName);

    const semiFinals = createDefaultRound('semi-final', 2, tournamentData.participants);
    tournamentSection.appendChild(semiFinals);

    const final = createDefaultRound('final', 1, []);
    tournamentSection.appendChild(final);

    // Créer le bouton d'inscription avec la forme souhaitée
    const registerButton = document.createElement('button');
    registerButton.className = 'btn btn-primary';
    registerButton.textContent = "S'inscrire";
    registerButton.onclick = function() {
        registerForTournament(tournamentData.id);
    };

    // Ajouter le bouton d'inscription à la section du tournoi
    tournamentSection.appendChild(registerButton);
}

function createDefaultRound(roundType, numberOfMatches, participants) {
    const roundDiv = document.createElement('div');
    roundDiv.className = 'round';
    roundDiv.id = `${roundType}`;

    // Créer un tableau avec suffisamment de places pour tous les joueurs nécessaires pour les matchs
    const filledParticipants = [];
    for (let i = 0; i < numberOfMatches * 2; i++) {
        filledParticipants.push(
            participants[i] ? participants[i] : { username: "libre" }
        );
    }

    for (let i = 0; i < numberOfMatches; i++) {
        const matchDiv = document.createElement('div');
        matchDiv.className = 'match';
        matchDiv.id = `${roundType}-${i + 1}`;

        const player1Index = i * 2;
        const player2Index = i * 2 + 1;

        // Créer les joueurs pour le match
        const player1Div = document.createElement('div');
        player1Div.className = 'player';
        player1Div.textContent = filledParticipants[player1Index].username;

        const player2Div = document.createElement('div');
        player2Div.className = 'player';
        player2Div.textContent = filledParticipants[player2Index].username;

        matchDiv.appendChild(player1Div);
        matchDiv.appendChild(player2Div);
        roundDiv.appendChild(matchDiv);
    }
    return roundDiv;
}

function registerForTournament(tournamentId) {
    console.log('tournament id:', tournamentId)
    // Ici, vous pouvez ajouter la logique pour envoyer une requête d'inscription au serveur
    console.log(`Tentative d'inscription au tournoi avec l'ID : ${tournamentId}`);

    fetch(`/api/register_to_tournament/${tournamentId}/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
        },
        // Pas de corps nécessaire si vous identifiez le joueur par son token d'authentification
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            console.log(data);
            // Vous pourriez vouloir rafraîchir les détails du tournoi ou naviguer l'utilisateur vers une autre vue
        }
    })
    .catch(error => {
        console.error('Erreur lors de l\'inscription :', error);
    });
}

function updateTournamentDisplay(tournamentUpdate) {
    console.log("updateTournament inside")
    // Si l'ID du tournoi reçu correspond au tournoi actuellement affiché, mettez à jour l'affichage
    const tournamentSection = document.getElementById('tournamentBracket-section');
    const currentTournamentName = tournamentSection.querySelector('h2').textContent;
    
    if (currentTournamentName === tournamentUpdate.name) {
        // Mettez à jour les matchs avec les nouveaux participants
        const matches = tournamentSection.querySelectorAll('.match');
        for (let i = 0; i < matches.length; i++) {
            const playerDivs = matches[i].querySelectorAll('.player');
            const player1Div = playerDivs[0];
            const player2Div = playerDivs[1];

            // Mettre à jour les noms des joueurs
            if (i < tournamentUpdate.current_participants) {
                player1Div.textContent = tournamentUpdate.username; // Nom du joueur inscrit
            } else {
                player1Div.textContent = "libre";
                player2Div.textContent = "libre";
            }
        }
    }
}



// // Appeler cette fonction pour générer l'arbre de tournoi
// displayTournamentDetails({ 
//     name: "Tournoi Exemple", 
//     matches: [
//         // Ajouter des objets de match ici
//     ]
// });







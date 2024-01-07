document.getElementById('startAtSpecificTime').addEventListener('change', function () {
    document.getElementById('specificDateTime').disabled = !this.checked;
});

document.getElementById('createTournamentForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const tournamentName = document.getElementById('tournamentNameBis').value;
    console.log('tournament name: ', tournamentName)
    const numberOfPlayers = document.querySelector('input[name="numberOfPlayers"]:checked').value;
    const startDateOption = document.querySelector('input[name="startDateOption"]:checked').value;
    let specificStartDate = null;

    if (startDateOption === 'specificTime') {
        specificStartDate = document.getElementById('specificDateTime').value;
    }
    const data = {
        name: tournamentName,
        number_of_players: numberOfPlayers,
        start_date_option: startDateOption,
        specific_start_date: specificStartDate
    };
    console.log('data send: ', data)
    fetch('/api/create_tournament/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            if (data.success) {
                registerUserToTournament(data.tournament_id);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
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
        })
        .catch((error) => {
            console.error('Inscription Error:', error);
        });
}

let availableTournaments = [];

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
            availableTournaments = tournaments;
            displayTournaments(tournaments);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function sortTournaments(criteria, button) {
    let sortedTournaments = [...availableTournaments];
    let isAscending = true;

    // Réinitialiser les indicateurs sur tous les autres boutons
    document.querySelectorAll('.sort-indicator').forEach(indicator => {
        if (indicator !== button.querySelector('.sort-indicator')) {
            indicator.textContent = '▲';
        }
    });

    // Vérifier et basculer le sens du tri pour le bouton actuel
    const indicator = button.querySelector('.sort-indicator');
    if (indicator.textContent === '▼') {
        isAscending = true;
        indicator.textContent = '▲';
    } else {
        isAscending = false;
        indicator.textContent = '▼';
    }

    // Appliquer le tri
    sortedTournaments.sort((a, b) => {
        let comparison = 0;
        switch (criteria) {
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'date':
                // Gérer les dates nulles correctement
                if (a.start_date === null && b.start_date === null) {
                    comparison = 0; // Deux dates nulles sont équivalentes
                } else if (a.start_date === null) {
                    comparison = isAscending ? -1 : -1;
                } else if (b.start_date === null) {
                    comparison = isAscending ? 1 : 1;
                } else {
                    comparison = new Date(a.start_date) - new Date(b.start_date);
                }
                break;
            case 'participants':
                comparison = a.number_of_players - b.number_of_players;
                break;
        }
        return isAscending ? comparison : -comparison;
    });

    displayTournaments(sortedTournaments);
}




function displayTournaments(tournaments) {
    const container = document.getElementById('available-tournaments');
    container.innerHTML = '';

    // tournaments.sort((a, b) => {
    //     if (a.start_date === null) return -1;
    //     if (b.start_date === null) return 1;
    //     return new Date(a.start_date) - new Date(b.start_date);
    // });

    tournaments.forEach(tournament => {
        const tournamentButton = document.createElement('button');
        tournamentButton.className = 'btn btn-outline-secondary tournament-btn';
        tournamentButton.innerHTML = `${tournament.name} - Début : ${tournament.start_date} - Participants : ${tournament.current_participants}/${tournament.number_of_players}`;

        tournamentButton.onclick = function () {
            displayTournamentDetails(tournament);
        };

        container.appendChild(tournamentButton);
    });
}

function displayTournamentDetails(tournamentData) {
    // Mettre à jour le nom du tournoi
    document.getElementById('tournamentName').textContent = tournamentData.name;

    // Afficher la section du tournoi
    const tournamentSection = document.getElementById('tournamentBracket-section');
    tournamentSection.classList.remove('hidden');
    navigateWithTokenCheck('tournamentBracket');


    // Créer et ajouter les demi-finales
    const semiFinals = createRound('semi-final', tournamentData.participants.slice(0, 4));
    document.getElementById('semi-finals').innerHTML = ''; // Nettoyer les demi-finales existantes
    document.getElementById('semi-finals').appendChild(semiFinals);

    // Créer et ajouter la finale
    const final = createRound('final', []);
    document.getElementById('final').innerHTML = ''; // Nettoyer la finale existante
    document.getElementById('final').appendChild(final);

    // Ajouter le bouton d'inscription
    let registerButton = document.getElementById('tournament-register-button');
    if (!registerButton) {
        registerButton = document.createElement('button');
        registerButton.id = 'tournament-register-button';
        registerButton.className = 'btn btn-outline-secondary';
        //    tournamentSection.appendChild(registerButton);
    }

    const username = localStorage.getItem('username');
    const isRegistered = tournamentData.participants.some(participant => participant.username === username);

    if (isRegistered) {
        registerButton.textContent = "Se désinscrire";
        registerButton.onclick = function () {
            unregisterFromTournament(tournamentData.id);
        };
    } else {
        registerButton.textContent = "S'inscrire";
        registerButton.onclick = function () {
            registerForTournament(tournamentData);
        };
    }
    tournamentSection.appendChild(registerButton);
}

function createRound(roundType, participants) {
    const roundDiv = document.createElement('div');
    roundDiv.id = roundType;
    if (roundType == 'semi-final') {
        for (let i = 0; i < 4; i += 2) {
            const match = createMatchElement(`${roundType}-${(i / 2) + 1}`, participants[i], participants[i + 1]);
            roundDiv.appendChild(match);
        }
    }
    if (roundType == 'final') {
        for (let i = 0; i < 2; i += 2) {
            const match = createMatchElement(`${roundType}-${(i / 2) + 1}`, participants[i], participants[i + 1]);
            roundDiv.appendChild(match);
        }
    }

    return roundDiv;
}

function createMatchElement(matchId, player1, player2) {
    const matchDiv = document.createElement('div');
    matchDiv.id = matchId;
    matchDiv.className = 'match my-3';

    const player1Div = document.createElement('div');
    player1Div.className = 'player';
    player1Div.textContent = player1 ? player1.username : "En attente";

    const vsDiv = document.createElement('div');
    vsDiv.textContent = 'vs';

    const player2Div = document.createElement('div');
    player2Div.className = 'player';
    player2Div.textContent = player2 ? player2.username : "En attente";

    matchDiv.appendChild(player1Div);
    matchDiv.appendChild(vsDiv);
    matchDiv.appendChild(player2Div);

    return matchDiv;
}

// Assurez-vous d'appeler displayTournamentDetails avec les données appropriées

function registerForTournament(tournamentData) {
    console.log('tournament data:', tournamentData)
    console.log(`Tentative d'inscription au tournoi avec l'ID : ${tournamentData.id}`);
    const tournamentId = tournamentData.id
    fetch(`/api/register_to_tournament/${tournamentId}/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                console.log(data);
            }
        })
        .catch(error => {
            console.error('Erreur lors de l\'inscription :', error);
        });
}

function unregisterFromTournament(tournamentData) {
    console.log('tournament data:', tournamentData)
    console.log(`Tentative de desinscription au tournoi avec l'ID : ${tournamentData.id}`);
    const tournamentId = tournamentData
    fetch(`/api/unregister_from_tournament/${tournamentId}/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                console.log(data);
            }
        })
        .catch(error => {
            console.error('Erreur lors de la desinscription :', error);
        });
}

function fetchTournamentDetails(tournamentId) {
    fetch(`/api/tournament_details/${tournamentId}/`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
    })
        .then(response => response.json())
        .then(tournamentData => {
            displayTournamentDetails(tournamentData);
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des détails du tournoi :', error);
        });
}
document.getElementById('createTournamentForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const errorMessageElement = document.getElementById('tournamentCreationErrorMessage');
    errorMessageElement.style.display = 'none';

    let nickName = document.getElementById('tournamentNickname').value;
    const tournamentName = document.getElementById('tournamentNameBis').value;

    if (!nickName) {
        nickName = localStorage.getItem('username'); // Assurez-vous que username est correctement stocké dans localStorage
    }
    
    console.log('Tournament name: ', tournamentName);

    // Première vérification : existence du nom du tournoi
    fetch(`/api/check_tournament_exists/${encodeURIComponent(tournamentName)}/`, {
        headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Problème réseau.');
        }
        return response.json();
    })
    .then(data => {
        if (data.exists) {
            throw new Error("Nom de tournoi non dispo");
        } else {
            // Deuxième vérification : existence du nickname
            // Important : retournez cette promesse pour que le prochain .then() dans la chaîne soit appliqué à cette requête
            return fetch(`/api/check_nickname_exists/${encodeURIComponent(nickName)}/`, {
                headers: {
                    'accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
            });
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Problème réseau.');
        }
        return response.json();
    })
    .then(data => {
        if (data.exists) {
            throw new Error("Nickname déjà pris");
        } else {
            // Tout est ok, procéder à la création du tournoi
            createTournament(tournamentName, nickName);
        }
    })
    .catch((error) => {
        displayErrorMessage(error.message);
    });
});

function createTournament(tournamentName, nickName) {
    // const numberOfPlayers = document.querySelector('input[name="numberOfPlayers"]:checked').value;

    const startDateOption = "whenFull";
    let specificStartDate = null;

    if (startDateOption === 'specificTime') {
        specificStartDate = document.getElementById('specificDateTime').value;
    }
    const data = {
        name: tournamentName,
        number_of_players: "4",
        start_date_option: startDateOption,
        specific_start_date: specificStartDate
    };
    console.log('data send: ', data)
    const csrfToken = getCSRFToken();

    fetch('/api/create_tournament/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        // First, check if the response is OK
        if (!response.ok) {
            // If not, convert the response body to JSON and throw it as an error
            return response.json().then(data => {
                const errorMessage = data.message || 'Ce tournoi existe déjà.';
                throw new Error(errorMessage);
            });
        }
        // If response is OK, convert it to JSON and proceed
        return response.json();
    })
    .then(data => {
        // Here, handle the successful case
        console.log('Success for tournament:', data);
        if (data.success) {
            registerForTournament(data.tournament_id, nickName);
            // Get the modal element
            const modalElement = document.getElementById('createTournamentModal');
            // Get the modal instance
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            // Hide the modal
            modalInstance.hide();
        } else {
            // If data.success is not true, handle it as an error
            console.error('Tournament creation failed:', data);
            displayErrorMessage('Tournament creation failed for an unknown reason.');
        }
    })
    .catch(error => {
        // Here, handle any errors that occurred during the fetch or in the first then
        console.error('Error:', error);
        displayErrorMessage(error.message || 'An unexpected error occurred while creating the tournament.');
    });
    
}

function registerUserToTournament(tournamentId) {
    const csrfToken = getCSRFToken();
    fetch(`/api/register_to_tournament/${tournamentId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'X-CSRFToken': csrfToken
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
            fetchTournamentDetails(tournament.id);
        };

        container.appendChild(tournamentButton);
    });
}

function displayTournamentDetails(tournamentData) {
    console.log("les details du tournoi sont: ", tournamentData);
    document.getElementById('tournamentName').textContent = tournamentData.name;

    const tournamentSection = document.getElementById('tournamentBracket-section');
    tournamentSection.classList.remove('hidden');
    navigateWithTokenCheck('tournamentBracket');

    const semiFinals = createRound('semi-final', tournamentData.participants.slice(0, 4));
    document.getElementById('semi-finals').innerHTML = '';
    document.getElementById('semi-finals').appendChild(semiFinals);

    const final = createRound('final', tournamentData.participants.slice(0, 2), tournamentData.final_players);
    document.getElementById('final').innerHTML = '';
    document.getElementById('final').appendChild(final);

    let winnerDiv = document.getElementById('winner');
    if (!winnerDiv) {
        winnerDiv = document.createElement('div');
        winnerDiv.id = 'winner';
        winnerDiv.className = 'winner my-3';
        document.getElementById('final').appendChild(winnerDiv); // Assurez-vous d'ajouter à l'endroit correct si nécessaire
    }
    winnerDiv.textContent = tournamentData.final_winner ? `${tournamentData.final_winner}` : "En attente";

    // Créer ou récupérer le champ d'entrée pour le nickname
    let nicknameInput = document.getElementById('tournament-nickname-input');
    if (!nicknameInput) {
        nicknameInput = document.createElement('input');
        nicknameInput.id = 'tournament-nickname-input';
        nicknameInput.className = 'form-control mb-2';
        nicknameInput.placeholder = 'Entrez un surnom pour le tournoi (facultatif)';
    }

    // Créer ou récupérer le bouton d'inscription
    let registerButton = document.getElementById('tournament-register-button');
    if (!registerButton) {
        registerButton = document.createElement('button');
        registerButton.id = 'tournament-register-button';
        registerButton.className = 'btn btn-outline-secondary';
    }

    // Configuration du bouton d'inscription
    const username = localStorage.getItem('username');
    const isRegistered = tournamentData.participants.some(participant => participant.username === username);

    registerButton.hidden = isRegistered;
    nicknameInput.hidden = isRegistered;

    if (!isRegistered) {
        registerButton.textContent = "S'inscrire";
        registerButton.onclick = async function () {
            const nickname = nicknameInput.value;
            await registerForTournament(tournamentData.id, nickname);
        };
    }

    // Ajouter les éléments au DOM dans l'ordre correct
    tournamentSection.appendChild(nicknameInput);
    tournamentSection.appendChild(registerButton);
}


function displayTournamentDetailsWaitingPage(tournamentData) {
    console.log("les details du tournoi sont: ", tournamentData)
    // Mettre à jour le nom du tournoi
    document.getElementById('tournamentNameWaitingPage').textContent = tournamentData.name;

    // Afficher la section du tournoi
    const tournamentSection = document.getElementById('waitingRoomTournament-section');
    // tournamentSection.classList.remove('hidden');
    navigateWithTokenCheck('waitingRoomTournament');


    // Créer et ajouter les demi-finales
    const semiFinals = createRound('semi-final', tournamentData.participants.slice(0, 4));
    document.getElementById('semi-finalsWaitingPage').innerHTML = ''; // Nettoyer les demi-finales existantes
    document.getElementById('semi-finalsWaitingPage').appendChild(semiFinals);

    const final = createRound('final', tournamentData.participants.slice(0, 2), tournamentData.final_players);
    document.getElementById('finalWaitingPage').innerHTML = '';
    document.getElementById('finalWaitingPage').appendChild(final);

    const winnerDiv = document.createElement('div');
    winnerDiv.id = 'winnerWaitingPage';
    winnerDiv.className = 'winner my-3';
    
    // Définir le contenu de la div du gagnant
    if (tournamentData.final_winner) {
        document.getElementById('winnerWaitingPage').innerHTML = '';
        winnerDiv.textContent = `${tournamentData.final_winner}`;
    } else {
        document.getElementById('winnerWaitingPage').innerHTML = '';
        winnerDiv.textContent = "En attente";
    }
    
    // Ajouter la div du gagnant à la section finale
    document.getElementById('winnerWaitingPage').appendChild(winnerDiv);

    // document.getElementById('winner').innerHTML = '';
    // document.getElementById('winner').

    // Ajouter le bouton d'inscription
    // let registerButton = document.getElementById('tournamentWaitingPage-register-button');
    // if (!registerButton) {
    //     registerButton = document.createElement('button');
    //     registerButton.id = 'tournamentWaitingPage-register-button';
    //     registerButton.className = 'btn btn-outline-secondary';
    //     //    tournamentSection.appendChild(registerButton);
    // }

    // const username = localStorage.getItem('username');
    // const isRegistered = tournamentData.participants.some(participant => participant.username === username);

    // if (isRegistered) {
    //     registerButton.textContent = "Se désinscrire";
    //     registerButton.onclick = function () {
    //         unregisterFromTournament(tournamentData.id);
    //     };
    // } else {
    //     registerButton.textContent = "S'inscrire";
    //     registerButton.onclick = async function () {
    //         await registerForTournament(tournamentData.id);
    //     };
    // }
    // tournamentSection.appendChild(registerButton);
}

function createRound(roundType, participants, finalPlayers = null) {
    const roundDiv = document.createElement('div');
    roundDiv.id = roundType;
    if (roundType == 'semi-final') {
        for (let i = 0; i < 4; i += 2) {
            const match = createMatchElement(`${roundType}-${(i / 2) + 1}`, participants[i], participants[i + 1]);
            roundDiv.appendChild(match);
        }
    }
    if (roundType == 'final' && finalPlayers) {
        const finalMatch = createFinalElement(`${roundType}-1`, finalPlayers);
        roundDiv.appendChild(finalMatch);
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
    vsDiv.className = 'vs';
    vsDiv.textContent = 'vs';

    const player2Div = document.createElement('div');
    player2Div.className = 'player';
    player2Div.textContent = player2 ? player2.username : "En attente";

    matchDiv.appendChild(player1Div);
    matchDiv.appendChild(vsDiv);
    matchDiv.appendChild(player2Div);

    return matchDiv;
}

function createFinalElement(matchId, finalPlayers) {
    const matchDiv = document.createElement('div');
    matchDiv.id = matchId;
    matchDiv.className = 'match my-3';

    const player1Div = document.createElement('div');
    player1Div.className = 'player';
    player1Div.textContent = finalPlayers[0] && finalPlayers[0].username ? finalPlayers[0].username : "En attente";

    const vsDiv = document.createElement('div');
    vsDiv.className = 'vs';
    vsDiv.textContent = 'vs';

    const player2Div = document.createElement('div');
    player2Div.className = 'player';
    player2Div.textContent = finalPlayers[1] && finalPlayers[1].username ? finalPlayers[1].username : "En attente";

    matchDiv.appendChild(player1Div);
    matchDiv.appendChild(vsDiv);
    matchDiv.appendChild(player2Div);

    return matchDiv;
}

// Assurez-vous d'appeler displayTournamentDetails avec les données appropriées

async function registerForTournament(tournamentData, nickname) {
    try {
        const gameSocketId = await openGameWebSocketConnection();
        localStorage.setItem('gameSocket_ID', gameSocketId)
        await updateGameSocketId(gameSocketId);

        console.log('tournament data:', tournamentData);
        console.log(`Tentative d'inscription au tournoi avec l'ID : ${tournamentData}`);
        const tournamentId = tournamentData;
        const csrfToken = getCSRFToken();

        const response = await fetch(`/api/register_to_tournament/${tournamentId}/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({ 
                game_socket_id: gameSocketId,
                nickname: nickname,
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de l\'inscription');
        }
        if (data.tournament_id) {
            localStorage.setItem('inGame', true)
            localStorage.setItem('inTournament', true)
            // localStorage.setItem('currentGameId', data.game_id);
            sendGameIdToWebSocket_tournament(data.tournament_id);
            // localStorage.setItem('playerRole', data.player_role);  // Stocker le rôle du joueur
            // updatePlayerRole(data.player_role);  // Mettre à jour le rôle du joueur
            // if (data.message.includes('Partie en cours')) {
            //     console.log("!!!!!partie en cours ok")
            //     // startPongGame(data.game_id);
            // }
            if (data.message.includes('Inscription réussie')) {
                fetchTournamentDetailsWaitingPage(data.tournament_id);
            }
        }

        console.log(data);
    } catch (error) {
        console.error('Erreur lors de l\'inscription :', error.message);
        alert(error.message);
    }
}


function unregisterFromTournament(tournamentData) {
    console.log('tournament data:', tournamentData)
    console.log(`Tentative de desinscription au tournoi avec l'ID : ${tournamentData.id}`);
    const tournamentId = tournamentData;
    const csrfToken = getCSRFToken();
    
    fetch(`/api/unregister_from_tournament/${tournamentId}/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
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
            console.log("les details du tournoi sont: ", tournamentData)
            displayTournamentDetails(tournamentData);
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des détails du tournoi :', error);
        });
}

function fetchTournamentDetailsWaitingPage(tournamentId) {
    fetch(`/api/tournament_details/${tournamentId}/`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
    })
        .then(response => response.json())
        .then(tournamentData => {
            console.log("les details du tournoi sont: ", tournamentData)
            displayTournamentDetailsWaitingPage(tournamentData);
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des détails du tournoi :', error);
        });
}

function displayErrorMessage(message) {
    const errorMessageElement = document.getElementById('tournamentCreationErrorMessage');
    if (errorMessageElement) {
        errorMessageElement.textContent = message; // Set the text content to the message
        errorMessageElement.style.display = 'block'; // Make sure it's visible
    } else {
        console.error('Error message element not found');
    }
}

function displayErrorMessageUser(message) {
    const errorMessageElement = document.getElementById('UserCreationErrorMessage');
    if (errorMessageElement) {
        errorMessageElement.textContent = message; // Set the text content to the message
        errorMessageElement.style.display = 'block'; // Make sure it's visible
    } else {
        console.error('Error message element not found');
    }
}

function displayErrorMessageLogin(message) {
    const errorMessageElement = document.getElementById('UserLoginErrorMessage');
    if (errorMessageElement) {
        errorMessageElement.textContent = message; // Set the text content to the message
        errorMessageElement.style.display = 'block'; // Make sure it's visible
    } else {
        console.error('Error message element not found');
    }
}

function displayErrorMessageFriendRequest(message) {
    const errorMessageElement = document.getElementById('friendRequestErrorMessage');
    if (errorMessageElement) {
        errorMessageElement.textContent = message; // Set the text content to the message
        errorMessageElement.style.display = 'block'; // Make sure it's visible
    } else {
        console.error('Error message element not found');
    }
}

function displayErrorMessageEditUser(message) {
    const errorMessageElement = document.getElementById('UserEditErrorMessage');
    if (errorMessageElement) {
        errorMessageElement.textContent = message; // Set the text content to the message
        errorMessageElement.style.display = 'block'; // Make sure it's visible
    } else {
        console.error('Error message element not found');
    }
}

function displayErrorMessageJoinGame(message) {
    const errorMessageElement = document.getElementById('JoinGameErrorMessage');
    if (errorMessageElement) {
        errorMessageElement.textContent = message; // Set the text content to the message
        errorMessageElement.style.display = 'block'; // Make sure it's visible
    } else {
        console.error('Error message element not found');
    }
}

function displayErrorMessage2FA(message) {
    const errorMessageElement = document.getElementById('2FAErrorMessage');
    if (errorMessageElement) {
        errorMessageElement.textContent = message; // Set the text content to the message
        errorMessageElement.style.display = 'block'; // Make sure it's visible
    } else {
        console.error('Error message element not found');
    }
}

function displayErrorMessage2FAQR(message) {
    const errorMessageElement = document.getElementById('2FAQRErrorMessage');
    if (errorMessageElement) {
        errorMessageElement.textContent = message; // Set the text content to the message
        errorMessageElement.style.display = 'block'; // Make sure it's visible
    } else {
        console.error('Error message element not found');
    }
}
document.getElementById('createTournamentForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const errorMessageElement = document.getElementById('tournamentCreationErrorMessage');
    errorMessageElement.style.display = 'none';

    let nickName = document.getElementById('tournamentNickname').value;
    const tournamentName = document.getElementById('tournamentNameBis').value;

    if (!nickName) {
        nickName = localStorage.getItem('username'); 
    }
    
    console.log('Tournament name: ', tournamentName);

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
            createTournament(tournamentName, nickName);
        }
    })
    .catch((error) => {
        displayErrorMessage(error.message);
    });
});

function createTournament(tournamentName, nickName) {

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
        if (!response.ok) {
            return response.json().then(data => {
                const errorMessage = data.message || 'Ce tournoi existe déjà.';
                throw new Error(errorMessage);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Success for tournament:', data);
        if (data.success) {
            registerForTournament(data.tournament_id, nickName);
            const modalElement = document.getElementById('createTournamentModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            modalInstance.hide();
        } else {
            console.error('Tournament creation failed:', data);
            displayErrorMessage('Tournament creation failed for an unknown reason.');
        }
    })
    .catch(error => {
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

    document.querySelectorAll('.sort-indicator').forEach(indicator => {
        if (indicator !== button.querySelector('.sort-indicator')) {
            indicator.textContent = '▲';
        }
    });

    const indicator = button.querySelector('.sort-indicator');
    if (indicator.textContent === '▼') {
        isAscending = true;
        indicator.textContent = '▲';
    } else {
        isAscending = false;
        indicator.textContent = '▼';
    }

    sortedTournaments.sort((a, b) => {
        let comparison = 0;
        switch (criteria) {
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'date':
                if (a.start_date === null && b.start_date === null) {
                    comparison = 0; 
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
        document.getElementById('final').appendChild(winnerDiv);
    }
    winnerDiv.textContent = tournamentData.final_winner ? `${tournamentData.final_winner}` : "En attente";

    let nicknameInput = document.getElementById('tournament-nickname-input');
    if (!nicknameInput) {
        nicknameInput = document.createElement('input');
        nicknameInput.id = 'tournament-nickname-input';
        nicknameInput.className = 'form-control mb-2';
        nicknameInput.placeholder = 'Entrez un surnom pour le tournoi (facultatif)';
    }

    let registerButton = document.getElementById('tournament-register-button');
    if (!registerButton) {
        registerButton = document.createElement('button');
        registerButton.id = 'tournament-register-button';
        registerButton.className = 'btn btn-outline-secondary';
    }

    const username = localStorage.getItem('username');
    const isRegistered = tournamentData.participants.some(participant => participant.username === username);
    
    const isFull = tournamentData.current_participants = 4;

    registerButton.hidden = isRegistered || isFull;
    nicknameInput.hidden = isRegistered || isFull;

    if (!isRegistered) {
        registerButton.textContent = "S'inscrire";
        registerButton.onclick = async function () {
            const nickname = nicknameInput.value;
            await registerForTournament(tournamentData.id, nickname);
        };
    }

    tournamentSection.appendChild(nicknameInput);
    tournamentSection.appendChild(registerButton);
}


function displayTournamentDetailsWaitingPage(tournamentData) {
    console.log("les details du tournoi sont: ", tournamentData)
    document.getElementById('tournamentNameWaitingPage').textContent = tournamentData.name;

    const tournamentSection = document.getElementById('waitingRoomTournament-section');
    navigateWithTokenCheck('waitingRoomTournament');


    const semiFinals = createRound('semi-final', tournamentData.participants.slice(0, 4));
    document.getElementById('semi-finalsWaitingPage').innerHTML = '';
    document.getElementById('semi-finalsWaitingPage').appendChild(semiFinals);

    const final = createRound('final', tournamentData.participants.slice(0, 2), tournamentData.final_players);
    document.getElementById('finalWaitingPage').innerHTML = '';
    document.getElementById('finalWaitingPage').appendChild(final);

    const winnerDiv = document.createElement('div');
    winnerDiv.id = 'winnerWaitingPage';
    winnerDiv.className = 'winner my-3';
    
    if (tournamentData.final_winner) {
        document.getElementById('winnerWaitingPage').innerHTML = '';
        winnerDiv.textContent = `${tournamentData.final_winner}`;
    } else {
        document.getElementById('winnerWaitingPage').innerHTML = '';
        winnerDiv.textContent = "En attente";
    }
    
    document.getElementById('winnerWaitingPage').appendChild(winnerDiv);
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


async function registerForTournament(tournamentData, nickname) {
    try {
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
                nickname: nickname,
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de l\'inscription');
        }
        
		const gameSocketId = await openGameWebSocketConnection();
        localStorage.setItem('gameSocket_ID', gameSocketId)
        await updateGameSocketId(gameSocketId);

        if (data.tournament_id) {
            localStorage.setItem('inGame', true)
            localStorage.setItem('inTournament', true)
            sendGameIdToWebSocket_tournament(data.tournament_id);
            if (data.message.includes('Inscription réussie')) {
                fetchTournamentDetailsWaitingPage(data.tournament_id);
            }
        }

        console.log(data);
    } catch (error) {
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
            } else {
            }
        })
        .catch(error => {
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
        errorMessageElement.textContent = message; 
        errorMessageElement.style.display = 'block';
    } else {
        console.error('Error message element not found');
    }
}

function displayErrorMessageUser(message) {
    const errorMessageElement = document.getElementById('UserCreationErrorMessage');
    if (errorMessageElement) {
        errorMessageElement.textContent = message; 
        errorMessageElement.style.display = 'block';
    } else {
        console.error('Error message element not found');
    }
}

// function displayErrorMessageLogin(message) {
//     const errorMessageElement = document.getElementById('UserLoginErrorMessage');
//     if (errorMessageElement) {
//         errorMessageElement.textContent = message; // Set the text content to the localized message
//         errorMessageElement.style.display = 'block'; // Make sure it's visible
//     } else {
//         console.error('Error message element not found');
//     }
// }

async function displayErrorMessageLogin() {
    const errorMessageElement = document.getElementById('UserLoginErrorMessage');
    if (errorMessageElement) {
        errorMessageElement.textContent = message; 
        errorMessageElement.style.display = 'block';
    } else {
        return;
    }

    const messageKey = errorMessageElement.getAttribute('data-key');
    var lang = localStorage.getItem('language');

    try {
        const response = await fetch('./locales/alerts.json');
        const messages = await response.json();

        // Check if the message exists for the given key and language
        if (messages[messageKey] && messages[messageKey][lang]) {
            var message = messages[messageKey][lang];
            // Display the localized message
            errorMessageElement.textContent = message;
            errorMessageElement.style.display = 'block';
        } else {
            console.error("Message not found for key: " + messageKey + " and language: " + lang);
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}



function displayErrorMessageFriendRequest(message) {
    const errorMessageElement = document.getElementById('friendRequestErrorMessage');
    if (errorMessageElement) {
        errorMessageElement.textContent = message;
        errorMessageElement.style.display = 'block';
    } else {
        console.error('Error message element not found');
    }
}

// function displayErrorMessageEditUser(message) {
//     const errorMessageElement = document.getElementById('UserEditErrorMessage');
//     if (errorMessageElement) {
//         errorMessageElement.textContent = message; // Set the text content to the message
//         errorMessageElement.style.display = 'block'; // Make sure it's visible
//     } else {
//         console.error('Error message element not found');
//     }
// }

// Modified function to asynchronously fetch and display localized error messages
async function displayErrorMessageEditUser() {
    const errorMessageElement = document.getElementById('UserEditErrorMessage');
    if (errorMessageElement) {
        errorMessageElement.textContent = message;
        errorMessageElement.style.display = 'block';
    } else {
        return;
    }

    const messageKey = errorMessageElement.getAttribute('data-key');
    var lang = localStorage.getItem('language');

    try {
        const response = await fetch('./locales/alerts.json');
        const messages = await response.json();

        if (messages[messageKey] && messages[messageKey][lang]) {
            var message = messages[messageKey][lang];
            errorMessageElement.textContent = message;
            errorMessageElement.style.display = 'block';
        } else {
            console.error("Message not found for key: " + messageKey + " and language: " + lang);
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}


function displayErrorMessageJoinGame(message) {
    const errorMessageElement = document.getElementById('JoinGameErrorMessage');
    if (errorMessageElement) {
        errorMessageElement.textContent = message;
        errorMessageElement.style.display = 'block';
    } else {
        console.error('Error message element not found');
    }
}

function displayErrorMessage2FA(message) {
    const errorMessageElement = document.getElementById('2FAErrorMessage');
    if (errorMessageElement) {
        errorMessageElement.textContent = message;
        errorMessageElement.style.display = 'block';
    } else {
        console.error('Error message element not found');
    }
}

function displayErrorMessage2FAQR(message) {
    const errorMessageElement = document.getElementById('2FAQRErrorMessage');
    if (errorMessageElement) {
        errorMessageElement.textContent = message;
        errorMessageElement.style.display = 'block';
    } else {
        console.error('Error message element not found');
    }
}

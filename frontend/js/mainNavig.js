// function showLoginForm() {
//     navigateTo('login');
// }

// function showRegisterForm() {
//     navigateTo('register');
// }

// function goTournament() {
//     navigateWithTokenCheck('tournament')
// }

// function showTwoFactorForm() {
//     navigateTo('emailTwoFactor');
// }

// function showQrTwoFactorForm() {
//     navigateTo('qrTwoFactor');
// }

// async function navigateWithTokenCheck(sectionId) {
//     const tokenIsValid = await isValidToken();

//     if (!tokenIsValid && sectionId !== 'login' && sectionId !== 'home' && sectionId !== 'register') {
//         navigateTo('home');
//     } else {
//         navigateTo(sectionId);
//     }
// }

// function hideAllSections() {
//     document.getElementById('home-section').classList.add('hidden');
//     document.getElementById('login-section').classList.add('hidden');
//     document.getElementById('register-section').classList.add('hidden');
//     document.getElementById('welcome-section').classList.add('hidden');
//     document.getElementById('game-section').classList.add('hidden');
//     document.getElementById('emailTwoFactor-section').classList.add('hidden');
//     document.getElementById('pong-section').classList.add('hidden');
//     document.getElementById('qrTwoFactor-section').classList.add('hidden');
//     document.getElementById('tournament-section').classList.add('hidden');
//     document.getElementById('tournamentBracket-section').classList.add('hidden');
// }

// function navigateTo(sectionId) {
//     hideAllSections();
//     document.getElementById(sectionId + '-section').classList.remove('hidden');

//     if (!window.location.pathname.endsWith(`/${sectionId}`)) {
//         window.history.pushState({ section: sectionId }, '', `/${sectionId}`);
//     }
// }

// function render() {
//     const path = window.location.pathname;
//     const component = routes[path] || notFoundComponent;
//     document.getElementById('app').innerHTML = component();
// }

// window.onpopstate = render;
// document.addEventListener('DOMContentLoaded', render);

import * as Component from "./htmlFile";

const routes = {
    '/': Component.homeComponent,
    '/login': Component.loginComponent, // Supposons que vous avez une fonction similaire pour la page de connexion
    '/register': Component.registerComponent, // Supposons que vous avez une fonction similaire pour la page d'inscription
    '/welcome': Component.welcomeComponent,
    '/emailTwoFactor': Component.emailTwoFactor,
    '/qrTwoFactor': Component.qrTwoFactor,
    '/game': Component.gameComponent,
    '/pong': Component.pongComponent,
    '/tournament': Component.tournamentComponent,
    '/tournamentBracket': Component.tournamentBracketComponent,
    // autres routes...
};

function navigateTo(path) {
    history.pushState({}, '', path);
    render();
}

function render() {
    const path = window.location.pathname;
    const component = routes[path] || notFoundComponent;
    document.getElementById('app').innerHTML = component();

    // Appelez des fonctions d'initialisation ici, après avoir rendu le composant
    initializeComponentLogic();
}


function initializeComponentLogic() {

    document.getElementById('EmailTwoFactorForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const twoFactorCode = document.getElementById('twoFactorCode').value;
        const username = localStorage.getItem('username'); // Assurez-vous que le nom d'utilisateur est stocké lors de la tentative de connexion initiale

        fetch('/api/verify_two_factor_code/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify({
                username: username,
                two_factor_code: twoFactorCode,
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('2FA Verification successful:', data);
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                localStorage.setItem('language', data.language);
                // Après une connexion réussie
                // const burgerMenu = document.getElementById('bMenu');
                // burgerMenu.classList.remove('hidden');

                // const searchingBar = document.getElementById('searchU');
                // searchingBar.classList.remove('hidden');

                // console.log("Burger menu should be visible now");

                showWelcome();
                openWebSocketConnection();
                document.getElementById('hiddenNav').classList.remove('hidden');
            })
            .catch(error => {
                console.error('2FA Verification error:', error);
                alert('Invalid 2FA code. Please try again.');
            });
    });

    // Event listener for the QR two-factor authentication form submission
    document.getElementById('qrTwoFactorForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const qrTwoFactorCode = document.getElementById('qrTwoFactorCode').value;
        const username = localStorage.getItem('username'); // Assuming username is stored in localStorage

        fetch('/api/verify_two_factor_code/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify({
                username: username,
                two_factor_code: qrTwoFactorCode,
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('QR 2FA Verification successful:', data);
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                localStorage.setItem('language', data.language);
                // Après une connexion réussie
                const burgerMenu = document.getElementById('bMenu');
                burgerMenu.classList.remove('hidden');

                const searchingBar = document.getElementById('searchU');
                searchingBar.classList.remove('hidden');

                // console.log("Burger menu should be visible now");

                showWelcome();
                openWebSocketConnection();
            })
            .catch(error => {
                console.error('QR 2FA Verification error:', error);
                alert('Invalid QR 2FA code. Please try again.');
            });
    });

    document.getElementById('loginForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        fetch('/api/api_login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password,
            })
        })
            .then(response => response.json().then(data => ({ status: response.status, body: data })))
            .then(obj => {
                if (obj.status === 200) {
                    localStorage.setItem('username', username);

                    if (obj.body['2fa_required']) {
                        if (obj.body['2fa_method'] === 'qr') {
                            const qrCodeImgSrc = obj.body['qr_code_img'];
                            document.getElementById('qr-code-img').src = qrCodeImgSrc;
                            showQrTwoFactorForm();
                        } else {
                            showTwoFactorForm();
                        }
                    } else {
                        localStorage.setItem('access_token', obj.body.access);
                        localStorage.setItem('refresh_token', obj.body.refresh);
                        localStorage.setItem('language', obj.body.language);

                        loadTranslations(obj.body.language);
                        showWelcome();
                        openWebSocketConnection();
                        document.getElementById('hiddenNav').classList.remove('hidden');
                    }
                } else {
                    // alert(obj.body.error);
                    showAlert("login");
                }
            })
            .catch(error => {
                alert('Une erreur est survenue lors de la tentative de connexion.');
            });
    });

    async function showAlert(key) {
        var lang = localStorage.getItem('language');

        try {
            const response = await fetch('./locales/alerts.json');
            const messages = await response.json();

            if (messages[key] && messages[key][lang]) {
                var message = messages[key][lang];
                alert(message);
            } else {
                alert("Message not found for key: " + key + " and language: " + lang);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            alert("Unable to load messages.");
        }
    }


    function logout() {

        if (websocket && websocket.readyState === WebSocket.OPEN) {
            websocket.close();
            console.log("socket close: ", websocket)
        }

        fetch('/api/logout/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify({})
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log(data.message);

                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('username');
                // localStorage.removeItem('language');
                localStorage.removeItem('gameSocket_ID');
                document.getElementById('hiddenNav').classList.add('hidden');
                navigateTo('home');
            })
            .catch(error => {
                alert('Erreur lors de la déconnexion');
            });
    }

    document.getElementById('avatar').addEventListener('change', function (event) {
        var file = event.target.files[0];
        if (file) {
            var validTypes = ['image/jpeg', 'image/png'];
            var maxSize = 1048576; // 1MB in bytes

            // Check if the file type is valid
            if (!validTypes.includes(file.type)) {
                alert('Avatar1 : Seuls les fichiers JPEG et PNG sont autorisés.');
                event.target.value = ''; // Clear the file input
                return; // Exit the function
            }

            // Check if the file size exceeds the maximum size
            if (file.size > maxSize) {
                alert('Avatar1 : La taille du fichier doit être inférieure à 1 Mo.');
                event.target.value = ''; // Clear the file input
                return; // Exit the function
            }
        }
    });

    document.getElementById('registerForm').addEventListener('submit', function (event) {
        event.preventDefault();

        let formData = new FormData();
        formData.append('username', document.getElementById('username').value);
        formData.append('first_name', document.getElementById('firstname').value);
        formData.append('last_name', document.getElementById('lastname').value);
        formData.append('email', document.getElementById('email').value);
        formData.append('password', document.getElementById('password').value);

        let avatarFile = document.getElementById('avatar').files[0];
        if (avatarFile) {
            formData.append('avatar', avatarFile);
        }

        if (document.getElementById('password').value === document.getElementById('retypePassword').value) {
            fetch('/api/register/', {
                method: 'POST',
                body: formData
                // Pas d'en-tête 'Content-Type' ici car il est automatiquement défini avec FormData
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Registered successfully:', data);
                    navigateTo('login');
                })
                .catch(error => {
                    alert('Erreur dans le formulaire');
                });
        } else {
            alert('Passwords do not match!');
        }
    });

    document.getElementById('editUserModal').addEventListener('submit', function (event) {
        event.preventDefault();

        const selectedTwoFactorMethod = document.getElementById('twoFactorMethod').value;
        const selectedLanguage = document.getElementById('language').value;
        const newEmail = document.getElementById('newEmail').value
        const newUsername = document.getElementById('newUsername').value
        const newFirstname = document.getElementById('newFirstname').value
        const currentPassword = document.getElementById('currentPassword').value
        const newPassword = document.getElementById('newPassword').value

        fetch('/api/user/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify({
                // username: localStorage.getItem('username'),
                username: newUsername,
                twoFactorMethod: selectedTwoFactorMethod,
                language: selectedLanguage, // Include the selected language in the request
                email: newEmail,
                firstname: newFirstname,
                oldPassword: currentPassword,
                newPassword: newPassword
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(() => {
                alert(`Preferences updated. 2FA method: ${selectedTwoFactorMethod.toUpperCase()}, Language: ${selectedLanguage}`);
                loadTranslations(selectedLanguage); // Load the new language translations
                navigateTo('welcome');
            })
            .catch(error => {
                // console.error('Error updating 2FA preference:', error);
                alert('Error updating 2FA preference. Please try again.');
            });
    });

    // Define the applyTranslations function
    function applyTranslations(translations) {
        document.querySelectorAll('[data-key]').forEach(elem => {
            const key = elem.getAttribute('data-key');
            if (translations[key]) {
                elem.textContent = translations[key];
            }
        });
    }

    // Define the loadTranslations function
    async function loadTranslations(language) {
        try {
            const response = await fetch(`locales/${language}.json`);
            const translations = await response.json();
            // updateUserLanguage(language);
            return applyTranslations(translations);
        } catch (error) {
            return console.error('Error loading translations:', error);
        }
    }

    function updateUserLanguage(language) {
        fetch('/api/update_language/', {  // Assurez-vous que l'URL est correcte
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify({
                language: language
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(() => {
                console.log(`Language updated to: ${language}`);
                loadTranslations(language);
                localStorage.setItem('language', language)
                // Optionnel : recharger la page ou mettre à jour l'interface utilisateur pour refléter le changement de langue
            })
            .catch(error => {
                alert('Error updating language preference');
            });
    }

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
        navigateTo('tournamentBracket');
    
    
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
}


// Écouteur d'événements pour le chargement du document
document.addEventListener('DOMContentLoaded', function () {
    navigateTo(window.location.pathname);
});


// Écouteur d'événements pour les changements d'état de navigation
window.onpopstate = function () {
    render(); // Rendu en réponse aux actions de navigation (boutons précédent/suivant)
};

// window.onload = function () {
//     const path = window.location.pathname.substring(1);
//     if (path) {
//         navigateTo(path);
//     } else {
//         navigateTo('/home');
//     }
// };

// async function isValidToken() {
//     try {
//         const response = await fetch('/api/verify_token/', {
//             method: 'POST',
//             headers: {
//                 'Authorization': `Bearer ${localStorage.getItem('access_token')}`
//             }
//         });
//         if (response.ok) {
//             return true;
//         } else {
//             localStorage.removeItem('access_token'); // Optionnel : supprimez le token invalide
//             return false;
//         }
//     } catch (error) {
//         console.error('Erreur lors de la vérification du token:', error);
//         return false;
//     }
// }



function openSearchResultsModal() {
    var myModal = new bootstrap.Modal(document.getElementById('searchResultsModal'));
    myModal.show();
}

function closeSearchResultsModal() {
    var myModal = bootstrap.Modal.getInstance(document.getElementById('searchResultsModal'));
    myModal.hide();
    var backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.remove();
    }
}

function openEditModal() {
    var myModal = new bootstrap.Modal(document.getElementById('editUserModal'));
    myModal.show();
}

function closeEditModal() {
    var myModal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
    myModal.hide();
    var backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.remove();
    }
}

function openTournamentModal() {
    var myModal = new bootstrap.Modal(document.getElementById('createTournamentModal'));
    myModal.show();
}

function closeTournamentModal() {
    var myModal = bootstrap.Modal.getInstance(document.getElementById('createTournamentModal'));
    myModal.hide();
    var backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.remove();
    }
}

function openFriendsModal() {
    loadFriendsList();
    var myModal = new bootstrap.Modal(document.getElementById('friendsModal'));
    myModal.show();
}

function closeFriendstModal() {
    var myModal = bootstrap.Modal.getInstance(document.getElementById('friendsModal'));
    myModal.hide();
    var backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.remove();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname;

    console.log('La page actuelle est :', currentPage);

    if (localStorage.getItem('access_token')) {
        document.getElementById('hiddenNav').classList.remove('hidden');
    }
    if (currentPage === '/welcome') {
        const username = localStorage.getItem('username');
        document.getElementById('user-name-welcome').textContent = username || 'Utilisateur';
    }
});

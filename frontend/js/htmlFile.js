export function homeComponent() {
    return `
        <div id="home-section">
            <div class="position-absolute top-75 start-50 translate-middle">
                <button class="btn btn-outline-secondary" onclick="navigateTo('/login')">Login</button>
                <button class="btn btn-outline-secondary spaced-buttons" onclick="navigateTo('/register')">Créer un compte</button>
            </div>
        </div>
    `;
}

export function loginComponent() {
    return `
        <div id="login-section" class="text-center">
            <h2 style="color: #ffffff;">Login</h2>
            <form id="loginForm">
                <div class="form-group">
                    <label for="login-username" class="form-label">Nom d'utilisateur</label>
                    <input type="text" class="form-control" id="login-username" required>
                    <label for="login-password" class="form-label">Mot de passe</label>
                    <input type="password" class="form-control" id="login-password" required>
                    <button class="btn btn-outline-secondary">Se connecter</button>
                </div>
            </form>
        </div>
    `;
}

export function registerComponent() {
    return `
        <div id="register-section" class="text-center hidden">
            <h2 style="color: #ffffff;">Créer un compte</h2>
            <form id="registerForm" enctype="multipart/form-data">
                <div class="form-group">
                    <label for="username">Nom d'utilisateur</label>
                    <input type="text" class="form-control" id="username" required>
                    <label for="firstname" class="form-label">Prénom</label>
                    <input type="text" class="form-control" id="firstname" required>
                    <label for="lastname">Nom</label>
                    <input type="text" class="form-control" id="lastname" required>
                    <label for="email">Email</label>
                    <input type="email" class="form-control" id="email" required>
                    <label for="password">Mot de passe</label>
                    <input type="password" class="form-control" id="password" required>
                    <label for="retypePassword">Retaper le mot de passe</label>
                    <input type="password" class="form-control" id="retypePassword" required>
                    <label for="avatar">Avatar</label>
                    <input type="file" class="form-control" id="avatar" accept="image/jpeg, image/png">
                    <small class="form-text text-muted">Laissez ce champ vide pour utiliser l'avatar par
                        défaut.</small>
                </div>
                <button type="submit" class="btn btn-outline-secondary">Créer</button>
            </form>
        </div>
    `;
}

export function welcomeComponent() {
    return `
        <div id="welcome-section" class="text-center hidden">
            <h2 data-key="welcome">Bienvenue sur Mon Site</h2>
            <img id="user-avatar" alt="User Avatar" style="width: 100px; height: 100px;">
            <p>Bienvenue, <span id="user-name-welcome"></span>!</p>
            <button class="btn btn-outline-secondary" onclick="showGameForm()">Game</button>
            <!-- <button class="btn btn-outline-secondary" onclick="openFriendsModal()">Amis</button> -->
            <div id="pending-requests-container"></div>
        </div>
    `;
}

export function emailTwoFactor() {
    return `
        <div id="emailTwoFactor-section">
            <h2>Two-Factor Authentication</h2>
            <form id="EmailTwoFactorForm">
                <div class="form-group">
                    <label for="twoFactorCode">2FA Code</label>
                    <input type="text" class="form-control" id="twoFactorCode" required>
                </div>
                <button type="submit" class="btn btn-outline-secondary">Verify</button>
            </form>
        </div>
    `;
}

export function qrTwoFactor() {
    return `
        <div id="qrTwoFactor-section" class="hidden">
            <h2>QR Two-Factor Authentication</h2>
            <p>Scan the QR Code with your 2FA app and enter the code below.</p>
            <img id="qr-code-img" src="" alt="QR Code" class="mb-3">
            <form id="qrTwoFactorForm">
                <div class="form-group">
                    <label for="qrTwoFactorCode">2FA Code</label>
                    <input type="text" class="form-control" id="qrTwoFactorCode" required>
                </div>
                <button type="submit" class="btn btn-outline-secondary">Verify</button>
            </form>
        </div>
    `;
}

export function gameComponent() {
    return `
        <div id="game-section" class="text-center hidden">
            <h2>Bienvenue sur la page de jeu</h2>
            <p>Bienvenue, <span id="user-name-game"></span>!</p>
            <button class="btn btn-outline-secondary" onclick="playPong()">practice playing Pong</button>
            <button class="btn btn-outline-secondary" onclick="joinGameQueue()">Rejoindre la partie</button>
            <button class="btn btn-outline-secondary" onclick="goTournament()">tournois</button>
        </div>
    `;
}

export function pongComponent() {
    return `
        <div id="pong-section" class="text-center hidden">
            <h2>Pong 3D</h2>
            <button class="btn btn-outline-secondary" onclick="quitPong3D()">Quitter</button>
            <canvas id="pong-canvas"></canvas>
        </div>
    `;
}

export function tournamentComponent() {
    return `
        <div id="tournament-section" class="text-center hidden">
            <h2>Tournois Pong</h2>
            <button class="btn btn-outline-secondary" onclick="openTournamentModal()">Créer tournoi</button>
            <div class="container">
                <h1>Tournois disponibles</h1>

                <div class="my-3">
                    <button class="btn btn-primary" onclick="loadAvailableTournaments()">Charger les tournois
                        disponibles</button>
                </div>

                <div class="my-3">
                    <button class="btn btn-info" onclick="sortTournaments('name', this)">
                        Trier par nom <span class="sort-indicator">&#9650;</span>
                    </button>
                    <button class="btn btn-info" onclick="sortTournaments('date', this)">
                        Trier par date <span class="sort-indicator">&#9650;</span>
                        </button>
                        <button class="btn btn-info" onclick="sortTournaments('participants', this)">
                            Trier par nombre de participants <span class="sort-indicator">&#9650;</span>
                        </button>
                </div>

                <div id="available-tournaments" class="tournament-list">
                    <!-- Les boutons de tournois seront ajoutés ici -->
                </div>
            </div>
        </div>
    `;
}

export function tournamentBracketComponent() {
    return `
        <div id="tournamentBracket-section" class="container hidden">
            <h2 id="tournamentName" class="text-center tournament-title">Nom du Tournoi</h2>

            <div class="row my-4 tournament-row">
                <div class="col d-flex flex-column semi-finals">
                    <h3>Demi-finales</h3>
                    <div id="semi-finals" class="matches-container"></div>
                </div>

                <div class="col d-flex flex-column justify-content-center final">
                    <h3>Finale</h3>
                    <div id="final" class="matches-container"></div>
                </div>

                <div class="col d-flex flex-column justify-content-center winner">
                    <h3>Vainqueur</h3>
                    <div id="winner" class="matches-container"></div>
                </div>
            </div>
        </div>
    `;
}
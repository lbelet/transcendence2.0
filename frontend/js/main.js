// Navigation Functions
function showLoginForm() {
    navigateTo('login');
}

function showRegisterForm() {
    navigateTo('register');
}

function showGameForm() {
    navigateTo('game');
}

function showEditUserForm() {
    navigateTo('edit-user');
}

function showTwoFactorForm() {
    navigateTo('two-factor');
}

function showWelcome() {
    const username = localStorage.getItem('username');
    document.getElementById('user-name').textContent = username || 'Utilisateur';
    navigateTo('welcome');
}

// Utility Functions
function hideAllSections() {
    document.getElementById('home-section').classList.add('hidden');
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('register-section').classList.add('hidden');
    document.getElementById('welcome-section').classList.add('hidden');
    document.getElementById('game-section').classList.add('hidden');
    document.getElementById('edit-user-section').classList.add('hidden'); // Add this line 
    document.getElementById('two-factor-section').classList.add('hidden');
}

function navigateTo(sectionId) {
    console.log("Navigating to:", sectionId);
    hideAllSections();
    document.getElementById(sectionId + '-section').classList.remove('hidden');

    if (window.location.hash !== `#${sectionId}`) {
        console.log("Already in the section:", sectionId);
        window.history.pushState({ section: sectionId }, '', `#${sectionId}`);
    }
}

// Event Listeners
document.getElementById('registerForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const firstName = document.getElementById('firstname').value;
    const lastName = document.getElementById('lastname').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const retypePassword = document.getElementById('retypePassword').value;

    if (password === retypePassword) {
        axios.post('/api/register/', {
            username: username,
            first_name: firstName,
            last_name: lastName,
            email: email,
            password: password,
        })
            .then(function (response) {
                console.log('Registered successfully:', response.data);
                navigateTo('login');
            })
            .catch(function (error) {
                console.error('Registration error:', error);
            });
    } else {
        alert('Passwords do not match!');
    }
});

document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    axios.post('/api/api_login/', {
        username: username,
        password: password,
    })
        .then(function (response) {
            if (response.data['2fa_required']) {
                localStorage.setItem('username', username);
                showTwoFactorForm();
            } else {
                console.log('Login successful:', response.data);
                localStorage.setItem('access_token', response.data.access);
                localStorage.setItem('refresh_token', response.data.refresh);
                showWelcome();
            }
        })
        .catch(function (error) {
            console.error('Login error:', error);
        });
});

document.getElementById('editUserForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const isTwoFactorEnabled = document.getElementById('toggle-2fa').checked;

    axios.post('/api/user/update', {
        isTwoFactorEnabled: isTwoFactorEnabled,
    }, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
    }).then(response => {
        alert('Profile updated successfully!');
        navigateTo('welcome');
    }).catch(error => {
        console.error('Error updating profile:', error);
        alert('Error updating profile. Please try again.');
    });
});

document.getElementById('twoFactorForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const twoFactorCode = document.getElementById('twoFactorCode').value;
    const username = localStorage.getItem('username'); // Ensure the username is stored during the initial login attempt

    axios.post('/api/verify_two_factor_code/', {
        username: username,
        two_factor_code: twoFactorCode,
    })
        .then(function (response) {
            console.log('2FA Verification successful:', response.data);
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            showWelcome();
        })
        .catch(function (error) {
            console.error('2FA Verification error:', error);
            alert('Invalid 2FA code. Please try again.');
        });
});

// Token Management
function refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
        console.log('No refresh token available');
        return;
    }

    axios.post('/api/token/refresh/', {
        refresh: refreshToken
    })
        .then(function (response) {
            console.log('Token refreshed successfully');
            localStorage.setItem('access_token', response.data.access);
        })
        .catch(function (error) {
            console.error('Error refreshing token:', error);
        });
}

function verifyToken() {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
        console.log('No access token available');
        return;
    }

    axios.post('/api/token/verify/', {
        token: accessToken
    })
        .then(function (response) {
            console.log('Token is valid');
        })
        .catch(function (error) {
            console.error('Invalid token:', error);
        });
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');

    navigateTo('login');
}

// Page Initialization
window.onload = function () {
    const path = window.location.hash.substring(1);
    if (path) {
        navigateTo(path);
    } else {
        navigateTo('home');
    }
};

window.onpopstate = function (event) {
    console.log("Popstate event:", event.state);
    if (event.state && event.state.section) {
        navigateTo(event.state.section);
    } else {
        navigateTo('home');
    }
};

// Add this line to initialize the edit user form when the edit user page is loaded
if (window.location.hash === '#edit-user') {
    showEditUserForm();
}
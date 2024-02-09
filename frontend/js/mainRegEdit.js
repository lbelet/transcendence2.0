document.getElementById('avatar1').addEventListener('change', function (event) {
    var file = event.target.files[0];
    if (file) {
        var validTypes = ['image/jpeg', 'image/png'];
        var maxSize = 1048576; 

        if (!validTypes.includes(file.type)) {
            alert('Avatar : Seuls les fichiers JPEG et PNG sont autorisés et 1Mo max.');
            event.target.value = ''; 
            return; 
        }

        if (file.size > maxSize) {
            alert('Avatar : La taille du fichier doit être inférieure à 1 Mo.');
            event.target.value = '';
            return; 
        }
    }
});

document.getElementById('avatar2').addEventListener('change', function (event) {
    var file = event.target.files[0];
    if (file) {
        var validTypes = ['image/jpeg', 'image/png'];
        var maxSize = 1048576;

        if (!validTypes.includes(file.type)) {
            alert('Avatar : Seuls les fichiers JPEG et PNG sont autorisés et 1Mo max.');
            event.target.value = ''; 
            return; 
        }

        if (file.size > maxSize) {
            alert('Avatar : La taille du fichier doit être inférieure à 1 Mo.');
            event.target.value = ''; 
            return;
        }
    }
});

document.getElementById('registerForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const errorMessageElement = document.getElementById('UserCreationErrorMessage');
	errorMessageElement.style.display = 'none';

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;

    fetch(`/api/check_user_exists/?username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}`)
        .then(response => response.json())
        .then(data => {
            if (data.exists) {
                let message;
                switch (data.type) {
                    case 'username':
                        message = 'Un utilisateur avec ce nom d’utilisateur existe déjà.';
                        break;
                    case 'email':
                        message = 'Un utilisateur avec cette adresse e-mail existe déjà.';
                        break;
                    default:
                        message = 'Un utilisateur avec ces informations existe déjà.';
                }
                displayErrorMessageUser(message);
            } else {
                let formData = new FormData();
                formData.append('username', username);
                formData.append('first_name', document.getElementById('firstname').value);
                formData.append('last_name', document.getElementById('lastname').value);
                formData.append('email', email);
                formData.append('password', document.getElementById('password').value);

                let avatarFile = document.getElementById('avatar1').files[0];
                if (avatarFile) {
                    formData.append('avatar', avatarFile);
                }

                if (document.getElementById('password').value === document.getElementById('retypePassword').value) {
                    const csrfToken = getCSRFToken();

                    fetch('/api/register/', {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'X-CSRFToken': csrfToken,
                        }
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(data => {
                        navigateTo('login');
                    })
                    .catch(error => {
                    });
                } else {
                    alert('Les mots de passe ne correspondent pas !');
                }
            }
        })
        .catch(error => {
        });
});




document.getElementById('editUserModal').addEventListener('submit', function (event) {
    event.preventDefault();

    const formData = new FormData();

    const errorMessageElement = document.getElementById('UserEditErrorMessage');
    errorMessageElement.style.display = 'none';

    formData.append('twoFactorMethod', document.getElementById('twoFactorMethod').value);
    formData.append('language', document.getElementById('language').value);
    formData.append('email', document.getElementById('newEmail').value);
    formData.append('username', document.getElementById('newUsername').value);
    formData.append('firstname', document.getElementById('newFirstname').value);
    formData.append('oldPassword', document.getElementById('currentPassword').value);
    formData.append('newPassword', document.getElementById('newPassword').value);

    const avatarFile = document.getElementById('avatar2').files[0];
    if (avatarFile) {
        formData.append('avatar', avatarFile);
    }
    const csrfToken = getCSRFToken();

    fetch('/api/user/update', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'X-CSRFToken': csrfToken,
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.message)
            displayErrorMessageEditUser(data.message)
        else{
            loadTranslations(data.language);
            localStorage.setItem('language', data.language)
        }
    })
    .catch(error => {
        displayErrorMessageEditUser(data.message)
    });
});


function applyTranslations(translations) {
    document.querySelectorAll('[data-key]').forEach(elem => {
        const key = elem.getAttribute('data-key');
        if (translations[key]) {
            elem.textContent = translations[key];
        }
    });
  return true;
}

async function loadTranslations(language) {
    try {
        const response = await fetch(`locales/${language}.json`);
        const translations = await response.json();
        return applyTranslations(translations);
    } catch (error) {
        return console.error('Error loading translations:', error);
    }
}

function updateUserLanguage(language) {
    const csrfToken = getCSRFToken();

    fetch('/api/update_language/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'X-CSRFToken': csrfToken
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
            loadTranslations(language);
            localStorage.setItem('language', language)
        })
        .catch(error => {
        });
}

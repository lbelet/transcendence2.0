document.getElementById('avatar1').addEventListener('change', function (event) {
    var file = event.target.files[0];
    if (file) {
        var validTypes = ['image/jpeg', 'image/png'];
        var maxSize = 1048576; // 1MB in bytes

        // Check if the file type is valid
        if (!validTypes.includes(file.type)) {
            alert('Avatar1 : Seuls les fichiers JPEG et PNG sont autorisés et 1Mo max.');
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

document.getElementById('avatar2').addEventListener('change', function (event) {
    var file = event.target.files[0];
    if (file) {
        var validTypes = ['image/jpeg', 'image/png'];
        var maxSize = 1048576; // 1MB in bytes

        // Check if the file type is valid
        if (!validTypes.includes(file.type)) {
            alert('Avatar2 : Seuls les fichiers JPEG et PNG sont autorisés et 1Mo max.');
            event.target.value = ''; // Clear the file input
            return; // Exit the function
        }

        // Check if the file size exceeds the maximum size
        if (file.size > maxSize) {
            alert('Avatar2 : La taille du fichier doit être inférieure à 1 Mo.');
            event.target.value = ''; // Clear the file input
            return; // Exit the function
        }
    }
});

document.getElementById('registerForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const errorMessageElement = document.getElementById('UserCreationErrorMessage');
	errorMessageElement.style.display = 'none';

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;

    // Première vérification : existence de l'utilisateur
    fetch(`/api/check_user_exists/?username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}`)
        .then(response => response.json())
        .then(data => {
            if (data.exists) {
                let message;
                // Ajuster le message d'erreur en fonction du type retourné
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
                // Utilisateur n'existe pas, procéder à l'enregistrement
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
                        console.log('Registered successfully:', data);
                        navigateTo('login'); // Assurez-vous que cette fonction navigue correctement
                    })
                    .catch(error => {
                        // Gérer l'erreur spécifique de l'enregistrement
                        alert(error.error || 'Erreur inattendue lors de l’enregistrement. Veuillez réessayer.');
                    });
                } else {
                    alert('Les mots de passe ne correspondent pas !');
                }
            }
        })
        .catch(error => {
            // Gérer les erreurs de la vérification de l'existence de l'utilisateur
            console.error('Error during user existence check:', error);
            alert('Erreur lors de la vérification de l’existence de l’utilisateur.');
        });
});




document.getElementById('editUserModal').addEventListener('submit', function (event) {
    event.preventDefault();

    const formData = new FormData();

    const errorMessageElement = document.getElementById('UserEditErrorMessage');
    errorMessageElement.style.display = 'none';

    // Ajouter les données du formulaire à l'objet FormData
    formData.append('twoFactorMethod', document.getElementById('twoFactorMethod').value);
    formData.append('language', document.getElementById('language').value);
    formData.append('email', document.getElementById('newEmail').value);
    formData.append('username', document.getElementById('newUsername').value);
    formData.append('firstname', document.getElementById('newFirstname').value);
    formData.append('oldPassword', document.getElementById('currentPassword').value);
    formData.append('newPassword', document.getElementById('newPassword').value);

    // Ajouter l'avatar s'il est présent
    const avatarFile = document.getElementById('avatar2').files[0]; // Assurez-vous que l'ID correspond à votre champ de fichier d'avatar
    if (avatarFile) {
        formData.append('avatar', avatarFile);
    }
    const csrfToken = getCSRFToken();

    fetch('/api/user/update', {
        method: 'POST',
        headers: {
            // Ne définissez pas Content-Type pour multipart/form-data; le navigateur le fera automatiquement, incluant le boundary.
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'X-CSRFToken': csrfToken,
            // 'Content-Type': 'application/json'
        },
        body: formData // Utilisez l'objet FormData comme corps de la requête
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        // Si la réponse est OK, traitez-la normalement
        return response.json();
    })
    .then(data => {
        console.log('data dans edit user: ', data)
        if (data.message)
            displayErrorMessageEditUser(data.message)
        else
            alert('Préférences mises à jour.');
        // Vous pouvez traiter les données de réponse en cas de succès ici
    })
    .catch(error => {
        displayErrorMessageEditUser(data.message)
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
  return true;
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
    const csrfToken = getCSRFToken();

    fetch('/api/update_language/', {  // Assurez-vous que l'URL est correcte
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
            console.log(`Language updated to: ${language}`);
            loadTranslations(language);
            localStorage.setItem('language', language)
            // Optionnel : recharger la page ou mettre à jour l'interface utilisateur pour refléter le changement de langue
        })
        .catch(error => {
            alert('Error updating language preference');
        });
}

// function updateEmail() {
//     const newEmail = document.getElementById('newEmail').value;
//     // Ajoutez ici le code pour envoyer cette nouvelle adresse e-mail à votre serveur
//     console.log("Mise à jour de l'email avec:", newEmail);

//     // Vous pouvez utiliser AJAX, fetch API, ou une autre méthode
//     // Exemple avec fetch:
//     fetch('/api/update_email', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${localStorage.getItem('access_token')}`
//         },
//         body: JSON.stringify({ email: newEmail })
//     })
//     .then(response => response.json())
//     .then(data => {
//         console.log("Réponse du serveur:", data);
//         // Mise à jour de l'affichage ou traitement des erreurs
//     })
//     .catch(error => {
//         console.error('Erreur lors de la mise à jour de l\'email:', error);
//     });
// }

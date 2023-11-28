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
                console.error('Registration error:', error);
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
            firstname: newFirstname
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
            console.error('Error updating 2FA preference:', error);
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
        // Optionnel : recharger la page ou mettre à jour l'interface utilisateur pour refléter le changement de langue
    })
    .catch(error => {
        console.error('Error updating language preference:', error);
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


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


document.getElementById('editUserForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const selectedTwoFactorMethod = document.getElementById('twoFactorMethod').value;
    const selectedLanguage = document.getElementById('language').value;

    fetch('/api/user/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
            username: localStorage.getItem('username'),
            twoFactorMethod: selectedTwoFactorMethod,
            language: selectedLanguage // Include the selected language in the request
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
        return applyTranslations(translations);
    } catch (error) {
        return console.error('Error loading translations:', error);
    }
}

// Additional code to load the default or previously selected language on page load
// document.addEventListener('DOMContentLoaded', () => {
//     const savedLanguage = localStorage.getItem('language') || 'fr'; // Default to french if no preference is saved
//     console.log("saved language: ", localStorage.getItem('language'))
//     loadTranslations(savedLanguage);
// });
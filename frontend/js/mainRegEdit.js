// document.getElementById('avatar').addEventListener('change', function (event) {
//     var file = event.target.files[0];
//     if (file) {
//         var validTypes = ['image/jpeg', 'image/png'];
//         var maxSize = 1048576; // 1MB in bytes

//         // Check if the file type is valid
//         if (!validTypes.includes(file.type)) {
//             alert('Avatar1 : Seuls les fichiers JPEG et PNG sont autorisés.');
//             event.target.value = ''; // Clear the file input
//             return; // Exit the function
//         }

//         // Check if the file size exceeds the maximum size
//         if (file.size > maxSize) {
//             alert('Avatar1 : La taille du fichier doit être inférieure à 1 Mo.');
//             event.target.value = ''; // Clear the file input
//             return; // Exit the function
//         }
//     }
// });

// document.getElementById('registerForm').addEventListener('submit', function (event) {
//     event.preventDefault();

//     let formData = new FormData();
//     formData.append('username', document.getElementById('username').value);
//     formData.append('first_name', document.getElementById('firstname').value);
//     formData.append('last_name', document.getElementById('lastname').value);
//     formData.append('email', document.getElementById('email').value);
//     formData.append('password', document.getElementById('password').value);

//     let avatarFile = document.getElementById('avatar').files[0];
//     if (avatarFile) {
//         formData.append('avatar', avatarFile);
//     }

//     if (document.getElementById('password').value === document.getElementById('retypePassword').value) {
//         fetch('/api/register/', {
//             method: 'POST',
//             body: formData
//             // Pas d'en-tête 'Content-Type' ici car il est automatiquement défini avec FormData
//         })
//             .then(response => {
//                 if (!response.ok) {
//                     throw new Error('Network response was not ok');
//                 }
//                 return response.json();
//             })
//             .then(data => {
//                 console.log('Registered successfully:', data);
//                 navigateTo('login');
//             })
//             .catch(error => {
//                 alert('Erreur dans le formulaire');
//             });
//     } else {
//         alert('Passwords do not match!');
//     }
// });

// document.getElementById('editUserModal').addEventListener('submit', function (event) {
//     event.preventDefault();

//     const selectedTwoFactorMethod = document.getElementById('twoFactorMethod').value;
//     const selectedLanguage = document.getElementById('language').value;
//     const newEmail = document.getElementById('newEmail').value
//     const newUsername = document.getElementById('newUsername').value
//     const newFirstname = document.getElementById('newFirstname').value
//     const currentPassword = document.getElementById('currentPassword').value
//     const newPassword = document.getElementById('newPassword').value

//     fetch('/api/user/update', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${localStorage.getItem('access_token')}`
//         },
//         body: JSON.stringify({
//             // username: localStorage.getItem('username'),
//             username: newUsername,
//             twoFactorMethod: selectedTwoFactorMethod,
//             language: selectedLanguage, // Include the selected language in the request
//             email: newEmail,
//             firstname: newFirstname,
//             oldPassword: currentPassword,
//             newPassword: newPassword
//         })
//     })
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Network response was not ok');
//             }
//             return response.json();
//         })
//         .then(() => {
//             alert(`Preferences updated. 2FA method: ${selectedTwoFactorMethod.toUpperCase()}, Language: ${selectedLanguage}`);
//             loadTranslations(selectedLanguage); // Load the new language translations
//             navigateTo('welcome');
//         })
//         .catch(error => {
//             // console.error('Error updating 2FA preference:', error);
//             alert('Error updating 2FA preference. Please try again.');
//         });
// });

// // Define the applyTranslations function
// function applyTranslations(translations) {
//     document.querySelectorAll('[data-key]').forEach(elem => {
//         const key = elem.getAttribute('data-key');
//         if (translations[key]) {
//             elem.textContent = translations[key];
//         }
//     });
// }

// // Define the loadTranslations function
// async function loadTranslations(language) {
//     try {
//         const response = await fetch(`locales/${language}.json`);
//         const translations = await response.json();
//         // updateUserLanguage(language);
//         return applyTranslations(translations);
//     } catch (error) {
//         return console.error('Error loading translations:', error);
//     }
// }

// function updateUserLanguage(language) {
//     fetch('/api/update_language/', {  // Assurez-vous que l'URL est correcte
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${localStorage.getItem('access_token')}`
//         },
//         body: JSON.stringify({
//             language: language
//         })
//     })
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Network response was not ok');
//             }
//             return response.json();
//         })
//         .then(() => {
//             console.log(`Language updated to: ${language}`);
//             loadTranslations(language);
//             localStorage.setItem('language', language)
//             // Optionnel : recharger la page ou mettre à jour l'interface utilisateur pour refléter le changement de langue
//         })
//         .catch(error => {
//             alert('Error updating language preference');
//         });
// }

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


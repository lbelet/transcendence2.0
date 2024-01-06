// window.onload = function () {
//     const path = window.location.pathname.substring(1);
//     if (path) {
//         navigateWithTokenCheck(path);
//     } else {
//         navigateWithTokenCheck('home');
//     }
// };


// window.onpopstate = function (event) {
//     if (event.state && event.state.section) {
//         navigateWithTokenCheck(event.state.section);
//     } else {
//         navigateWithTokenCheck('home');
//     }
// };

// Fichier main.js

// Définition de la fonction render (et d'autres fonctions liées au routage)

// function render() {
//     const path = window.location.pathname;
//     const component = routes[path] || notFoundComponent; // Assurez-vous d'avoir défini toutes ces fonctions et le mappage des routes
//     document.getElementById('app').innerHTML = component();
// }

// // Écouteur d'événements pour le chargement du document
// document.addEventListener('DOMContentLoaded', function() {
//     render(); // Rendu initial basé sur l'URL courante
// });

// // Écouteur d'événements pour les changements d'état de navigation
// window.onpopstate = function() {
//     render(); // Rendu en réponse aux actions de navigation (boutons précédent/suivant)
// };


document.addEventListener('DOMContentLoaded', (event) => {
    setTimeout(function() {
        var buttonContainer = document.getElementById('delayed-button-container');
        buttonContainer.classList.remove('hidden');
    }, 1000);
});
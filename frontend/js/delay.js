document.addEventListener('DOMContentLoaded', (event) => {
    console.log(document.getElementById('delayed-button-container'));
    setTimeout(function() {
        var buttonContainer = document.getElementById('delayed-button-container');
        if (buttonContainer) {
            buttonContainer.classList.remove('hidden');
        }
    }, 3000);
});
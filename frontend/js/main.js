// Function to initialize the page based on the URL
window.onload = function () {
    const path = window.location.pathname.substring(1);
    if (path) {
        navigateTo(path);
    } else {
        navigateTo('home');
    }
};

// Handling browser back and forward navigation events
window.onpopstate = function (event) {
    // console.log("Popstate event:", event.state);
    if (event.state && event.state.section) {
        navigateTo(event.state.section);
    } else {
        navigateTo('home');
    }
};

window.onclick = function(event) {
    let modal = document.getElementById('editUserModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// Add this line to initialize the edit user form when the edit user page is loaded
// if (window.location.hash === '#edit-user') {
//     showEditUserForm();
// }


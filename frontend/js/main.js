window.onload = function () {
    const path = window.location.pathname.substring(1);
    if (path) {
        navigateTo(path);
    } else {
        navigateTo('home');
    }
};

window.onpopstate = function (event) {
    if (event.state && event.state.section) {
        navigateTo(event.state.section);
    } else {
        navigateTo('home');
    }
};
window.onload = function () {
    const path = window.location.pathname.substring(1);
    if (path) {
        navigateWithTokenCheck(path);
    } else {
        navigateWithTokenCheck('home');
    }
};


window.onpopstate = function (event) {
    if (event.state && event.state.section) {
        navigateWithTokenCheck(event.state.section);
    } else {
        navigateWithTokenCheck('home');
    }
};

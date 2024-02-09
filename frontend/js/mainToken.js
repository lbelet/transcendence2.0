
function refreshToken() {
    return new Promise((resolve, reject) => {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            console.log('No refresh token available');
            reject('No refresh token');
            return;
        }
        const csrfToken = getCSRFToken();

        fetch('/api/token/refresh/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({ refresh: refreshToken })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Token refreshed successfully');
            localStorage.setItem('access_token', data.access);
            resolve();
        })
        .catch(error => {
            reject(error);
        });
    });
}


let tokenRefreshInterval;

function setupTokenRefresh() {
    console.log("yo!")
    const refreshInterval = 1 * 60 * 1000; 
    tokenRefreshInterval  = setInterval(refreshToken, refreshInterval);
}

function stopTokenRefreshInterval() {
    clearInterval(tokenRefreshInterval);
}

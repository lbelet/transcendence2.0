
function refreshToken() {
    return new Promise((resolve, reject) => {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            console.log('No refresh token available');
            reject('No refresh token');
            return;
        }

        fetch('/api/token/refresh/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
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
            console.error('Error refreshing token', error);
            alert('Error refreshing token');
            reject(error);
        });
    });
}


let tokenRefreshInterval;

function setupTokenRefresh() {
    console.log("yo!")
    // Définir l'intervalle en millisecondes
    // Par exemple, pour rafraîchir le token toutes les 15 minutes
    const refreshInterval = 1 * 60 * 1000; 
    // Configurer setInterval pour appeler refreshToken à cet intervalle
    tokenRefreshInterval  = setInterval(refreshToken, refreshInterval);
}

function stopTokenRefreshInterval() {
    clearInterval(tokenRefreshInterval);
}


// Function to verify the token
// function verifyToken() {
//     const accessToken = localStorage.getItem('access_token');
//     if (!accessToken) {
//         console.log('No access token available');
//         return;
//     }
//     fetch('/api/token/verify/', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             token: accessToken
//         })
//     })
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Network response was not ok');
//             }
//             console.log('Token is valid');
//         })
//         .catch(error => {
//             alert('Invalid token');
//         });
// }
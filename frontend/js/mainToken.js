
function refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
        console.log('No refresh token available');
        return;
    }

    fetch('/api/token/refresh/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            refresh: refreshToken
        })
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
        })
        .catch(error => {
            alert('Error refreshing token');
        });
}

// Function to verify the token
function verifyToken() {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
        console.log('No access token available');
        return;
    }
    fetch('/api/token/verify/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            token: accessToken
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            console.log('Token is valid');
        })
        .catch(error => {
            alert('Invalid token');
        });
}
function redirectToAuthProvider() {
    fetch('/api/get-config/')
        .then(response => response.json())
        .then(config => {
            const authUrl = `${config.oauth_url}?response_type=code&client_id=${encodeURIComponent(config.client_id)}&redirect_uri=${encodeURIComponent(config.redirect_uri)}&scope=${encodeURIComponent(config.scope)}`;
            window.location.href = authUrl;
        })
        .catch(error => console.error('Error fetching configuration:', error));
}


function redirectToAuthProvider() {
    fetch('/api/get-config/')
        .then(response => response.json())
        .then(config => {
            const authUrl = `${config.oauth_url}?response_type=code&client_id=${encodeURIComponent(config.client_id)}&redirect_uri=${encodeURIComponent(config.redirect_uri)}&scope=${encodeURIComponent(config.scope)}`;
            window.location.href = authUrl;
        })
        .catch(error => console.error('Error fetching configuration:', error));
}

// function redirectTologin42() {
//     const baseUrl = 'OAUTH2_AUTH_URL'; // Base URL
//     const clientId = 'u-s4t2ud-03e103d82398c55ff30a2269a9195a560757d18fa4ebebc6d03c8ea6fb3e85d1';
//     const redirectUri = 'https://localhost/';
//     const scope = 'public projects profile elearning tig forum';

//     //dynamic construction of the url
//     const authUrl = `${baseUrl}?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
//     window.location.href = authUrl;
// }

// fetch('/api/get-config/')
//     .then(response => {
//         if (!response.ok) {
//             throw new Error('Network response was not ok');
//         }
//         if (!response.headers.get('content-type')?.includes('application/json')) {
//             throw new Error('Response not JSON');
//         }
//         return response.json();
//     })
//     .then(config => {
//         const clientId = config.client_id;
//         const redirectUri = config.redirect_uri;
//         const scope = config.scope;
//     })
//     .catch(error => console.error('Error fetching configuration:', error));


// fetch('/api/get-config/')
//     .then(response => response.json())
//     .then(config => {
//         const clientId = config.client_id;
//         const redirectUri = config.redirect_uri;
//         const scope = config.scope;

//         // Now you can use these variables for your OAuth flow
//     })
//     .catch(error => console.error('Error fetching configuration:', error));

// function redirectTologin42() {
//     fetch('/api/get-config/')
//         .then(response => {
//             console.log('Raw Response:', response); // Log the raw response

//             if (!response.ok) {
//                 throw new Error(`HTTP error! Status: ${response.status}`);
//             }

//             const contentType = response.headers.get('content-type');
//             if (!contentType || !contentType.includes('application/json')) {
//                 throw new Error('Not JSON response');
//             }

//             return response.json();
//         })
//         .then(config => {
//             console.log('JSON Response:', config); // Log the JSON response

//             const baseUrl = config.oauth_url; // This could also come from your config
//             const clientId = config.client_id;
//             const redirectUri = config.redirect_uri;
//             const scope = config.scope;

//             // Dynamic construction of the OAuth2 URL
//             const authUrl = `${baseUrl}?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
//             window.location.href = authUrl;
//         })
//         .catch(error => console.error('Error fetching configuration:', error));
// }



// function redirectTologin42() {
//     fetch('/api/get-config/')
//         .then(response => response.json())
//         .then(config => {
//             // Use the config data here
//             const baseUrl = 'OAUTH2_AUTH_URL'; // This could also come from your config
//             const clientId = config.client_id;
//             const redirectUri = config.redirect_uri;
//             const scope = config.scope;

//             // Dynamic construction of the OAuth2 URL
//             const authUrl = `${baseUrl}?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
//             window.location.href = authUrl;
//         })
//         .catch(error => console.error('Error fetching configuration:', error));
// }
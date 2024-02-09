window.onload = async function () {
    console.log("onload....");
    loadTranslations(localStorage.getItem('language') || 'fr')
    getCSRF_Token().then(csrf_Token => {
        console.log("CSRF Token:", csrf_Token);
    }).catch(error => {
        console.error('Error fetching CSRF token:', error);
    });

    if (localStorage.getItem('in1v1') == null)
        localStorage.setItem('in1v1', "no")
    localStorage.setItem('inGame', false)
    if (localStorage.getItem('access_token')) {
        try {
            await refreshToken();
            setupTokenRefresh();
            document.getElementById('hiddenNav').classList.remove('hidden');
        } catch (error) {
            console.error("Error during token refresh:", error);
            document.getElementById('hiddenNav').classList.add('hidden');
        }
    }
    const path = window.location.pathname.substring(1);
    if (path) {
        if ((path == 'waitingRoom' || path == 'pong') && localStorage.getItem('inGame') == true)
            navigateWithTokenCheck(path);
        else{
            navigateWithTokenCheck('home');
        }
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

document.addEventListener('DOMContentLoaded', function() {
    const userName = localStorage.getItem('username');
    if (userName) {
        document.getElementById('user-name-game').textContent = userName;
    }
    const avatar_url = localStorage.getItem('avatarURL')
    console.log('avatarURL: ', avatar_url)
    if (avatar_url) {
        document.getElementById('user-avatar').src = avatar_url;    
    }
});

window.updateUserUI = function() {
    const userName = localStorage.getItem('username');
    const avatarUrl = localStorage.getItem('avatarURL');

  if (userName) {
    console.log(document.getElementById('user-name-game'));
        document.getElementById('user-name-game').textContent = userName;
    }

    if (avatarUrl) {
        document.getElementById('user-avatar').src = avatarUrl;
    }
}

document.addEventListener('DOMContentLoaded', updateUserUI);

window.addEventListener('beforeunload', function (e) {
    if (localStorage.getItem('inGame') === 'true') {
        e.preventDefault();
        e.returnValue = '';
    }
});


document.addEventListener('DOMContentLoaded', function() {
    const joinGameButton = document.getElementById("rejoindreGame");
    updateButtonState(); 

    document.addEventListener('in1v1Changed', updateButtonState);

    function updateButtonState() {
        const in1v1 = localStorage.getItem('in1v1');
        joinGameButton.disabled = in1v1 === '2';
    }
});


async function getCSRF_Token() {
    try {
        const response = await fetch('/api/get_csrf_token/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.csrf_token;
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
        return null;
    }
}

document.dispatchEvent(new CustomEvent('in1v1Changed'));

function getCSRFToken() {
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        .split('=')[1];
    return cookieValue;
}

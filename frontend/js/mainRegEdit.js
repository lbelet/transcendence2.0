document.getElementById('registerForm').addEventListener('submit', function (event) {
    event.preventDefault();

    let formData = new FormData();
    formData.append('username', document.getElementById('username').value);
    formData.append('first_name', document.getElementById('firstname').value);
    formData.append('last_name', document.getElementById('lastname').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('password', document.getElementById('password').value);

    let avatarFile = document.getElementById('avatar').files[0];
    if (avatarFile) {
        formData.append('avatar', avatarFile);
    }

    if (document.getElementById('password').value === document.getElementById('retypePassword').value) {
        fetch('/api/register/', {
            method: 'POST',
            body: formData
            // Pas d'en-tête 'Content-Type' ici car il est automatiquement défini avec FormData
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Registered successfully:', data);
                navigateTo('login');
            })
            .catch(error => {
                console.error('Registration error:', error);
            });
    } else {
        alert('Passwords do not match!');
    }
});


document.getElementById('editUserForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const selectedTwoFactorMethod = document.getElementById('twoFactorMethod').value;

    fetch('/api/user/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
            username: localStorage.getItem('username'),
            twoFactorMethod: selectedTwoFactorMethod,
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(() => {
            alert(`2FA preference updated to ${selectedTwoFactorMethod.toUpperCase()}.`);
            navigateTo('welcome');
        })
        .catch(error => {
            console.error('Error updating 2FA preference:', error);
            alert('Error updating 2FA preference. Please try again.');
        });
});
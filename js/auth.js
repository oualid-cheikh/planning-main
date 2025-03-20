document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login').addEventListener('submit', async function (e) {
        e.preventDefault();
        const formData = new FormData(this);
        try {
            const response = await fetch('login.php', { method: 'POST', body: formData });
            const result = await response.json();
            if (result.status === 'success') {
                localStorage.setItem('userId', result.user_id);
                window.location.href = 'planning.html';
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur de connexion');
        }
    });

    document.getElementById('register').addEventListener('submit', async function (e) {
        e.preventDefault();
        if (this.password.value !== this.confirm_password.value) {
            alert('Les mots de passe ne correspondent pas');
            return;
        }
        const formData = new FormData(this);
        try {
            const response = await fetch('register.php', { method: 'POST', body: formData });
            const result = await response.json();
            if (result.status === 'success') {
                alert('Inscription réussie !');
                showLogin();
                this.reset();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur d\'inscription');
        }
    });
});

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function showLogin() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}
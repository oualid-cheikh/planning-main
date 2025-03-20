// auth-bridge.js
// Ce fichier sert d'intermédiaire pour cacher le userId dans le localStorage
// tout en maintenant la compatibilité avec le code existant

// Fonction pour récupérer le userId décodé à partir du userToken
function getUserId() {
    const encodedUserId = localStorage.getItem('userToken');
    if (encodedUserId) {
        try {
            // Décoder le token et extraire uniquement le userId (avant le séparateur |)
            const decodedString = atob(encodedUserId);
            // Le userId est la partie avant le séparateur |
            return decodedString.split('|')[0];
        } catch (e) {
            console.error('Erreur de décodage du userToken', e);
            return null;
        }
    }
    return null;
}

// Remplacer la fonction getItem du localStorage pour intercepter les demandes de userId
const originalGetItem = Storage.prototype.getItem;
Storage.prototype.getItem = function(key) {
    if (key === 'userId') {
        return getUserId();
    }
    return originalGetItem.call(this, key);
};

// Remplacer la fonction setItem du localStorage pour intercepter les tentatives de modification du userId
const originalSetItem = Storage.prototype.setItem;
Storage.prototype.setItem = function(key, value) {
    if (key === 'userId') {
        // Générer un nouveau sel aléatoire
        const salt = Math.random().toString(36).substring(2, 15);
        // Encoder le userId avec le sel pour qu'il change
        const encodedUserId = btoa(value + '|' + salt);
        return originalSetItem.call(this, 'userToken', encodedUserId);
    }
    return originalSetItem.call(this, key, value);
};

// Vérifier si l'utilisateur est connecté au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    const userId = getUserId();
    if (!userId) {
        // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
        window.location.href = 'index.html';
    } else {
        // Rediriger vers la page de planning si l'utilisateur est connecté
        window.location.href = 'planning.html';
    }
});

// Fonction de déconnexion
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userToken');
    // Ne pas supprimer 'userId' car il n'existe plus
    window.location.href = 'index.html';
}

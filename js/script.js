const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi'];
// Variable globale pour stocker les horaires par planning
let planningHours = {};
let planningData = {};

document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    if (!userId) window.location.href = 'index.html';
    else {
        loadCountries(); // Charge la liste des pays
        loadPlannings(userId); // Charge les plannings de l'utilisateur
        checkUserRole(userId); // Vérifie le rôle de l'utilisateur
    }
});

// Ajout d'un gestionnaire pour sauvegarder avant de quitter la page
window.addEventListener('beforeunload', () => {
    if (Object.keys(planningData).length > 0) {
        savePlanningData();
    }
});

// Permer de choisir tout les pays

async function loadPlannings(userId) {
    try {
        const response = await fetch(`load_plannings.php?user_id=${userId}`);
        const result = await response.json();
        if (result.status === 'success') {
            result.plannings.forEach(planning => {
                planningData[planning.id] = JSON.parse(planning.data);
                
                // Récupérer les horaires personnalisés ou utiliser les horaires par défaut
                try {
                    planningHours[planning.id] = planning.hours ? JSON.parse(planning.hours) : ['10h', '13h', '16h', '19h'];
                } catch (e) {
                    console.error('Erreur lors du parsing des horaires:', e);
                    planningHours[planning.id] = ['10h', '13h', '16h', '19h'];
                }
                
                addPlanningToDOM(planning.name, planning.id, planningData[planning.id], planningHours[planning.id]);
                addPlanningToSelect(planning.id, planning.name);
            });
        } else console.error('Erreur de chargement :', result.message);
    } catch (error) {
        console.error('Erreur :', error);
    }
}

// async function loadCountries() {
//     const response = await fetch('https://restcountries.com/v3.1/all');
//     const countries = await response.json();
//     const countrySelect = document.getElementById('countrySelect');
//     countries.sort((a, b) => a.name.common.localeCompare(b.name.common)).forEach(country => {
//         const option = document.createElement('option');
//         option.value = country.cca2; // Code ISO 3166-1 alpha-2
//         option.textContent = country.name.common;
//         countrySelect.appendChild(option);
//     });
// }7

async function loadCountries() {
    const countrySelect = document.getElementById('countrySelect');
    const option = document.createElement('option');
    option.value = 'FR'; // Code ISO 3166-1 alpha-2 pour la France
    option.textContent = 'France';
    countrySelect.appendChild(option);
}


function addPlanningToDOM(name, id, data, hours) {
    const planningDiv = document.createElement('div');
    planningDiv.className = 'planning';
    planningDiv.setAttribute('data-planning-id', id);
    planningDiv.innerHTML = `
        <div class="planning-header">
                    <button class="delete-btn" onclick="removePlanning(${id})"><i class="fas fa-trash"></i></button>
            <h3 class="planning-name">${name}</h3>
        </div>
        <table>
            <thead>
                <tr><th></th>${days.map(day => `<th>${day}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${hours.map(hour => `
                    <tr>
                        <td>${hour}</td>
                        ${days.map(day => {
                            const cellData = data[day]?.[hour];
                            const displayText = cellData ? `${cellData.cp} - ${cellData.city || ''}` : '-';
                            return `
                                <td onclick="handlePostalCode(this, '${day}', '${hour}', ${id})">
                                    <div class="cp">${displayText}</div>
                                </td>
                            `;
                        }).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    document.getElementById('planningContainer').appendChild(planningDiv);
    updatePlanningSelect(); // Mettre à jour le sélecteur de planning
}

async function removePlanning(planningId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce planning ?')) {
        return;
    }
    try {
        const response = await fetch('delete_planning.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planning_id: planningId })
        });
        const result = await response.json();
        if (result.status === 'success') {
            document.querySelector(`[data-planning-id="${planningId}"]`)?.remove();
            delete planningData[planningId];
            delete planningHours[planningId];
            updatePlanningSelect(); // Mettre à jour le sélecteur de planning
        } else console.error('Erreur de suppression :', result.message);
    } catch (error) {
        console.error('Erreur :', error);
    }
}

function showPlanningNameModal() {
    return new Promise((resolve) => {
        const modal = document.getElementById('planningNameModal');
        const input = document.getElementById('planningName');
        
        // Réinitialiser l'input
        input.value = '';
        
        // Afficher la modale
        modal.style.display = 'block';
        input.focus();

        // Gérer la soumission par la touche Entrée
        input.onkeypress = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const name = input.value.trim();
                if (name) {
                    // Récupérer les horaires sélectionnés
                    const selectedHours = getSelectedHours();
                    modal.style.display = 'none';
                    resolve({ name, hours: selectedHours });
                }
            }
        };

        // Fonction de fermeture
        window.closePlanningNameModal = function() {
            modal.style.display = 'none';
            resolve(null);
        };

        // Fonction de confirmation
        window.confirmPlanningName = function() {
            const name = input.value.trim();
            if (name) {
                // Récupérer les horaires sélectionnés
                const selectedHours = getSelectedHours();
                modal.style.display = 'none';
                resolve({ name, hours: selectedHours });
            } else {
                input.focus();
            }
        };

        // Fermer si clic en dehors
        window.onclick = function(event) {
            if (event.target === modal) {
                closePlanningNameModal();
            }
        };
    });
}

// Fonction pour récupérer les horaires sélectionnés
function getSelectedHours() {
    const checkboxes = document.querySelectorAll('.hour-checkbox input[type="checkbox"]:checked');
    const selectedHours = Array.from(checkboxes).map(checkbox => checkbox.value);
    
    // Si aucun horaire n'est sélectionné, utiliser les horaires par défaut
    if (selectedHours.length === 0) {
        return ['10h', '13h', '16h', '19h'];
    }
    
    // Trier les horaires dans l'ordre chronologique
    return selectedHours.sort((a, b) => {
        const hourA = parseInt(a);
        const hourB = parseInt(b);
        return hourA - hourB;
    });
}

async function addPlanning() {
    try {
        const result = await showPlanningNameModal();
        if (!result) return; // L'utilisateur a annulé
        
        const { name, hours } = result;

        const id = Date.now().toString();
        planningData[id] = {};
        planningHours[id] = hours;
        
        // Initialiser le planning vide
        days.forEach(day => {
            planningData[id][day] = {};
            planningHours[id].forEach(hour => {
                planningData[id][day][hour] = null;
            });
        });

        // Ajouter au DOM et à la liste déroulante
        addPlanningToDOM(name, id, planningData[id], planningHours[id]);
        addPlanningToSelect(id, name);
        
        // Sauvegarder les données
        await savePlanningData();
            
    } catch (error) {
        console.error('Erreur lors de l\'ajout du planning:', error);
        alert('Une erreur est survenue lors de la création du planning.');
    }
}

async function savePlanningData() {
    try {
        const userId = localStorage.getItem('userId');
        for (const id in planningData) {
            const name = document.querySelector(`[data-planning-id="${id}"] h3`)?.textContent;
            if (!name) continue;

            const response = await fetch('save_planning.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    name: name,
                    data: planningData[id],
                    hours: planningHours[id] // Inclure les horaires dans la sauvegarde
                })
            });
            const result = await response.json();
            if (result.status !== 'success') {
                console.error('Erreur de sauvegarde pour le planning', name, ':', result.message);
            }
        }
    } catch (error) {
        console.error('Erreur lors de la sauvegarde :', error);
    }
}


function addPlanningToSelect(id, name) {
    const existingOption = document.querySelector(`#planningSelect option[value="${id}"]`);
    if (existingOption) {
        existingOption.textContent = name;
        return;
    }
    const planningSelect = document.getElementById('planningSelect');
    const option = document.createElement('option');
    option.value = id;
    option.textContent = name;
    planningSelect.appendChild(option);
}

async function handlePostalCode(cell, day, hour, planningId) {
    const currentCP = cell.querySelector('.cp').textContent;
    const countryCode = document.getElementById('countrySelect').value;
    const newCP = prompt(`Code postal (${countryCode}) :`, currentCP !== '-' ? currentCP : '');
    if (newCP === null) return;
    if (newCP === "") {
        cell.querySelector('.cp').textContent = "-";
        planningData[planningId][day][hour] = null;
    } else {
        const locationData = await getCoordinates(newCP, countryCode);
        if (locationData) {
            const displayText = `${newCP} - ${locationData.city}`;
            cell.querySelector('.cp').textContent = displayText;
            planningData[planningId][day][hour] = { 
                cp: newCP, 
                city: locationData.city,
                coordinates: locationData.coordinates 
            };
        } else alert('Localisation introuvable !');
    }
    savePlanningData();
}

async function getCoordinates(cp, countryCode) {
    try {
        console.log('Recherche des coordonnées pour:', cp);
        const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${cp}&type=municipality&limit=20`);
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            // Si plusieurs villes, afficher la modale de sélection
            if (data.features.length > 1) {
                const cities = data.features.map(f => ({
                    city: f.properties.city,
                    coordinates: {
                        lat: f.geometry.coordinates[1],
                        lon: f.geometry.coordinates[0]
                    }
                }));
                
                const selectedCity = await showCityModal(cities);
                if (selectedCity) {
                    return {
                        coordinates: selectedCity.coordinates,
                        city: selectedCity.city
                    };
                }
                return null;
            }
            
            // Si une seule ville, la retourner directement
            const feature = data.features[0];
            return {
                coordinates: {
                    lat: feature.geometry.coordinates[1],
                    lon: feature.geometry.coordinates[0]
                },
                city: feature.properties.city
            };
        }
        return null;
    } catch (error) {
        console.error('Erreur lors de la récupération des coordonnées:', error);
        return null;
    }
}

let allCities = []; // Variable globale pour stocker toutes les villes

function showCityModal(cities) {
    return new Promise((resolve) => {
        const modal = document.getElementById('cityModal');
        const cityList = document.getElementById('cityList');
        allCities = cities; // Stocker les villes pour la recherche

        // Fonction pour afficher les villes
        function displayCities(citiesToShow) {
            cityList.innerHTML = '';
            citiesToShow.forEach(cityData => {
                const cityElement = document.createElement('div');
                cityElement.className = 'city-item';
                
                // Formater les coordonnées pour l'affichage
                const lat = cityData.coordinates.lat.toFixed(4);
                const lon = cityData.coordinates.lon.toFixed(4);
                
                cityElement.innerHTML = `
                    <div class="city-name">${cityData.city}</div>
                    <div class="city-details">
                        <div>Latitude: ${lat}</div>
                        <div>Longitude: ${lon}</div>
                    </div>
                `;
                
                cityElement.onclick = () => {
                    modal.style.display = 'none';
                    resolve(cityData);
                };
                
                cityList.appendChild(cityElement);
            });
        }

        // Afficher initialement toutes les villes
        displayCities(cities);
        
        // Fonction de filtrage des villes
        window.filterCities = function() {
            const searchTerm = document.getElementById('citySearch').value.toLowerCase();
            const filteredCities = allCities.filter(cityData => 
                cityData.city.toLowerCase().includes(searchTerm)
            );
            displayCities(filteredCities);
        };

        // Afficher la modale
        modal.style.display = 'block';

        // Gérer la fermeture de la modale
        window.closeCityModal = function() {
            modal.style.display = 'none';
            resolve(null);
        };

        // Fonction de confirmation
        window.confirmCity = function() {
            const selectedCity = allCities.find(cityData => cityData.city === document.getElementById('citySearch').value);
            if (selectedCity) {
                modal.style.display = 'none';
                resolve(selectedCity);
            } else {
                document.getElementById('citySearch').focus();
            }
        };

        // Fermer la modale si on clique en dehors
        window.onclick = function(event) {
            if (event.target === modal) {
                closeCityModal();
            }
        };
    });
}

function closeCityModal() {
    const modal = document.getElementById('cityModal');
    modal.style.display = 'none';
    
    // Si une promesse est en attente, la rejeter
    if (cityModalReject) {
        cityModalReject(new Error('Modal closed'));
        cityModalReject = null;
        cityModalResolve = null;
    }
}

// Fermer la modale si on clique en dehors
window.onclick = function(event) {
    const modal = document.getElementById('cityModal');
    if (event.target === modal) {
        closeCityModal();
    }
};

function formatDayDate(day) {
    const days = {
        'Lundi': 'Lundi',
        'Mardi': 'Mardi',
        'Mercredi': 'Mercredi',
        'Jeudi': 'Jeudi'
    };
    return days[day] || day;
}

function displaySuggestions(suggestions) {
    const container = document.getElementById('suggestionsContainer');
    const cardsContainer = document.getElementById('suggestionCards');
    cardsContainer.innerHTML = ''; // Nettoyer les suggestions précédentes
    
    suggestions.forEach((slot, index) => {
        const card = document.createElement('div');
        card.className = 'suggestion-card';
        
        const scorePercentage = Math.round((slot.score + 100) / 2); // Convertir le score en pourcentage
        
        card.innerHTML = `
            <h4>Suggestion ${index + 1}</h4>
            <div class="suggestion-info">
                <strong>${formatDayDate(slot.day)} à ${slot.hour}</strong>
            </div>
            <div class="suggestion-info">
                <i>Point le plus proche :</i><br>
                ${slot.nearestLocation}
            </div>
            <div class="suggestion-stats">
                <span title="Distance jusqu'au point le plus proche">
                    ${slot.nearestDistance.toFixed(1)} km
                </span>
                <span title="Temps de trajet estimé">
                    ${slot.nearestDuration.text}
                </span>
            </div>
            <div class="suggestion-stats">
                <span title="Score de compatibilité">
                    ${scorePercentage}% compatible
                </span>
                <span title="Distance moyenne avec les autres points">
                    ~${slot.averageDistance.toFixed(1)} km
                </span>
            </div>
            <button class="add-suggestion-btn" onclick="addSuggestedSlot('${selectedPlanningId}', '${slot.day}', '${slot.hour}', '${newPostalCode}', ${slot.coordinates.lat}, ${slot.coordinates.lon}, '${slot.city}')">
                Choisir ce créneau
            </button>
            
        `;
        
        cardsContainer.appendChild(card);
    });
    
    container.classList.remove('hidden');
    handleSuggestionNavigation(); // Initialiser la navigation après l'ajout des cartes
}

async function suggestSlot() {
    const planningSelect = document.getElementById('planningSelect');
    const selectedPlanningId = planningSelect.value;
    if (!selectedPlanningId) {
        alert('Veuillez sélectionner un planning.');
        return;
    }

    const countryCode = document.getElementById('countrySelect').value;
    const newCP = await showPostalCodeModal();
    if (!newCP) return; // L'utilisateur a annulé

    // Afficher le message de calcul
    document.getElementById('distanceCalculationMessage').style.display = 'block';

    try {
        const locationData = await getCoordinates(newCP, countryCode);
        if (!locationData) {
            document.getElementById('distanceCalculationMessage').style.display = 'none';
            alert('Localisation introuvable !');
            return;
        }

        let allSlots = [];
        const planningId = selectedPlanningId;

        // Analyser les horaires existants pour chaque jour
        const daySchedules = {};
        for (const day of days) {
            daySchedules[day] = {
                occupiedHours: [],
                freeHours: []
            };
            
            for (const hour of planningHours[planningId]) {
                if (planningData[planningId][day][hour]) {
                    daySchedules[day].occupiedHours.push(hour);
                } else {
                    daySchedules[day].freeHours.push(hour);
                }
            }
        }

        // Pour chaque jour avec des créneaux libres
        for (const day of days) {
            if (daySchedules[day].freeHours.length === 0) continue;

            // Pour chaque créneau libre de ce jour
            for (const freeHour of daySchedules[day].freeHours) {
                let score = 0;
                let totalDistance = 0;
                let countDistances = 0;
                let nearestDistance = Infinity;
                let nearestLocation = '';
                let nearestDuration = null;

                // Calculer le score en fonction des créneaux occupés du même jour
                for (const occupiedHour of daySchedules[day].occupiedHours) {
                    const existing = planningData[planningId][day][occupiedHour];
                    if (existing && existing.coordinates) {
                        const result = await calculateDistance(
                            existing.coordinates,
                            locationData.coordinates
                        );

                        if (result !== null) {
                            totalDistance += result.distance;
                            countDistances++;

                            // Garder la distance la plus proche et sa durée
                            if (result.distance < nearestDistance) {
                                nearestDistance = result.distance;
                                nearestLocation = `${existing.cp} - ${existing.city}`;
                                nearestDuration = result.duration;
                            }

                            // Bonus pour les créneaux proches temporellement
                            const hourDiff = Math.abs(planningHours[planningId].indexOf(freeHour) - planningHours[planningId].indexOf(occupiedHour));
                            if (hourDiff === 1) {
                                score += 5;
                            } else if (hourDiff === 2) {
                                score += 3;
                            }
                        }
                    }
                }

                // Si on a trouvé au moins une distance calculable
                if (countDistances > 0) {
                    const averageDistance = totalDistance / countDistances;
                    const finalScore = score - averageDistance;

                    allSlots.push({
                        day,
                        hour: freeHour,
                        score: finalScore,
                        averageDistance,
                        nearestDistance,
                        nearestLocation,
                        nearestDuration,
                        coordinates: locationData.coordinates,
                        city: locationData.city
                    });
                }
            }
        }

        // Masquer le message de calcul
        document.getElementById('distanceCalculationMessage').style.display = 'none';

        if (allSlots.length === 0) {
            alert('Aucun créneau libre trouvé avec des distances calculables.');
            return;
        }

        // Trier les créneaux par score décroissant et prendre les 5 meilleurs
        allSlots.sort((a, b) => b.score - a.score);
        const bestSlots = allSlots.slice(0, 5);

        // Sauvegarder le code postal pour l'utilisation dans displaySuggestions
        window.newPostalCode = newCP;
        window.selectedPlanningId = selectedPlanningId;

        // Afficher les 5 meilleures suggestions
        displaySuggestions(bestSlots);

    } catch (error) {
        console.error('Erreur lors de la suggestion:', error);
        document.getElementById('distanceCalculationMessage').style.display = 'none';
        alert('Une erreur est survenue lors de la suggestion du créneau.');
    }
}

async function calculateDistance(coord1, coord2) {
    try {
        // Utiliser l'API OSRM pour calculer la distance routière
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coord1.lon},${coord1.lat};${coord2.lon},${coord2.lat}?overview=false`);
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            // Convertir la distance de mètres en kilomètres
            const distance = route.distance / 1000;
            // Durée en secondes à convertir en heures et minutes
            const duration = route.duration;
            const hours = Math.floor(duration / 3600);
            const minutes = Math.round((duration % 3600) / 60);
            
            return {
                distance,
                duration: {
                    hours,
                    minutes,
                    text: hours > 0 ? `${hours}h${minutes}min` : `${minutes}min`
                }
            };
        }
        return null;
    } catch (error) {
        console.error('Erreur lors du calcul de la distance:', error);
        return null;
    }
}

function closeSuggestionsModal() {
    const modal = document.getElementById('suggestionsContainer');
    modal.classList.add('hidden');
}

function addSuggestedSlot(planningId, day, hour, cp, lat, lon, city) {
    const cell = document.querySelector(`[data-planning-id="${planningId}"] td[onclick*="${day}"][onclick*="${hour}"]`);
    if (cell) {
        cell.querySelector('.cp').textContent = `${cp} - ${city}`;
        planningData[planningId][day][hour] = {
            cp: cp,
            city: city,
            coordinates: { lat, lon }
        };
        savePlanningData();
        closeSuggestionsModal(); // Fermer le modal des suggestions
        refreshPlanning(); // Refresh the planning
    }
}

function logout() {
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
}

function updatePlanningSelect() {
    const planningSelect = document.getElementById('planningSelect');
    planningSelect.innerHTML = ''; // Réinitialiser le sélecteur
    for (const planningId in planningData) {
        const option = document.createElement('option');
        option.value = planningId;
        option.textContent = document.querySelector(`[data-planning-id="${planningId}"] h3`).textContent;
        planningSelect.appendChild(option);
    }
}

function handleSuggestionNavigation() {
    const container = document.getElementById('suggestionsContainer');
    const cardsContainer = document.getElementById('suggestionCards');
    
    // Créer les boutons de navigation s'ils n'existent pas
    let prevBtn = document.getElementById('prevSuggestions');
    let nextBtn = document.getElementById('nextSuggestions');
    
    if (!prevBtn) {
        prevBtn = document.createElement('button');
        prevBtn.id = 'prevSuggestions';
        prevBtn.className = 'suggestion-nav-btn prev';
        prevBtn.innerHTML = '&lt;';
        container.insertBefore(prevBtn, cardsContainer);
    }
    
    if (!nextBtn) {
        nextBtn = document.createElement('button');
        nextBtn.id = 'nextSuggestions';
        nextBtn.className = 'suggestion-nav-btn next';
        nextBtn.innerHTML = '&gt;';
        container.appendChild(nextBtn);
    }

    // Mise à jour de l'état des boutons
    function updateButtonStates() {
        prevBtn.disabled = currentScrollPosition <= 0;
        nextBtn.disabled = currentScrollPosition >= cardsContainer.scrollWidth - cardsContainer.clientWidth;
    }

    // Gestionnaires d'événements pour les boutons
    prevBtn.addEventListener('click', () => {
        currentScrollPosition = Math.max(0, currentScrollPosition - scrollStep);
        cardsContainer.scrollTo({
            left: currentScrollPosition,
            behavior: 'smooth'
        });
        updateButtonStates();
    });

    nextBtn.addEventListener('click', () => {
        currentScrollPosition = Math.min(
            cardsContainer.scrollWidth - cardsContainer.clientWidth,
            currentScrollPosition + scrollStep
        );
        cardsContainer.scrollTo({
            left: currentScrollPosition,
            behavior: 'smooth'
        });
        updateButtonStates();
    });

    // Mise à jour initiale de l'état des boutons
    updateButtonStates();

    // Écouter le défilement manuel
    cardsContainer.addEventListener('scroll', () => {
        currentScrollPosition = cardsContainer.scrollLeft;
        updateButtonStates();
    });
}

function showPostalCodeModal() {
    return new Promise((resolve) => {
        const modal = document.getElementById('postalCodeModal');
        const input = document.getElementById('postalCode');
        const countryCodeDisplay = document.getElementById('displayCountryCode');
        const countryCode = document.getElementById('countrySelect').value;
        
        // Afficher le code pays
        countryCodeDisplay.textContent = countryCode;
        
        // Réinitialiser l'input
        input.value = '';
        
        // Afficher la modale
        modal.style.display = 'block';
        input.focus();

        // Gérer la soumission par la touche Entrée
        input.onkeypress = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const postalCode = input.value.trim();
                if (postalCode) {
                    modal.style.display = 'none';
                    resolve(postalCode);
                }
            }
        };

        // Fonction de fermeture
        window.closePostalCodeModal = function() {
            modal.style.display = 'none';
            resolve(null);
        };

        // Fonction de confirmation
        window.confirmPostalCode = function() {
            const postalCode = input.value.trim();
            if (postalCode) {
                modal.style.display = 'none';
                resolve(postalCode);
            } else {
                input.focus();
            }
        };

        // Fermer si clic en dehors
        window.onclick = function(event) {
            if (event.target === modal) {
                closePostalCodeModal();
            }
        };
    });
}


// Variables pour le défilement des suggestions
let currentScrollPosition = 0;
const scrollStep = 320; // Largeur d'une carte + gap


function refreshPlanning() {
    const userId = localStorage.getItem('userId');
    if (userId) {
        loadPlannings(userId);
    }
}
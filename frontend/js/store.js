// store.js

const initialState = {
    username: null,
    token: null,
    language: "fr"
    // autres variables...
};

// Initialiser le store si vide
function initializeStore() {
    if (getData('store') === null) {
        storeData('store', initialState);
    }
}

// Fonction pour stocker des données
export function storeData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// Fonction pour récupérer des données
export function getData(key) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
}

// Fonction pour mettre à jour une partie de l'état
export function updateState(key, value) {
    const store = getData('store') || initialState;
    store[key] = value;
    storeData('store', store);
}

// Fonction pour obtenir une partie de l'état
export function getState(key) {
    const store = getData('store') || initialState;
    return store[key];
}

// Initialiser le store au chargement
initializeStore();

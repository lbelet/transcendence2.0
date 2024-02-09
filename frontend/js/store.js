// store.js

const initialState = {
    userID: null,
    username: null,
    access_token: null,
    refresh_token: null,
    language: "fr",
    gameSocket_ID: null,
    currentGameId: null,
    playerRole: 0,
    player_one: null,
    player_two: null,
    avatarURL: null,
    inGame: false,
    inTournament: false,
    inPongGame: false,
    in1v1: "no",
};

function initializeStore() {
    if (getData('store') === null) {
        storeData('store', initialState);
    }
}

export function storeData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function getData(key) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
}

export function updateState(key, value) {
    const store = getData('store') || initialState;
    store[key] = value;
    storeData('store', store);
}

export function getState(key) {
    const store = getData('store') || initialState;
    return store[key];
}

initializeStore();

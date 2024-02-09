import * as THREE from 'three';


import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

let globalFont2; 

const loader2 = new FontLoader();

const scene2 = new THREE.Scene();


loader2.load('node_modules/three/examples/fonts/droid/droid_serif_regular.typeface.json', function (font) {
    globalFont2 = font; 
    const textMaterial2 = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    const textGeometry2 = new TextGeometry('player1: 0 | player2: 0', {
        font: font,
        size: 2,
        height: 0.2
    });

    const scoreText12 = new THREE.Mesh(textGeometry2, textMaterial2);
    scoreText12.position.set(-15, 15, 0); 
    scene2.add(scoreText12);
    window.scoreText12 = scoreText12;
});

const paddleMaterial12 = new THREE.MeshStandardMaterial({
    color: 0xffa500,
    wireframe: false
});

const paddleMaterial22 = new THREE.MeshStandardMaterial({
    color: 0x000000,
    wireframe: false
});

const paddleGeo2 = new THREE.BoxGeometry(6, 1, 1);
const paddle12 = new THREE.Mesh(paddleGeo2, paddleMaterial12);
window.paddle12 = paddle12;
paddle12.position.set(0, 0, -14);
scene2.add(paddle12);

// Raquette 2
const paddle22 = new THREE.Mesh(paddleGeo2, paddleMaterial22);
window.paddle22 = paddle22;
paddle22.position.set(0, 0, 14);
scene2.add(paddle22);

// Balle
const ballGeometry2 = new THREE.SphereGeometry(1, 32, 32);
const ballMaterial2 = new THREE.MeshStandardMaterial({
    color: 0x000000,
});
const ball2 = new THREE.Mesh(ballGeometry2, ballMaterial2);
window.ball2 = ball2;
ball2.position.set(0, 1, 0);
scene2.add(ball2);

const planeGeometry2 = new THREE.PlaneGeometry(20, 30);
const planeMaterial2 = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF,
    side: THREE.DoubleSide,
    wireframe: false,
    transparent: true,
    opacity: 0.8
});
const plane2 = new THREE.Mesh(planeGeometry2, planeMaterial2);
plane2.rotation.x = Math.PI / 2;
plane2.position.set(0, 0, 0);
scene2.add(plane2);

// Ajout des murs
const wallGeometry2 = new THREE.BoxGeometry(0.2, 1, 30);
const wallMaterial2 = new THREE.MeshBasicMaterial({
    color: 0x2222ff,
    wireframe: true,
    transparent: false,
    opacity: 0.5,
});
const wall12 = new THREE.Mesh(wallGeometry2, wallMaterial2);
wall12.position.set(10, 0, 0);
scene2.add(wall12);
const wall22 = new THREE.Mesh(wallGeometry2, wallMaterial2);
wall22.position.set(-10, 0, 0);
scene2.add(wall22);

let paddleUser2;

// Caméra
const camera2 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera2.position.set(0, 5, 28);

// Renderer
const canvasT = document.getElementById('pongTournament-canvas');
const renderer2 = new THREE.WebGLRenderer({ canvas: canvasT });
const width2 = window.innerWidth * 0.45;
const height2 = window.innerHeight * 0.45;
renderer2.setSize(width2, height2);

// Ajout de lumière
const ambientLight2 = new THREE.AmbientLight(0xffffff, 0.5);
scene2.add(ambientLight2);

document.addEventListener('keydown', (event) => {
    console.log("event Tournament ok")
    if (typeof gameWebsocket !== 'undefined' && gameWebsocket.readyState === WebSocket.OPEN && window.location.pathname === '/pongTournament') {
        console.log("touches tournoi ok")
        let action;
        if (event.key === "ArrowRight") {
            action = paddleUser2 == paddle12 ? 'move_left_paddle12' : 'move_right_paddle22';
        } else if (event.key === "ArrowLeft") {
            action = paddleUser2 == paddle12 ? 'move_right_paddle12' : 'move_left_paddle22';
        }

        if (action) {
            gameWebsocket.send(JSON.stringify({ type: 'paddle_move_tournament', action }));
        }
    }
});


window.updateGameFromState_tournament = function (newGameState) {
    console.log("Mise à jour de l'état des raquettes reçue:", newGameState);
    if (newGameState.paddle1) {
        paddle12.position.x = newGameState.paddle1.x;
    }
    if (newGameState.paddle2) {
        paddle22.position.x = newGameState.paddle2.x;
    }
};

window.updateBallFromState_tournament = function (newBallState_tournament) {

    if (newBallState_tournament.ball) {
        ball2.position.set(newBallState_tournament.ball.x, 1, newBallState_tournament.ball.z);
    }
};

window.setPlayerRole_tournament = function (player1Name, player2Name) {
    const playerRole2 = localStorage.getItem('playerRole');

    if (window.scoreText1) {
        scene2.remove(window.scoreText12);
        window.scoreText12.geometry.dispose();
    }

    const newText2 = `${player1Name}: 0 | ${player2Name}: 0`;
    const textMaterial2 = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    const newGeometry2 = new TextGeometry(newText2, {
        font: globalFont2, 
        size: 2,
        height: 0.2
    });

    const newScoreText2 = new THREE.Mesh(newGeometry2, textMaterial2);
    newScoreText2.position.set(-15, 15, 0);
    scene2.add(newScoreText2);

    window.scoreText12 = newScoreText2;
    if (playerRole2 == 1) {
        paddleUser2 = paddle12;
        console.log("playerRole: ", playerRole2)
        camera2.position.set(0, 5, -28); 
        camera2.rotation.y = Math.PI;
        newScoreText2.rotation.y = Math.PI; 
        newScoreText2.position.set(15, 15, 0);
    } else if (playerRole2 == 2) {
        paddleUser2 = paddle22;
        console.log("playerRole: ", playerRole2)
        camera2.position.set(0, 5, 28); 
        camera2.rotation.y = 0;
    }
}

window.updateScores_tournament = function(player1Score_tournament, player2Score_tournament, player1Name, player2Name) {
    const playerRole2 = localStorage.getItem('playerRole');

    if (window.scoreText12) {
        scene2.remove(window.scoreText12);
        window.scoreText12.geometry.dispose();
    }

    const newText2 = `${player1Name}: ${player1Score_tournament} | ${player2Name}: ${player2Score_tournament}`;
    const textMaterial2 = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    // Créer une nouvelle géométrie de texte
    const newGeometry2 = new TextGeometry(newText2, {
        font: globalFont2, 
        size: 2,
        height: 0.2
    });

    // Créer un nouveau Mesh et l'ajouter à la scène
    const newScoreText2 = new THREE.Mesh(newGeometry2, textMaterial2);
    newScoreText2.position.set(-15, 15, 0);
    scene2.add(newScoreText2);

    // Mettre à jour la référence globale
    window.scoreText12 = newScoreText2;
    if(playerRole2 == 1)
        newScoreText2.rotation.y = Math.PI;
        newScoreText2.position.set(15, 15, 0);
    if(playerRole2 == 2)
        newScoreText2.position.set(-15, 15, 0);
};

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    // Rapport d'aspect fixe
    const aspectRatio = 800 / 600;

    // Calculer la largeur et la hauteur en conservant le rapport d'aspect
    let width2 = window.innerWidth * 0.45;
    let height2 = width2 / aspectRatio;

    // Ajuster si la hauteur calculée est trop grande pour la fenêtre
    if (height2 > window.innerHeight * 0.45) {
        height2 = window.innerHeight * 0.45;
        width2 = height2 * aspectRatio;
    }

    renderer2.setSize(width2, height2);
    camera2.aspect = width2 / height2;
    camera2.updateProjectionMatrix();
}

onWindowResize();

function animate() {
    requestAnimationFrame(animate);
    renderer2.render(scene2, camera2);
}

animate();
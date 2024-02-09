import * as THREE from 'three';


import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';


let globalFont; 
const loader = new FontLoader();

const scene = new THREE.Scene();


loader.load('node_modules/three/examples/fonts/droid/droid_serif_regular.typeface.json', function (font) {
    globalFont = font; 
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  
    const textGeometry = new TextGeometry('player1: 0 | player2: 0', {
        font: font,
        size: 2,
        height: 0.2
    });

    const scoreText1 = new THREE.Mesh(textGeometry, textMaterial);
    scoreText1.position.set(-15, 15, 0);
    scene.add(scoreText1);
    window.scoreText1 = scoreText1;
});

const paddleMaterial1 = new THREE.MeshStandardMaterial({
    color: 0xffa500,
    wireframe: false
});

const paddleMaterial2 = new THREE.MeshStandardMaterial({
    color: 0x000000,
    wireframe: false
});

// Raquette 1
const paddleGeo = new THREE.BoxGeometry(6, 1, 1);
const paddle1 = new THREE.Mesh(paddleGeo, paddleMaterial1);
window.paddle1 = paddle1;
paddle1.position.set(0, 0, -14);
scene.add(paddle1);

// Raquette 2
const paddle2 = new THREE.Mesh(paddleGeo, paddleMaterial2);
window.paddle2 = paddle2;
paddle2.position.set(0, 0, 14);
scene.add(paddle2);

// Balle
const ballGeometry = new THREE.SphereGeometry(1, 32, 32);
const ballMaterial = new THREE.MeshStandardMaterial({
    color: 0x000000,
});
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
window.ball = ball;
ball.position.set(0, 1, 0);
scene.add(ball);

// Ajout d'un plan (sol)
const planeGeometry = new THREE.PlaneGeometry(20, 30);
const planeMaterial = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF,
    side: THREE.DoubleSide,
    wireframe: false,
    transparent: true,
    opacity: 0.8
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = Math.PI / 2;
plane.position.set(0, 0, 0);
scene.add(plane);

// Ajout des murs
const wallGeometry = new THREE.BoxGeometry(0.2, 1, 30);
const wallMaterial = new THREE.MeshBasicMaterial({
    color: 0x2222ff,
    wireframe: true,
    transparent: false,
    opacity: 0.5,
});
const wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
wall1.position.set(10, 0, 0);
scene.add(wall1);
const wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
wall2.position.set(-10, 0, 0);
scene.add(wall2);

let paddleUser;

// Caméra
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 28);

// Renderer
const canvas = document.getElementById('pong-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
const width = window.innerWidth * 0.45;
const height = window.innerHeight * 0.45;
renderer.setSize(width, height);

// Ajout de lumière
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

var directionalLight = new THREE.DirectionalLight(0xffffff, 10);
directionalLight.position.set(20, 20, 20); 
scene.add(directionalLight);

document.addEventListener('keydown', (event) => {
    if (typeof gameWebsocket !== 'undefined' && gameWebsocket.readyState === WebSocket.OPEN && window.location.pathname === '/pong') {
        let action;
        if (event.key === "ArrowRight") {
            action = paddleUser == paddle1 ? 'move_left_paddle1' : 'move_right_paddle2';
        } else if (event.key === "ArrowLeft") {
            action = paddleUser == paddle1 ? 'move_right_paddle1' : 'move_left_paddle2';
        }

        if (action) {
            gameWebsocket.send(JSON.stringify({ type: 'paddle_move', action }));
        }
    }
});
// }

window.updateGameFromState = function (newGameState) {
    if (newGameState.paddle1) {
        paddle1.position.x = newGameState.paddle1.x;
    }
    if (newGameState.paddle2) {
        paddle2.position.x = newGameState.paddle2.x;
    }
};

window.updateBallFromState = function (newBallState) {

    if (newBallState.ball) {
        ball.position.set(newBallState.ball.x, 1, newBallState.ball.z);
    }
};

window.setPlayerRole = function (player1Name, player2Name) {
    const playerRole = localStorage.getItem('playerRole');

    if (window.scoreText1) {
        scene.remove(window.scoreText1);
        window.scoreText1.geometry.dispose();
    }

    const newText = `${player1Name}: 0 | ${player2Name}: 0`;
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    const newGeometry = new TextGeometry(newText, {
        font: globalFont, 
        size: 2,
        height: 0.2
    });

    const newScoreText = new THREE.Mesh(newGeometry, textMaterial);
    newScoreText.position.set(-15, 15, 0);
    scene.add(newScoreText);

    window.scoreText1 = newScoreText;

    if (playerRole == 1) {
        paddleUser = paddle1;
        camera.position.set(0, 5, -28); 
        camera.rotation.y = Math.PI;
        newScoreText.rotation.y = Math.PI; 
        newScoreText.position.set(15, 15, 0);

    } else if (playerRole == 2) {
        paddleUser = paddle2;
        camera.position.set(0, 5, 28); 
        camera.rotation.y = 0;
    }
}

window.updateScores = function(player1Score, player2Score, player1Name, player2Name) {
    const playerRole = localStorage.getItem('playerRole');

    if (window.scoreText1) {
        scene.remove(window.scoreText1);
        window.scoreText1.geometry.dispose();
    }


    const newText = `${player1Name}: ${player1Score} | ${player2Name}: ${player2Score}`;
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    const newGeometry = new TextGeometry(newText, {
        font: globalFont,
        size: 2,
        height: 0.2
    });

    const newScoreText = new THREE.Mesh(newGeometry, textMaterial);
    scene.add(newScoreText);

    window.scoreText1 = newScoreText;

    if(playerRole == 1)
        newScoreText.rotation.y = Math.PI;
        newScoreText.position.set(15, 15, 0);
    if(playerRole == 2)
        newScoreText.position.set(-15, 15, 0);
};

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    const aspectRatio = 800 / 600;

    let width = window.innerWidth * 0.45;
    let height = width / aspectRatio;

    if (height > window.innerHeight * 0.45) {
        height = window.innerHeight * 0.45;
        width = height * aspectRatio;
    }

    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

onWindowResize();

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();

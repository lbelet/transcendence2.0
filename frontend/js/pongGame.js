import * as THREE from 'three';


import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

// import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
// import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
// import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
// import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
let globalFont; // Déclaration d'une variable globale pour la police

const loader = new FontLoader();

const scene = new THREE.Scene();


// Charger une police (remplacer par le chemin de votre police)
loader.load('node_modules/three/examples/fonts/droid/droid_serif_regular.typeface.json', function (font) {
    globalFont = font; // Stocker la police chargée dans la variable globale
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    // const textGeometry1 = new TextGeometry('Score: 0', {
    //     font: font,
    //     size: 1,
    //     height: 0.1
    // });
    const textGeometry = new TextGeometry('player1: 0 | player2: 0', {
        font: font,
        size: 2,
        height: 0.2
    });

    const scoreText1 = new THREE.Mesh(textGeometry, textMaterial);
    scoreText1.position.set(-15, 15, 0); // Modifier selon votre scène
    scene.add(scoreText1);
    window.scoreText1 = scoreText1;
});

const paddleMaterial1 = new THREE.MeshStandardMaterial({
    color: 0xffa500,
    emissive: 0xff8c00,
    emissiveIntensity: 0.5,
    wireframe: false
});

const paddleMaterial2 = new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: 0xff8c00,
    emissiveIntensity: 0.5,
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
    emissiveIntensity: 0
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
    emissive: 0x2222ff,
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
    emissive: 0x2222ff,
    transparent: false,
    opacity: 0.5,
    emissiveIntensity: 2
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
camera.position.set(0, 5, 24);

// Renderer
const canvas = document.getElementById('pong-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize(800, 600);

// Ajout de lumière
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// // Composer pour le post-traitement
// const composer = new EffectComposer(renderer);
// composer.addPass(new RenderPass(scene, camera));

// // Configurer l'Unreal Bloom Pass
// const bloomPass = new UnrealBloomPass(
//     new THREE.Vector2(window.innerWidth, window.innerHeight),
//     1.5,  // Intensité de la lumière
//     0.4,  // Rayon de la lumière
//     0.85  // Seuil de luminosité
// );
// composer.addPass(bloomPass);

// // Création de l'OutlinePass
// const outlinePass = new OutlinePass(
//     new THREE.Vector2(800, 600),
//     scene,
//     camera
// );
// outlinePass.edgeStrength = 5;
// outlinePass.edgeGlow = 1.0;
// outlinePass.edgeThickness = 3;
// outlinePass.visibleEdgeColor.set('#00ff00');
// // outlinePass.hiddenEdgeColor.set('#ff0000');
// outlinePass.selectedObjects = [paddle1, paddle2, wall1, wall2, ball];
// composer.addPass(outlinePass);

// if (window.location.pathname === '/pong') {
document.addEventListener('keydown', (event) => {
    console.log("event match ok")
    // Votre logique existante pour gérer les touches du clavier
    if (typeof gameWebsocket !== 'undefined' && gameWebsocket.readyState === WebSocket.OPEN && window.location.pathname === '/pong') {
        let action;
        console.log("touches match ok")
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
    console.log("Mise à jour de l'état des raquettes reçue:", newGameState);
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

window.setPlayerRole = function () {
    const playerRole = localStorage.getItem('playerRole');
    if (playerRole == 1) {
        paddleUser = paddle1;
        console.log("playerRole: ", playerRole)
        camera.position.set(0, 5, -24); // Position inversée de la caméra pour le joueur 2
        camera.rotation.y = Math.PI;
    } else if (playerRole == 2) {
        paddleUser = paddle2;
        console.log("playerRole: ", playerRole)
        camera.position.set(0, 5, 24); // Position inversée de la caméra pour le joueur 2
    }
}

window.updateScores = function(player1Score, player2Score) {
    // Supprimer l'ancien Mesh de la scène
    if (window.scoreText1) {
        scene.remove(window.scoreText1);
        window.scoreText1.geometry.dispose();
    }

    const newText = `player1: ${player1Score} | player2: ${player2Score}`;
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    // Créer une nouvelle géométrie de texte
    const newGeometry = new TextGeometry(newText, {
        font: globalFont, // Assurez-vous que 'font' est accessible ici
        size: 2,
        height: 0.2
    });

    // Créer un nouveau Mesh et l'ajouter à la scène
    const newScoreText = new THREE.Mesh(newGeometry, textMaterial);
    newScoreText.position.set(-15, 15, 0);
    scene.add(newScoreText);

    // Mettre à jour la référence globale
    window.scoreText1 = newScoreText;
};



function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    // composer.render();
}

animate();

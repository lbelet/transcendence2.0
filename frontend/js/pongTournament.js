import * as THREE from 'three';


import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

// import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
// import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
// import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
// import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
let globalFont2; // Déclaration d'une variable globale pour la police

const loader2 = new FontLoader();

const scene2 = new THREE.Scene();


// Charger une police (remplacer par le chemin de votre police)
loader2.load('node_modules/three/examples/fonts/droid/droid_serif_regular.typeface.json', function (font) {
    globalFont2 = font; // Stocker la police chargée dans la variable globale
    const textMaterial2 = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    // const textGeometry1 = new TextGeometry('Score: 0', {
    //     font: font,
    //     size: 1,
    //     height: 0.1
    // });
    const textGeometry2 = new TextGeometry('player1: 0 | player2: 0', {
        font: font,
        size: 2,
        height: 0.2
    });

    const scoreText12 = new THREE.Mesh(textGeometry2, textMaterial2);
    scoreText12.position.set(-15, 15, 0); // Modifier selon votre scène
    scene2.add(scoreText12);
    window.scoreText12 = scoreText12;
});

const paddleMaterial12 = new THREE.MeshStandardMaterial({
    color: 0xffa500,
    emissive: 0xff8c00,
    emissiveIntensity: 0.5,
    wireframe: false
});

const paddleMaterial22 = new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: 0xff8c00,
    emissiveIntensity: 0.5,
    wireframe: false
});

// Raquette 1
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
    emissiveIntensity: 0
});
const ball2 = new THREE.Mesh(ballGeometry2, ballMaterial2);
window.ball2 = ball2;
ball2.position.set(0, 1, 0);
scene2.add(ball2);

// Ajout d'un plan (sol)
const planeGeometry2 = new THREE.PlaneGeometry(20, 30);
const planeMaterial2 = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF,
    side: THREE.DoubleSide,
    wireframe: false,
    emissive: 0x2222ff,
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
    emissive: 0x2222ff,
    transparent: false,
    opacity: 0.5,
    emissiveIntensity: 2
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
camera2.position.set(0, 5, 24);

// Renderer
const canvasT = document.getElementById('pongTournament-canvas');
const renderer2 = new THREE.WebGLRenderer({ canvas: canvasT });
renderer2.setSize(800, 600);

// Ajout de lumière
const ambientLight2 = new THREE.AmbientLight(0xffffff, 0.5);
scene2.add(ambientLight2);

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

// if (window.location.pathname === '/pongTournament') {
document.addEventListener('keydown', (event) => {
    console.log("event Tournament ok")
    // Votre logique existante pour gérer les touches du clavier
    if (typeof gameWebsocket !== 'undefined' && gameWebsocket.readyState === WebSocket.OPEN && window.location.pathname === '/pongTournament') {
        console.log("touches tournoi ok")
        let action;
        if (event.key === "ArrowRight") {
            action = paddleUser2 == paddle12 ? 'move_right_paddle12' : 'move_right_paddle22';
        } else if (event.key === "ArrowLeft") {
            action = paddleUser2 == paddle12 ? 'move_left_paddle12' : 'move_left_paddle22';
        }

        if (action) {
            gameWebsocket.send(JSON.stringify({ type: 'paddle_move_tournament', action }));
        }
    }
});
// }


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
        console.log("balle update: ", newBallState_tournament.ball)
        ball2.position.set(newBallState_tournament.ball.x, 1, newBallState_tournament.ball.z);
    }
};

window.setPlayerRole_tournament = function () {
    const playerRole2 = localStorage.getItem('playerRole');
    if (playerRole2 == 1) {
        paddleUser2 = paddle12;
        console.log("playerRole: ", playerRole2)
        camera2.position.set(0, 5, -24); // Position inversée de la caméra pour le joueur 2
        camera2.rotation.y = Math.PI;
    } else if (playerRole2 == 2) {
        paddleUser2 = paddle22;
        console.log("playerRole: ", playerRole2)
        camera2.position.set(0, 5, 24); // Position inversée de la caméra pour le joueur 2
    }
}

window.updateScores_tournament = function(player1Score_tournament, player2Score_tournament) {
    // Supprimer l'ancien Mesh de la scène
    if (window.scoreText12) {
        scene2.remove(window.scoreText12);
        window.scoreText12.geometry.dispose();
    }

    const newText2 = `player1: ${player1Score_tournament} | player2: ${player2Score_tournament}`;
    const textMaterial2 = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    // Créer une nouvelle géométrie de texte
    const newGeometry2 = new TextGeometry(newText2, {
        font: globalFont2, // Assurez-vous que 'font' est accessible ici
        size: 2,
        height: 0.2
    });

    // Créer un nouveau Mesh et l'ajouter à la scène
    const newScoreText2 = new THREE.Mesh(newGeometry2, textMaterial2);
    newScoreText2.position.set(-15, 15, 0);
    scene2.add(newScoreText2);

    // Mettre à jour la référence globale
    window.scoreText12 = newScoreText2;
};



function animate() {
    requestAnimationFrame(animate);
    renderer2.render(scene2, camera2);
    // composer.render();
}

animate();
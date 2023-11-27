import * as THREE from 'three';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';


const scene = new THREE.Scene();

const paddleMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000, emissive: 0x770000 });

// Raquette 1
const paddle1Geometry = new THREE.BoxGeometry(2, 0.5, 0.5);
const paddle1 = new THREE.Mesh(paddle1Geometry, paddleMaterial);
paddle1.position.set(0, 0, 7);
scene.add(paddle1);

// Raquette 2
const opponentPaddleGeometry = new THREE.BoxGeometry(2, 0.5, 0.5);
const opponentPaddle = new THREE.Mesh(opponentPaddleGeometry, paddleMaterial);
opponentPaddle.position.set(0, 0, -7);
scene.add(opponentPaddle);

// Balle
const ballGeometry = new THREE.SphereGeometry(0.25, 32, 32);
const ballMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00, emissive: 0x777700 });
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.position.set(0, 0, 0);
scene.add(ball);

// Ajout d'un plan (sol)
const planeGeometry = new THREE.PlaneGeometry(10, 15);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = Math.PI / 2; // Rotation pour que le plan soit horizontal
plane.position.set(0, 0, 0);
scene.add(plane);

// Ajout des murs
const wallGeometry = new THREE.BoxGeometry(0.2, 1, 15);
const wallMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

// Créez et positionnez chaque mur selon vos besoins
const wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
wall1.position.set(5, 0, 0)
scene.add(wall1);

// positionnez et ajoutez wall1
const wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
wall2.position.set(-5, 0, 0)
scene.add(wall2)

const wall3 = new THREE.Mesh(wallGeometry, wallMaterial);
wall3.position.set(0, 0, -7.5)
wall3.rotation.y = Math.PI / 2; // Rotation pour que le plan soit horizontal
scene.add(wall3)

// Caméra
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 10;
camera.position.y = 3;
camera.rotation.x = -Math.PI / 7; // Rotation autour de l'axe X pour regarder vers le bas

// Renderer
const canvas = document.getElementById('pong-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize(800, 600);
// document.body.appendChild(renderer.domElement);

// Composer pour le post-traitement
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// Configurer l'Unreal Bloom Pass
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.4, 0.85);
composer.addPass(bloomPass);

// Création de l'OutlinePass
const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
outlinePass.edgeStrength = 3;
outlinePass.edgeGlow = 0.7;
outlinePass.edgeThickness = 2.5;
outlinePass.visibleEdgeColor.set('#ffffff');
outlinePass.hiddenEdgeColor.set('#190a05');

// Ajouter les objets que vous voulez contourner
outlinePass.selectedObjects = [paddle1, opponentPaddle];

composer.addPass(outlinePass);

// Fonction pour mettre à jour la taille du renderer et de la caméra
// function onWindowResize() {
//     camera.aspect = window.innerWidth / window.innerHeight;
//     camera.updateProjectionMatrix();
//     renderer.setSize(window.innerWidth, window.innerHeight);
// }

// Écouter les changements de taille de la fenêtre
// window.addEventListener('resize', onWindowResize, false);

// Ajout de lumière
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
// const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
// directionalLight.position.set(0, 1, 0);
// scene.add(directionalLight);

let paddleSpeed = 0.1;
let localDirection = 0; // -1 pour gauche, 1 pour droite, 0 pour immobile

window.addEventListener('keydown', function (event) {
    // let direction = 0;
    if (event.key === 'ArrowRight') {
        localDirection = 1;
    } else if (event.key === 'ArrowLeft') {
        localDirection = -1;
    }
});

window.addEventListener('keyup', function (event) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        localDirection = 0;
    }
});

let isGameActive = false;

document.addEventListener("startPongGame", startGame);
document.addEventListener("stopPongGame", stopGame);

function startGame() {
    isGameActive = true;
    animate();
}

function stopGame() {
    isGameActive = false;
}

function sendPaddlePositionX() {
    if (gameWebsocket && gameWebsocket.readyState === WebSocket.OPEN) {
        const message = JSON.stringify({
            type: 'paddle_move',
            x: paddle1.position.x
        });

        gameWebsocket.send(message);
        console.log("Envoi de la position du paddle : ", message);
    } else {
        console.error("La connexion WebSocket n'est pas ouverte.");
    }
}



window.updateOpponentPaddlePosition = function (xPosition) {
    opponentPaddle.position.x = xPosition;
    console.log("opponentPaddle position............", xPosition)
};


// gameWebsocket.onmessage = function(event) {
//     const data = JSON.parse(event.data);
//     if (data.type === 'paddle_position') {
//         updateOpponentPaddlePosition(data.x);
//     }
// }


function animate() {
    requestAnimationFrame(animate);
    if (!isGameActive) return;

    const previousX = paddle1.position.x;
    paddle1.position.x += localDirection * paddleSpeed;

    // Vérifiez si la position du paddle a changé
    if (paddle1.position.x !== previousX) {
        console.log("envoi OK.................")
        sendPaddlePositionX();
    }

    composer.render();
}


animate();
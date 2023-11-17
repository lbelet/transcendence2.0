import * as THREE from 'three';

const scene = new THREE.Scene();

// Raquette 1
const paddle1Geometry = new THREE.BoxGeometry(2, 0.5, 0.5);
const paddle1Material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const paddle1 = new THREE.Mesh(paddle1Geometry, paddle1Material);
paddle1.position.set(0, 0, 7);
scene.add(paddle1);

// Raquette 2
const paddle2Geometry = new THREE.BoxGeometry(2, 0.5, 0.5);
const paddle2Material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
const paddle2 = new THREE.Mesh(paddle2Geometry, paddle2Material);
paddle2.position.set(0, 0, -7);
scene.add(paddle2);

// Balle
const ballGeometry = new THREE.SphereGeometry(0.25, 32, 32);
const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
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
const wallGeometry = new THREE.BoxGeometry(1, 2, 15);
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
camera.position.y = 4;
camera.rotation.x = -Math.PI / 7; // Rotation autour de l'axe X pour regarder vers le bas

// Renderer
const canvas = document.getElementById('pong-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize(800, 600); 

// Fonction pour mettre à jour la taille du renderer et de la caméra
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Écouter les changements de taille de la fenêtre
window.addEventListener('resize', onWindowResize, false);

// Ajout de lumière
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 1, 0);
scene.add(directionalLight);

let paddleSpeed = 0.1;
let paddleDirection = 0; // -1 pour gauche, 1 pour droite, 0 pour immobile

// Gestionnaire d'événements pour les touches
window.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowRight') {
        paddleDirection = 1;
    } else if (event.key === 'ArrowLeft') {
        paddleDirection = -1;
    }
});

window.addEventListener('keyup', function (event) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        paddleDirection = 0;
    }
});

// Fonction d'animation du jeu
function animate() {
    requestAnimationFrame(animate);

    // Déplacer le paddle
    paddle1.position.x += paddleDirection * paddleSpeed;

    // Mettre à jour la scène et la caméra
    renderer.render(scene, camera);
}

animate();

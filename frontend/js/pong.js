import * as THREE from 'three';
console.log('JavaScript is working');
console.log(THREE);

const scene = new THREE.Scene();

// Raquette 1
const paddle1Geometry = new THREE.BoxGeometry(2, 1, 0.5);
const paddle1Material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const paddle1 = new THREE.Mesh(paddle1Geometry, paddle1Material);
paddle1.position.set(-2, 0, 0);
scene.add(paddle1);

// Raquette 2
const paddle2Geometry = new THREE.BoxGeometry(2, 1, 0.5);
const paddle2Material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
const paddle2 = new THREE.Mesh(paddle2Geometry, paddle2Material);
paddle2.position.set(2, 0, 0);
scene.add(paddle2);

// Balle
const ballGeometry = new THREE.SphereGeometry(0.25, 32, 32);
const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.position.set(0, 0, 0);
scene.add(ball);

// Caméra
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;
camera.position.y = 2;

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('pong-canvas') });
renderer.setSize(window.innerWidth, window.innerHeight);

// Ajout de lumière
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 1, 0);
scene.add(directionalLight);

// Fonction d'animation
function animate() {
    requestAnimationFrame(animate);

    // Mise à jour de la logique du jeu ici

    renderer.render(scene, camera);
}

animate();

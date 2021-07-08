import { configure, Vector2, Vector3 } from "@math.gl/core";
import { World } from "./world.js";
import { WorldGenerator } from "./gen.js";
import * as THREE from "three";
import { perlinNoise1D } from "@firenodes/core";
import "regenerator-runtime/runtime";

configure({ debug: true });

export class Game {
    winDim = new Vector2(500, 500);
    world: World = new World();
    cellSize = 1;
    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;

    constructor() {
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            1.0,
            1000.0
        );
        this.camera.position.z = 5;
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
    }

    async init(): Promise<void> {
        new WorldGenerator(this.world).generate();

        const size = this.world.size.x * this.world.size.z;
        const seed = Float32Array.from({ length: size }, () =>
            Math.floor(Math.random() * 500)
        );
        const noise = perlinNoise1D(size, seed, 7);

        this.world.data.forEach((cell) => {
            cell.age += 0.01;
            const pos = cell.position;
            // pos.y = 0;
            pos.y = noise[pos.x];
            console.log(pos);
            const geometry = new THREE.BoxGeometry();
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(pos.x, pos.y, pos.z);
            this.scene.add(cube);
        });
        this.animate();
    }

    animate(): void {
        requestAnimationFrame(this.animate.bind(this));
        this.renderer.render(this.scene, this.camera);
    }
}

window.addEventListener("load", () => {
    new Game()
        .init()
        .then(() => {
            console.log("Game initialized.");
        })
        .catch((err) => {
            console.error(err);
        });
});

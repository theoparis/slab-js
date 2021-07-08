import { Vector3 } from "@math.gl/core";
import { makeNoise2D } from "fast-simplex-noise";
import { Cell, CellFn, World } from "./world";

export const createGrid = (width: number, depth: number): Vector3[] => {
    const arr: Vector3[] = [];
    for (let x = 0; x < width; x++) {
        for (let z = 0; z < depth; z++) {
            const pos = new Vector3(x, 0, z);
            arr.push(pos);
        }
    }
    return arr;
};

export class WorldGenerator {
    constructor(public readonly world: World) {}

    generate(): World {
        const terrainSettings = this.world.settings.terrain;

        return this.world;
    }
}

import { Vector3 } from "@math.gl/core";
import { makeNoise2D } from "fast-simplex-noise";
import { Cell, CellFn, IWorld, World } from "./world.js";

export const wrapNumber = (n: number, max: number): number =>
    (max + (n % max)) % max;

export const posToIndex = (v: Vector3, cols = 10, rows = 10): number =>
    wrapNumber(v.z, rows) * cols + wrapNumber(v.x, cols);

export const indexToPos = (index: number, cols = 10): Vector3 =>
    new Vector3(index % cols, 0, Math.floor(index / cols));

export const createGrid = (
    cols: number,
    rows: number,
    cellFn: CellFn = () => ({
        alive: true,
        age: 0,
        position: new Vector3()
    })
): Array<Cell> => new Array(cols * rows).fill("").map(cellFn);

export class WorldGenerator {
    constructor(public readonly world: IWorld) {}

    generate(): World {
        const size = this.world.size;

        this.world.data = createGrid(size.x, size.z, (d, i) => {
            const pos = indexToPos(i, size.x);
            pos.add(
                new Vector3(
                    0,
                    makeNoise2D(Math.random)(size.x, size.z) *
                        this.world.noiseOctaves,
                    0
                )
            );

            return {
                alive: true,
                age: 0,
                position: pos
            };
        });
        return this.world;
    }
}

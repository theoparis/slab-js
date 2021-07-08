import { Vector3 } from "@math.gl/core";

export interface Cell {
    alive: boolean;
    age: number;
    position: Vector3;
}

export interface CellFn {
    (d: number, i: number): Cell;
}

export interface IWorld {
    data: Cell[];
    size: Vector3;
    noiseOctaves: number;
    seed: number;
}

export class World implements IWorld {
    data: Cell[] = [];
    noiseOctaves = 5;
    seed = 20;
    size: Vector3 = new Vector3(20, 25, 20);
}

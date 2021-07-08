import { Vector3 } from "@math.gl/core";
import { Optimization, TerrainOptions } from "./util/basicTypes";
import { EaseInWeak, Linear } from "./util/core";
import { DiamondSquare } from "./util/generators";

export interface Cell {
    alive: boolean;
    age: number;
    position: Vector3;
}

export interface CellFn {
    (pos: Vector3): Cell;
}

export interface IWorld {
    data: Cell[];
    size: Vector3;
    noiseOctaves: number;
    seed: number;
}

export const defaultTerrainOptions: TerrainOptions = {
    after: undefined,
    easing: Linear,
    heightmap: DiamondSquare,
    maxHeight: 100,
    minHeight: -100,
    optimization: Optimization.NONE,
    frequency: 2.5,
    steps: 1,
    stretch: true,
    turbulent: false,
    useBufferGeometry: false,
    widthSegments: 63,
    width: 100,
    heightSegments: 63,
    height: 100
};

export class WorldSettings {
    terrain: Partial<TerrainOptions> = defaultTerrainOptions;
}

export class World {
    data: Cell[] = [];
    settings = new WorldSettings();
}

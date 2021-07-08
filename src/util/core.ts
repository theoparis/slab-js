import { Vector3 } from "@math.gl/core";

import { TerrainOptions } from "./basicTypes";

/**
 * Oh god, please no
 * Get a 2D array of heightmap values from a 1D array of plane vertices.
 *
 * @param vertices
 *   A 1D array containing the vertices of the plane geometry representing the
 *   terrain, where the z-value of the vertices represent the terrain's
 *   heightmap.
 * @param options
 *   A map of settings defining properties of the terrain. The only properties
 *   that matter here are `xSegments` and `ySegments`, which represent how many
 *   vertices wide and deep the terrain plane is, respectively (and therefore
 *   also the dimensions of the returned array).
 *
 * @return
 *   A 2D array representing the terrain's heightmap.
 */
export function toArray2D({
    vertices,
    options
}: {
    vertices: Vector3[];
    options: TerrainOptions;
}): Float64Array[] {
    const tgt = new Array<Float64Array>(options.widthSegments + 1),
        xl = options.widthSegments + 1,
        yl = options.heightSegments + 1;
    let i = 0,
        j = 0;
    for (i = 0; i < xl; i++) {
        tgt[i] = new Float64Array(options.heightSegments + 1);
        for (j = 0; j < yl; j++) tgt[i][j] = vertices[j * xl + i].z;
    }
    return tgt;
}

/**
 * Set the height of plane vertices from a 2D array of heightmap values.
 *
 * @param vertices
 *   A 1D array containing the vertices of the plane geometry representing the
 *   terrain, where the z-value of the vertices represent the terrain's
 *   heightmap.
 * @param src
 *   A 2D array representing a heightmap to apply to the terrain.
 */
export function fromArray2D(vertices: Vector3[], src: Float64Array[]) {
    for (let i = 0, xl = src.length; i < xl; i++)
        for (let j = 0, yl = src[i].length; j < yl; j++)
            vertices[j * xl + i].z = src[i][j];
}

/**
 * Get a 1D array of heightmap values from a 1D array of plane vertices.
 *
 * @param {THREE.Vector3[]} vertices
 *   A 1D array containing the vertices of the plane geometry representing the
 *   terrain, where the z-value of the vertices represent the terrain's
 *   heightmap.
 *
 * @return {Number[]}
 *   A 1D array representing the terrain's heightmap.
 */
export function toArray1D(vertices: Vector3[]): Float64Array {
    const tgt = new Float64Array(vertices.length);
    for (let i = 0, l = tgt.length; i < l; i++) tgt[i] = vertices[i].z;

    return tgt;
}

/**
 * Set the height of plane vertices from a 1D array of heightmap values.
 *
 * @param {THREE.Vector3[]} vertices
 *   A 1D array containing the vertices of the plane geometry representing the
 *   terrain, where the z-value of the vertices represent the terrain's
 *   heightmap.
 * @param {Number[]} src
 *   A 1D array representing a heightmap to apply to the terrain.
 */
export function fromArray1D(vertices: Vector3[], src: Float64Array) {
    for (let i = 0, l = Math.min(vertices.length, src.length); i < l; i++)
        vertices[i].z = src[i];
}

/**
 * Randomness interpolation functions.
 */
export const Linear = (x: number) => x;

// x = [0, 1], x^2
export const EaseIn = (x: number) => x * x;

// x = [0, 1], -x(x-2)
export const EaseOut = (x: number) => -x * (x - 2);

// x = [0, 1], x^2(3-2x)
// Nearly identical alternatives: 0.5+0.5*cos(x*pi-pi), x^a/(x^a+(1-x)^a) (where a=1.6 seems nice)
// For comparison: http://www.wolframalpha.com/input/?i=x^1.6%2F%28x^1.6%2B%281-x%29^1.6%29%2C+x^2%283-2x%29%2C+0.5%2B0.5*cos%28x*pi-pi%29+from+0+to+1
export const EaseInOut = (x: number) => x * x * (3 - 2 * x);

// x = [0, 1], 0.5*(2x-1)^3+0.5
export function InEaseOut(x: number) {
    const y = 2 * x - 1;
    return 0.5 * y * y * y + 0.5;
}

// x = [0, 1], x^1.55
export const EaseInWeak = (x: number) => Math.pow(x, 1.55);

// x = [0, 1], x^7
export const EaseInStrong = (x: number) => x * x * x * x * x * x * x;

import { Vector3 } from "@math.gl/core";

import { HeightmapFunction, TerrainOptions } from "./basicTypes";
import { Linear } from "./core";
import { applyTerrainClamp, SmoothMedian } from "./filters";
import { perlin, seed, simplex } from "./noise";

interface Pass {
    method: HeightmapFunction;
    amplitude?: number;
    frequency?: number;
}

/*
 * A utility for generating heightmap functions by additive composition.
 *
 * @param {THREE.Vector3[]} g
 *   The vertex array for plane geometry to modify with heightmap data. This
 *   method sets the `z` property of each vertex.
 * @param {Object} [options]
 *   A map of settings that control how the terrain is constructed and
 *   displayed. Valid values are the same as those for the `options` parameter
 *   of {@link THREE.Terrain}().
 * @param {Object[]} passes
 *   Determines which heightmap functions to compose to create a new one.
 *   Consists of an array of objects with the following properties:
 *   - `method`: Contains something that will be passed around as an
 *     `options.heightmap` (a heightmap-generating function or a heightmap image)
 *   - `amplitude`: A multiplier for the heightmap of the pass. Applied before
 *     the result of the pass is added to the result of previous passes.
 *   - `frequency`: For terrain generation methods that support it (Perlin,
 *     Simplex, and Worley) the octave of randomness. This basically controls
 *     how big features of the terrain will be (higher frequencies result in
 *     smaller features). Often running multiple generation functions with
 *     different frequencies and amplitudes results in nice detail.
 */
export function MultiPass(
    g: Vector3[],
    options: TerrainOptions,
    passes: Pass[]
) {
    const clonedOptions = { ...options };
    const range = options.maxHeight - options.minHeight;
    for (let i = 0, l = passes.length; i < l; i++) {
        const pass = passes[i];
        const amp = typeof pass.amplitude === "undefined" ? 1 : pass.amplitude;
        const move = 0.5 * (range - range * amp);
        clonedOptions.maxHeight = options.maxHeight - move;
        clonedOptions.minHeight = options.minHeight + move;
        const freq = pass.frequency;
        clonedOptions.frequency =
            typeof freq === "undefined" ? options.frequency : freq;
        pass.method(g, clonedOptions);
    }
}

/**
 * Generate random terrain using a curve.
 *
 * @param {THREE.Vector3[]} g
 *   The vertex array for plane geometry to modify with heightmap data. This
 *   method sets the `z` property of each vertex.
 * @param {Object} options
 *   A map of settings that control how the terrain is constructed and
 *   displayed. Valid values are the same as those for the `options` parameter
 *   of {@link THREE.Terrain}().
 * @param {Function} curve
 *   A function that takes an x- and y-coordinate and returns a z-coordinate.
 *   For example, `function(x, y) { return Math.sin(x*y*Math.PI*100); }`
 *   generates sine noise, and `function() { return Math.random(); }` sets the
 *   vertex elevations entirely randomly. The function's parameters (the x- and
 *   y-coordinates) are given as percentages of a phase (i.e. how far across
 *   the terrain in the relevant direction they are).
 */
export function Curve(
    g: Vector3[],
    options: TerrainOptions,
    curve: (x: number, y: number) => number
) {
    const range = (options.maxHeight - options.minHeight) * 0.5,
        scalar =
            options.frequency /
            (Math.min(options.widthSegments, options.heightSegments) + 1);
    for (
        let i = 0,
            xl = options.widthSegments + 1,
            yl = options.heightSegments + 1;
        i < xl;
        i++
    ) {
        for (let j = 0; j < yl; j++) {
            g[j * xl + i].z += curve(i * scalar, j * scalar) * range;
        }
    }
}

/**
 * Generate random terrain using the Cosine waves.
 *
 * Parameters are the same as those for {@link THREE.Terrain.DiamondSquare}.
 */
export function Cosine(g: Vector3[], options: TerrainOptions) {
    const amplitude = (options.maxHeight - options.minHeight) * 0.5,
        frequencyScalar =
            (options.frequency * Math.PI) /
            (Math.min(options.widthSegments, options.heightSegments) + 1),
        phase = Math.random() * Math.PI * 2;
    for (let i = 0, xl = options.widthSegments + 1; i < xl; i++) {
        for (let j = 0, yl = options.heightSegments + 1; j < yl; j++) {
            g[j * xl + i].z +=
                amplitude *
                (Math.cos(i * frequencyScalar + phase) +
                    Math.cos(j * frequencyScalar + phase));
        }
    }
}

/**
 * Generate random terrain using layers of Cosine waves.
 *
 * Parameters are the same as those for {@link THREE.Terrain.DiamondSquare}.
 */
export function CosineLayers(g: Vector3[], options: TerrainOptions) {
    MultiPass(g, options, [
        { method: Cosine, amplitude: 1, frequency: 2.5 },
        { method: Cosine, amplitude: 0.1, frequency: 12 },
        { method: Cosine, amplitude: 0.05, frequency: 15 },
        { method: Cosine, amplitude: 0.025, frequency: 20 }
    ]);
}

/**
 * Generate random terrain using the Diamond-Square method.
 *
 * Based on https://github.com/srchea/Terrain-Generation/blob/master/js/classes/TerrainGeneration.js
 *
 * @param {THREE.Vector3[]} g
 *   The vertex array for plane geometry to modify with heightmap data. This
 *   method sets the `z` property of each vertex.
 * @param {Object} options
 *   A map of settings that control how the terrain is constructed and
 *   displayed. Valid values are the same as those for the `options` parameter
 *   of {@link THREE.Terrain}().
 */
export function DiamondSquare(g: Vector3[], options: TerrainOptions): void {
    const ceilPowerOfTwo = (value: number): number =>
        Math.pow(2, Math.ceil(Math.log(value) / Math.LN2));

    // Set the segment length to the smallest power of 2 that is greater than
    // the number of vertices in either dimension of the plane
    const segments = ceilPowerOfTwo(
        Math.max(options.widthSegments, options.heightSegments) + 1
    );

    // Initialize heightmap
    const size = segments + 1,
        heightmap: Float64Array[] = [],
        xl = options.widthSegments + 1,
        yl = options.heightSegments + 1;
    let i = 0,
        j = 0,
        smoothing = options.maxHeight - options.minHeight;

    for (i = 0; i <= segments; i++) {
        heightmap[i] = new Float64Array(segments + 1);
    }

    // Generate heightmap
    for (let l = segments; l >= 2; l /= 2) {
        const half = Math.round(l * 0.5),
            whole = Math.round(l);
        let x, y, avg, d;
        smoothing /= 2;
        // square
        for (x = 0; x < segments; x += whole) {
            for (y = 0; y < segments; y += whole) {
                d = Math.random() * smoothing * 2 - smoothing;
                avg =
                    heightmap[x][y] + // top left
                    heightmap[x + whole][y] + // top right
                    heightmap[x][y + whole] + // bottom left
                    heightmap[x + whole][y + whole]; // bottom right
                avg *= 0.25;
                heightmap[x + half][y + half] = avg + d;
            }
        }
        // diamond
        for (x = 0; x < segments; x += half) {
            for (y = (x + half) % l; y < segments; y += l) {
                d = Math.random() * smoothing * 2 - smoothing;
                avg =
                    heightmap[(x - half + size) % size][y] + // middle left
                    heightmap[(x + half) % size][y] + // middle right
                    heightmap[x][(y + half) % size] + // middle top
                    heightmap[x][(y - half + size) % size]; // middle bottom
                avg *= 0.25;
                avg += d;
                heightmap[x][y] = avg;
                // top and right edges
                if (x === 0) heightmap[segments][y] = avg;
                if (y === 0) heightmap[x][segments] = avg;
            }
        }
    }

    // Apply heightmap
    for (i = 0; i < xl; i++) {
        for (j = 0; j < yl; j++) {
            g[j * xl + i].z += heightmap[i][j];
        }
    }

    // THREE.Terrain.SmoothConservative(g, options);
}

/**
 * Generate random terrain using the Fault method.
 *
 * Based on http://www.lighthouse3d.com/opengl/terrain/index.php3?fault
 * Repeatedly draw random lines that cross the terrain. Raise the terrain on
 * one side of the line and lower it on the other.
 *
 * Parameters are the same as those for {@link THREE.Terrain.DiamondSquare}.
 */
export function Fault(g: Vector3[], options: TerrainOptions) {
    const d = Math.sqrt(
            options.widthSegments * options.widthSegments +
                options.heightSegments * options.heightSegments
        ),
        iterations = d * options.frequency,
        range = (options.maxHeight - options.minHeight) * 0.5,
        displacement = range / iterations,
        smoothDistance =
            Math.min(
                options.width / options.widthSegments,
                options.height / options.heightSegments
            ) * options.frequency;
    for (let k = 0; k < iterations; k++) {
        const v = Math.random(),
            a = Math.sin(v * Math.PI * 2),
            b = Math.cos(v * Math.PI * 2),
            c = Math.random() * d - d * 0.5;
        for (let i = 0, xl = options.widthSegments + 1; i < xl; i++) {
            for (let j = 0, yl = options.heightSegments + 1; j < yl; j++) {
                const distance = a * i + b * j - c;
                if (distance > smoothDistance) {
                    g[j * xl + i].z += displacement;
                } else if (distance < -smoothDistance) {
                    g[j * xl + i].z -= displacement;
                } else {
                    g[j * xl + i].z +=
                        Math.cos((distance / smoothDistance) * Math.PI * 2) *
                        displacement;
                }
            }
        }
    }
    // Smooth(g, options);
}

export type ShapeFunction = ({ x, y }: { x: number; y: number }) => void;

/**
 * Generate random terrain using the Perlin Noise method.
 *
 * Parameters are the same as those for {@link THREE.Terrain.DiamondSquare}.
 */
export function Perlin(g: Vector3[], options: TerrainOptions) {
    seed(Math.random());
    const range = (options.maxHeight - options.minHeight) * 0.5,
        divisor =
            (Math.min(options.widthSegments, options.heightSegments) + 1) /
            options.frequency;
    for (let i = 0, xl = options.widthSegments + 1; i < xl; i++) {
        for (let j = 0, yl = options.heightSegments + 1; j < yl; j++) {
            g[j * xl + i].z += perlin(i / divisor, j / divisor) * range;
        }
    }
}

/**
 * Generate random terrain using the Perlin and Diamond-Square methods composed.
 *
 * Parameters are the same as those for {@link THREE.Terrain.DiamondSquare}.
 */
export function PerlinDiamond(g1: Vector3[], options: TerrainOptions) {
    MultiPass(g1, options, [
        { method: Perlin },
        { method: DiamondSquare, amplitude: 0.75 },
        {
            method: (g: Vector3[], o: TerrainOptions) => SmoothMedian(g, o)
        }
    ]);
}

/**
 * Generate random terrain using layers of Perlin noise.
 *
 * Parameters are the same as those for {@link THREE.Terrain.DiamondSquare}.
 */
export function PerlinLayers(g: Vector3[], options: TerrainOptions) {
    MultiPass(g, options, [
        { method: Perlin, frequency: 1.25 },
        { method: Perlin, amplitude: 0.05, frequency: 2.5 },
        { method: Perlin, amplitude: 0.35, frequency: 5 },
        { method: Perlin, amplitude: 0.15, frequency: 10 }
    ]);
}

/**
 * Generate random terrain using the Simplex Noise method.
 *
 * Parameters are the same as those for {@link THREE.Terrain.DiamondSquare}.
 *
 * See https://github.com/mrdoob/three.js/blob/master/examples/webgl_terrain_dynamic.html
 * for an interesting comparison where the generation happens in GLSL.
 */
export function Simplex(g: Vector3[], options: TerrainOptions) {
    seed(Math.random());
    const range = (options.maxHeight - options.minHeight) * 0.5,
        divisor =
            ((Math.min(options.widthSegments, options.heightSegments) + 1) *
                2) /
            options.frequency;
    for (let i = 0, xl = options.widthSegments + 1; i < xl; i++) {
        for (let j = 0, yl = options.heightSegments + 1; j < yl; j++) {
            g[j * xl + i].z += simplex(i / divisor, j / divisor) * range;
        }
    }
}

/**
 * Generate random terrain using layers of Simplex noise.
 *
 * Parameters are the same as those for {@link THREE.Terrain.DiamondSquare}.
 */
export function SimplexLayers(g: Vector3[], options: TerrainOptions) {
    MultiPass(g, options, [
        { method: Simplex, frequency: 1.25 },
        { method: Simplex, amplitude: 0.5, frequency: 2.5 },
        { method: Simplex, amplitude: 0.25, frequency: 5 },
        { method: Simplex, amplitude: 0.125, frequency: 10 },
        { method: Simplex, amplitude: 0.0625, frequency: 20 }
    ]);
}

/**
 * Generate a heightmap using white noise.
 *
 * @param {THREE.Vector3[]} g The terrain vertices.
 * @param {Object} options Settings
 * @param {Number} scale The resolution of the resulting heightmap.
 * @param {Number} segments The width of the target heightmap.
 * @param {Number} range The altitude of the noise.
 * @param {Number[]} data The target heightmap.
 */
function WhiteNoise(
    g: Vector3[],
    options: TerrainOptions,
    scale: number,
    segments: number,
    range: number,
    data: Float64Array
) {
    if (scale > segments) return;
    const inc = Math.floor(segments / scale);
    let i = 0,
        j = 0,
        xl = segments,
        yl = segments,
        lastX = -inc,
        lastY = -inc;
    // Walk over the target. For a target of size W and a resolution of N,
    // set every W/N points (in both directions).
    for (i = 0; i <= xl; i += inc) {
        for (j = 0; j <= yl; j += inc) {
            const k = j * xl + i;
            data[k] = Math.random() * range;
            if (lastX < 0 && lastY < 0) continue;
            /* c b *
             * l t */
            const t = data[k],
                l = data[j * xl + (i - inc)] || t, // left
                b = data[(j - inc) * xl + i] || t, // bottom
                c = data[(j - inc) * xl + (i - inc)] || t; // corner
            // Interpolate between adjacent points to set the height of
            // higher-resolution target data.
            for (let x = lastX; x < i; x++) {
                for (let y = lastY; y < j; y++) {
                    if (x === lastX && y === lastY) continue;
                    const z = y * xl + x;
                    if (z < 0) continue;
                    const px = (x - lastX) / inc,
                        py = (y - lastY) / inc,
                        r1 = px * b + (1 - px) * c,
                        r2 = px * t + (1 - px) * l;
                    data[z] = py * r2 + (1 - py) * r1;
                }
            }
            lastY = j;
        }
        lastX = i;
        lastY = -inc;
    }
    // Assign the temporary data back to the actual terrain heightmap.
    for (i = 0, xl = options.widthSegments + 1; i < xl; i++) {
        for (j = 0, yl = options.heightSegments + 1; j < yl; j++) {
            // http://stackoverflow.com/q/23708306/843621
            const kg = j * xl + i,
                kd = j * segments + i;
            g[kg].z += data[kd];
        }
    }
}

/**
 * Generate random terrain using value noise.
 *
 * The basic approach of value noise is to generate white noise at a
 * smaller octave than the target and then interpolate to get a higher-
 * resolution result. This is then repeated at different resolutions.
 *
 * Parameters are the same as those for Terrain.DiamondSquare
 */
export function generateFromValueNoise(g: Vector3[], options: TerrainOptions) {
    // Set the segment length to the smallest power of 2 that is greater
    // than the number of vertices in either dimension of the plane
    const segments = Math.floor(
        Math.pow(Math.max(options.widthSegments, options.heightSegments) + 1, 2)
    );

    // Store the array of white noise outside of the WhiteNoise function to
    // avoid allocating a bunch of unnecessary arrays; we can just
    // overwrite old data each time WhiteNoise() is called.
    const data = new Float64Array((segments + 1) * (segments + 1));

    // Layer white noise at different resolutions.
    const range = options.maxHeight - options.minHeight;
    for (let i = 2; i < 7; i++) {
        WhiteNoise(
            g,
            options,
            Math.pow(2, i),
            segments,
            range * Math.pow(2, 2.4 - i * 1.2),
            data
        );
    }

    // White noise creates some weird artifacts; fix them.
    // THREE.Terrain.Smooth(g, options, 1);
    applyTerrainClamp(g, {
        maxHeight: options.maxHeight,
        minHeight: options.minHeight,
        stretch: true,
        easing: Linear
    });
}

/**
 * Generate random terrain using Weierstrass functions.
 *
 * Weierstrass functions are known for being continuous but not differentiable
 * anywhere. This produces some nice shapes that look terrain-like, but can
 * look repetitive from above.
 *
 * Parameters are the same as those for {@link THREE.Terrain.DiamondSquare}.
 */
export function Weierstrass(g: Vector3[], options: TerrainOptions) {
    const range = (options.maxHeight - options.minHeight) * 0.5,
        dir1 = Math.random() < 0.5 ? 1 : -1,
        dir2 = Math.random() < 0.5 ? 1 : -1,
        r11 = 0.5 + Math.random() * 1.0,
        r12 = 0.5 + Math.random() * 1.0,
        r13 = 0.025 + Math.random() * 0.1,
        r14 = -1.0 + Math.random() * 2.0,
        r21 = 0.5 + Math.random() * 1.0,
        r22 = 0.5 + Math.random() * 1.0,
        r23 = 0.025 + Math.random() * 0.1,
        r24 = -1.0 + Math.random() * 2.0;
    for (let i = 0, xl = options.widthSegments + 1; i < xl; i++) {
        for (let j = 0, yl = options.heightSegments + 1; j < yl; j++) {
            let sum = 0;
            for (let k = 0; k < 20; k++) {
                const x =
                    Math.pow(1 + r11, -k) *
                    Math.sin(
                        Math.pow(1 + r12, k) *
                            (i + 0.25 * Math.cos(j) + r14 * j) *
                            r13
                    );
                const y =
                    Math.pow(1 + r21, -k) *
                    Math.sin(
                        Math.pow(1 + r22, k) *
                            (j + 0.25 * Math.cos(i) + r24 * i) *
                            r23
                    );
                sum -= Math.exp(dir1 * x * x + dir2 * y * y);
            }
            g[j * xl + i].z += sum * range;
        }
    }
    applyTerrainClamp(g, options);
}

import * as THREE from "three";
import React, { useRef, useEffect } from "react";
import { Vector3 } from "@math.gl/core";
import { TerrainOptions } from "../util/basicTypes";
import {
    applyTurbulenceTurbulence,
    applyTerrainStep,
    applyTerrainSmooth,
    applyTerrainClamp
} from "../util/filters";
import { useControls } from "leva";
import { simplex } from "../util/noise";

/**
 * Normalize the terrain after applying a heightmap or filter.
 *
 * This applies turbulence, steps, and height clamping; calls the `after`
 * callback; updates normals and the bounding sphere; and marks vertices as
 * dirty.
 *
 * @param mesh the terrain mesh.
 * @param options
 * A map of settings that control how the terrain is constructed and
 * displayed
 */
export function normalizeTerrain(vertices: Vector3[], options: TerrainOptions) {
    if (options.turbulent) applyTurbulenceTurbulence(vertices, options);

    if (options.steps && options.steps > 1) {
        applyTerrainStep(vertices, options.steps);
        applyTerrainSmooth(vertices, options);
    }
    // Keep the terrain within the allotted height range if necessary, and do easing.
    applyTerrainClamp(vertices, options);
    // Call the "after" callback
    if (typeof options.after === "function") options.after(vertices, options);
}

export const Terrain = (props: {
    options: {
        material?: THREE.Material;
    } & TerrainOptions;
}) => {
    const geoRef = useRef<THREE.PlaneGeometry>();
    const terrain = useControls({
        maxHeight: props.options.maxHeight,
        minHeight: props.options.minHeight,
        optimization: props.options.optimization,
        frequency: props.options.frequency,
        steps: props.options.steps,
        stretch: props.options.stretch,
        turbulent: props.options.turbulent,
        useBufferGeometry: props.options.useBufferGeometry,
        widthSegments: props.options.widthSegments,
        width: props.options.width,
        heightSegments: props.options.heightSegments,
        height: props.options.height
    });

    useEffect(() => {
        const geometry = geoRef.current;

        if (!geometry) return;

        //perform height mapping
        const terrainMap: Vector3[] = [];

        for (let x = 0; x < terrain.width; x++) {
            for (let z = 0; z < terrain.height; z++) {
                const y = simplex(x, z) * terrain.frequency;
                terrainMap.push(new Vector3(x, y, z));
            }
        }

        // props.options.heightmap(vertices, props.options);

        const positions: number[] = [];
        const normals: number[] = [];
        const uvs: number[] = [];
        const indices: number[] = [];

        const STARTX = -0.5;

        const STARTZ = -0.5;
        const incx = terrain.width / (terrain.width - 1);
        const incz = Math.abs(STARTZ * 2) / (terrain.height - 1);

        for (let row = 0; row < terrain.width; row++) {
            for (let col = 0; col < terrain.height; col++) {
                const v = terrainMap.find((t) => t.x === row && t.z === col);
                if (!v)
                    throw new Error(
                        `terrainmap value at ${row}, ${col} is undefined`
                    );
                // Create vertex for current position
                positions.push(STARTX + v.x * incx); // x
                positions.push(v.y); //y
                positions.push(STARTZ + v.z * incz); //z

                // Set texture coordinates
                uvs.push((1 * col) / terrain.width);
                uvs.push((1 * row) / terrain.height);

                // Create indices
                if (col < terrain.width - 1 && row < terrain.height - 1) {
                    const leftTop = row * terrain.width + col;
                    const leftBottom = (row + 1) * terrain.width + col;
                    const rightBottom = (row + 1) * terrain.width + col + 1;
                    const rightTop = row * terrain.width + col + 1;

                    indices.push(rightTop);
                    indices.push(leftBottom);
                    indices.push(leftTop);

                    indices.push(rightBottom);
                    indices.push(leftBottom);
                    indices.push(rightTop);
                }
            }
        }

        const positionNumComponents = 3;
        const normalNumComponents = 3;
        const uvNumComponents = 2;
        geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(
                new Float32Array(positions),
                positionNumComponents
            )
        );
        geometry.setAttribute(
            "normal",
            new THREE.BufferAttribute(
                new Float32Array(normals),
                normalNumComponents
            )
        );
        geometry.setAttribute(
            "uv",
            new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents)
        );
        geometry.setIndex(indices);

        // Mark the geometry as having changed and needing updates.
        geometry.computeBoundingSphere();
        geometry.computeVertexNormals();
    }, [geoRef, terrain, props.options]);

    return (
        <mesh
            material={
                props.options.material ??
                new THREE.MeshStandardMaterial({
                    color: 0x44dd66,
                    wireframe: true
                })
            }
            // scale={[terrain.width, 1, terrain.height]}
        >
            <planeBufferGeometry
                attach="geometry"
                ref={geoRef}
                args={[
                    terrain.width,
                    terrain.height,
                    terrain.widthSegments,
                    terrain.heightSegments
                ]}
            />
        </mesh>
    );
};

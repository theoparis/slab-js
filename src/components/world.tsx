import { Box } from "./box";
import React, { useEffect, useState } from "react";
import { World } from "../world";
import { WorldGenerator } from "../gen";
import { useControls } from "leva";

export const WorldRenderer = () => {
    const [world, setWorld] = useState<World>(new World());
    const { octaves, seedScale } = useControls({ octaves: 7, seedScale: 500 });

    useEffect(() => {
        let newWorld: World = world;
        newWorld.noiseOctaves = octaves;
        newWorld.seed = seedScale;
        newWorld = new WorldGenerator(newWorld).generate();
        setWorld(newWorld);
        console.log(
            world.data.map((d) => d.position).filter((_v, i) => i < 10)
        );
    }, [world, octaves, seedScale]);

    return (
        <>
            {world.data.map((c) => (
                <Box key={c.position.toString()} position={c.position} />
            ))}
        </>
    );
};

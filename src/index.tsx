import ReactDOM from "react-dom";
import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Terrain } from "./components/terrain";
import { defaultTerrainOptions } from "./world";

ReactDOM.render(
    <div
        style={{
            position: "relative",
            width: 800,
            height: 800
        }}
    >
        <Canvas onCreated={(state) => state.gl.setClearColor("black")}>
            <ambientLight />
            <pointLight position={[0, 1, 0]} />
            <Terrain options={defaultTerrainOptions} />
            <OrbitControls />
        </Canvas>
    </div>,
    document.getElementById("root")
);

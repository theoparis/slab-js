import ReactDOM from "react-dom";
import React from "react";
import { Canvas } from "@react-three/fiber";
import { WorldRenderer } from "./components/world";
import { OrbitControls } from "@react-three/drei";

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
            <pointLight position={[10, 10, 10]} />
            <WorldRenderer />
            <OrbitControls />
        </Canvas>
    </div>,
    document.getElementById("root")
);

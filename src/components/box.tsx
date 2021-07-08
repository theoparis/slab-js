import React, {
    PropsWithChildren,
    Component,
    createRef,
    RefObject
} from "react";
import * as THREE from "three";
import { Vector3 } from "@math.gl/core";

export type BoxProps = PropsWithChildren<{ position: Vector3 }>;

export class Box extends Component<
    BoxProps,
    { hovered: boolean; active: boolean }
> {
    mesh: RefObject<THREE.Mesh>;

    constructor(props: BoxProps) {
        super(props);
        this.state = {
            active: false,
            hovered: false
        };
        this.mesh = createRef<THREE.Mesh>();
    }

    componentDidMount() {}

    render() {
        return (
            <mesh
                position={
                    new THREE.Vector3(
                        this.props.position.x,
                        this.props.position.y,
                        this.props.position.z
                    )
                }
                scale={new THREE.Vector3(1, 1, 1)}
                ref={this.mesh}
                onClick={() =>
                    this.setState((prev) => ({ ...prev, active: !prev.active }))
                }
                onPointerOver={() =>
                    this.setState((prev) => ({ ...prev, hover: true }))
                }
                onPointerOut={() =>
                    this.setState((prev) => ({ ...prev, hover: false }))
                }
            >
                <boxGeometry args={[1, 2, 3]} />
                <meshStandardMaterial
                    color={this.state.hovered ? "hotpink" : "orange"}
                />
            </mesh>
        );
    }
}

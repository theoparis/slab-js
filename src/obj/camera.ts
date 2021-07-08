import { Camera } from "three";

export interface TPCParams {
    camera: Camera
}

export class ThirdPersonCamera {
    constructor(public readonly params: TPCParams) {}
}
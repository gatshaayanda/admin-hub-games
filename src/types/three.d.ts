declare module 'three' {
  export type Object3D = any; export const Object3D: any;
  export type Clock = any; export const Clock: any;
  export type Vector3 = any; export const Vector3: any;
  export type Group = any; export const Group: any;
  export type Mesh = any; export const Mesh: any;
  export type Material = any; export type BufferGeometry = any;
  export type WebGLRenderer = any; export const WebGLRenderer: any;
  export type Scene = any; export const Scene: any;
  export type PerspectiveCamera = any; export const PerspectiveCamera: any;
  export type HemisphereLight = any; export const HemisphereLight: any;
  export type DirectionalLight = any; export const DirectionalLight: any;
  export type MeshStandardMaterial = any; export const MeshStandardMaterial: any;
  export type MeshToonMaterial = any; export const MeshToonMaterial: any;
  export type MeshBasicMaterial = any; export const MeshBasicMaterial: any;
  export type CanvasTexture = any; export const CanvasTexture: any;
  export type Color = any; export const Color: any;
  export type Fog = any; export const Fog: any;
  export const CapsuleGeometry: any; export const SphereGeometry: any;
  export const CylinderGeometry: any; export const ConeGeometry: any;
  export const BoxGeometry: any; export const PlaneGeometry: any;
  export const CircleGeometry: any; export const TorusGeometry: any;
  export const SRGBColorSpace: any; export const PCFSoftShadowMap: any;
  export const ACESFilmicToneMapping: any;
}
declare module 'three/addons/loaders/GLTFLoader.js' {
  export class GLTFLoader {
    load(url: string, onLoad: (gltf: any) => void, onProgress?: (event: any) => void, onError?: (error: any) => void): void;
  }
}
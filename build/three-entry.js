/* Entry point for the vendored three.js bundle.
   Re-exports only the classes assets/js/scroll-scene.js actually uses, so
   esbuild can drop loaders, controls, post-processing, the WebGPU backend
   and every unused material and geometry. Regenerate with:

     npm run build:three

   Keep this list in sync with the scene — an import that is missing here
   shows up as `undefined is not a constructor` at runtime, not a build error. */
export {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Group,
  Color,
  Vector3,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
  Mesh,
  MeshBasicMaterial,
  LineSegments,
  LineBasicMaterial,
  IcosahedronGeometry,
  OctahedronGeometry,
  TorusGeometry,
  WireframeGeometry,
  AdditiveBlending,
  NormalBlending
} from 'three';

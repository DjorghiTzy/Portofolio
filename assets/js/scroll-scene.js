/* ============================================================
   Scroll-driven three.js background.

   A fixed full-page WebGL layer sitting behind the content. Nothing here
   animates on a timer — every transform is a function of scroll progress,
   so the motion is exactly as smooth as the scroll feeding it (which is
   the lerped offset from smooth-scroll.js, not the raw scrollY).

   three.js is vendored under assets/vendor/ rather than pulled from a CDN:
   see `npm run build:three`. It is tree-shaken down to the handful of
   classes used below.
   ============================================================ */
import * as THREE from '../vendor/three.module.js';

const TAU = Math.PI * 2;

/* Reusable scratch object so the per-frame shard maths allocates nothing. */
const tmp = new THREE.Vector3();

function hexToColor(raw, fallback = '#10b981') {
  const value = (raw || '').trim() || fallback;
  try { return new THREE.Color(value); }
  catch { return new THREE.Color(fallback); }
}

export function createScrollScene({ canvas, getProgress, getPointer, quality = 'high' }) {
  const context = canvas.getContext('webgl2', { alpha: true, antialias: quality === 'high' })
    || canvas.getContext('webgl', { alpha: true, antialias: quality === 'high' });
  if (!context) throw new Error('WebGL unavailable');

  const low = quality === 'low';
  const DUST_COUNT   = low ? 900 : 2400;
  const SHARD_COUNT  = low ? 6 : 10;
  const CORE_DETAIL  = low ? 0 : 1;
  const RING_SEGS    = low ? 48 : 120;
  const DUST_DEPTH   = 120;
  const TRAVEL       = 34;   // world units the field drifts over a full page

  const renderer = new THREE.WebGLRenderer({
    canvas, context, alpha: true,
    antialias: quality === 'high',
    powerPreference: 'high-performance'
  });
  renderer.setClearAlpha(0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 200);
  camera.position.set(0, 0, 7);

  let accent = hexToColor(getComputedStyle(document.documentElement).getPropertyValue('--accent'));
  let isLight = document.documentElement.dataset.theme === 'light';

  /* ---- dust field ---------------------------------------------------- */
  const DUST_FRONT = 6;                       // just behind the camera plane
  const dustGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(DUST_COUNT * 3);
  const baseZ = new Float32Array(DUST_COUNT);
  for (let i = 0; i < DUST_COUNT; i++) {
    /* Biased away from dead centre so the core object stays readable. */
    const r = 3 + Math.pow(Math.random(), 0.6) * 20;
    const a = Math.random() * TAU;
    positions[i * 3]     = Math.cos(a) * r;
    positions[i * 3 + 1] = Math.sin(a) * r * 0.75;
    baseZ[i] = DUST_FRONT - DUST_DEPTH * Math.random();
    positions[i * 3 + 2] = baseZ[i];
  }
  const dustAttr = new THREE.Float32BufferAttribute(positions, 3);
  dustGeo.setAttribute('position', dustAttr);

  /* Moving the whole field toward the camera drains it: points that pass the
     camera are gone and nothing refills the near plane, which is the part you
     actually see. Wrapping each point back to the far plane keeps the density
     flat over the whole page, and reverses cleanly when scrolling up. */
  function advanceDust(travel) {
    const arr = dustAttr.array;
    for (let i = 0; i < DUST_COUNT; i++) {
      const z = baseZ[i] + travel;
      const wrapped = (DUST_FRONT - z) % DUST_DEPTH;
      arr[i * 3 + 2] = DUST_FRONT - (wrapped < 0 ? wrapped + DUST_DEPTH : wrapped);
    }
    dustAttr.needsUpdate = true;
  }

  const dustMat = new THREE.PointsMaterial({
    size: low ? 0.075 : 0.055,
    sizeAttenuation: true,
    transparent: true,
    depthWrite: false
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  /* ---- core object --------------------------------------------------- */
  const coreGroup = new THREE.Group();
  scene.add(coreGroup);

  const coreGeo = new THREE.IcosahedronGeometry(2.1, CORE_DETAIL);
  const coreWire = new THREE.WireframeGeometry(coreGeo);
  const coreMat = new THREE.LineBasicMaterial({ transparent: true, depthWrite: false });
  const core = new THREE.LineSegments(coreWire, coreMat);
  coreGroup.add(core);

  const ringGeo = new THREE.TorusGeometry(3.5, 0.008, 3, RING_SEGS);
  const ringMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI * 0.42;
  coreGroup.add(ring);

  /* ---- orbiting shards ----------------------------------------------- */
  const shardGeo = new THREE.OctahedronGeometry(0.19, 0);
  /* Wireframe keeps them in the same visual language as the core; filled
     octahedra with no lighting just read as opaque squares. */
  const shardMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, wireframe: true });
  const shards = [];
  for (let i = 0; i < SHARD_COUNT; i++) {
    const mesh = new THREE.Mesh(shardGeo, shardMat);
    mesh.userData.phase = (i / SHARD_COUNT) * TAU;
    mesh.userData.radius = 3.1 + (i % 3) * 0.85;
    mesh.userData.tilt = (i % 4) * 0.4 - 0.6;
    coreGroup.add(mesh);
    shards.push(mesh);
  }

  /* ---- theming ------------------------------------------------------- */
  function applyTheme() {
    const css = getComputedStyle(document.documentElement);
    accent = hexToColor(css.getPropertyValue('--accent'));
    isLight = document.documentElement.dataset.theme === 'light';

    /* Additive blending glows on a dark page and vanishes on a light one,
       so light mode draws normally with a denser colour instead. */
    dustMat.blending = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
    dustMat.color.copy(accent);
    dustMat.opacity = isLight ? 0.5 : 0.85;
    dustMat.needsUpdate = true;

    coreMat.color.copy(accent);
    coreMat.opacity = isLight ? 0.26 : 0.4;
    ringMat.color.copy(accent);
    ringMat.opacity = isLight ? 0.35 : 0.5;
    shardMat.color.copy(accent);
    shardMat.opacity = isLight ? 0.5 : 0.75;
  }
  applyTheme();

  /* ---- sizing -------------------------------------------------------- */
  let width = 0, height = 0;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width || window.innerWidth;
    height = rect.height || window.innerHeight;
    camera.aspect = width / height;
    /* Pull the camera back on narrow screens so the core still fits. */
    camera.position.z = width < 760 ? 9.5 : 7;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, low ? 1.25 : 1.75));
    renderer.setSize(width, height, false);
  }
  resize();

  /* ---- frame --------------------------------------------------------- */
  let running = false;
  let raf = null;
  let camX = 0, camY = 0;

  function frame() {
    const p = Math.max(0, Math.min(1, getProgress()));
    const pointer = getPointer ? getPointer() : { x: 0, y: 0 };

    /* Field drifts toward the viewer; the camera itself stays put so the
       motion reverses cleanly when scrolling back up. */
    advanceDust(p * TRAVEL);
    dust.rotation.z = p * 0.22;

    coreGroup.rotation.y = p * TAU * 1.6;
    coreGroup.rotation.x = p * Math.PI * 0.8;
    /* Swings aside through the middle of the page so it never sits behind
       a block of text, then recentres at the end. */
    coreGroup.position.x = Math.sin(p * Math.PI) * 3.4;
    coreGroup.position.y = Math.sin(p * Math.PI * 2) * 0.9;
    coreGroup.position.z = -p * 6;

    const scale = 1 - p * 0.45;
    coreGroup.scale.setScalar(scale);

    ring.rotation.z = -p * TAU * 2.2;

    for (let i = 0; i < shards.length; i++) {
      const s = shards[i];
      const a = s.userData.phase + p * TAU * 1.4;
      tmp.set(
        Math.cos(a) * s.userData.radius,
        Math.sin(a * 0.8) * s.userData.radius * 0.35 + s.userData.tilt,
        Math.sin(a) * s.userData.radius
      );
      s.position.copy(tmp);
      s.rotation.set(a * 1.4, a, 0);
    }

    /* Pointer parallax, eased separately so it feels independent of scroll. */
    camX += (pointer.x * 0.85 - camX) * 0.045;
    camY += (pointer.y * 0.55 - camY) * 0.045;
    camera.position.x = camX;
    camera.position.y = camY;
    camera.lookAt(0, 0, -4);

    renderer.render(scene, camera);
    if (running) raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  function dispose() {
    stop();
    dustGeo.dispose(); dustMat.dispose();
    coreGeo.dispose(); coreWire.dispose(); coreMat.dispose();
    ringGeo.dispose(); ringMat.dispose();
    shardGeo.dispose(); shardMat.dispose();
    renderer.dispose();
  }

  return { start, stop, resize, dispose, applyTheme, renderOnce: () => renderer.render(scene, camera) };
}

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const FLOOR_H = 3.2;
const SLAB = 0.7;

// Facade stone, tinted glass and brass per project. `wall`, `accent` and `trim` also feed the flat project drawings.
export const PALETTES = {
  ochre: { wall: '#c9a96a', accent: '#d9a52b', trim: '#efe9da', stone: '#d9cdb4', glass: '#10264a', brass: '#b8893c' },
  sand: { wall: '#d9c39a', accent: '#e0b84e', trim: '#f3eee2', stone: '#e5dccb', glass: '#13304f', brass: '#c9a45a' },
  olive: { wall: '#9aa07a', accent: '#d9b64a', trim: '#eee9db', stone: '#cfd0b6', glass: '#10303a', brass: '#a79443' },
  slate: { wall: '#7d8a94', accent: '#d2a54a', trim: '#e9e7de', stone: '#bfc4ca', glass: '#0f2646', brass: '#9aa3ad' },
};

const ease3 = (t) => 1 - Math.pow(1 - t, 3);
const clamp01 = (x) => Math.min(1, Math.max(0, x));

export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
}

export function canvasTexture(w, h, draw, { repeat = false, srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function noiseTexture(seed, grain = 1800, base = 150, amp = 90) {
  const r = rng(seed);
  return canvasTexture(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = `rgb(${base},${base},${base})`;
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < grain; i++) {
        const v = base + (r() - 0.5) * amp * 2;
        g.fillStyle = `rgb(${v | 0},${v | 0},${v | 0})`;
        g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3);
      }
    },
    { repeat: true, srgb: false }
  );
}

function grassTexture() {
  const r = rng(5);
  return canvasTexture(
    512,
    512,
    (g, w, h) => {
      g.fillStyle = '#5b7a3d';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) {
        const l = 30 + r() * 28;
        g.fillStyle = `hsl(${88 + r() * 24},${34 + r() * 22}%,${l}%)`;
        g.fillRect(r() * w, r() * h, 1 + r() * 3, 2 + r() * 5);
      }
    },
    { repeat: true }
  );
}

// One storey of lit rooms: warm light behind blinds, drawn per bay. Black where a room is dark.
export function glowTexture(seed, bays) {
  const r = rng(seed);
  return canvasTexture(640, 128, (g, w, h) => {
    g.fillStyle = '#000';
    g.fillRect(0, 0, w, h);
    const bw = w / bays;
    for (let b = 0; b < bays; b++) {
      if (r() > 0.68) continue;
      const x = b * bw + bw * 0.06;
      const ww = bw * 0.88;
      const k = 0.55 + r() * 0.45;
      const grd = g.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, `rgba(${(255 * k) | 0},${(176 * k) | 0},${(96 * k) | 0},1)`);
      grd.addColorStop(1, `rgba(${(255 * k) | 0},${(214 * k) | 0},${(150 * k) | 0},1)`);
      g.fillStyle = grd;
      g.fillRect(x, 8, ww, h - 16);
      if (r() > 0.5) {
        g.fillStyle = 'rgba(0,0,0,0.35)';
        for (let y = 8; y < h - 8; y += 9) g.fillRect(x, y, ww, 2);
      }
    }
  });
}

const box = new THREE.BoxGeometry(1, 1, 1);
const cyl = new THREE.CylinderGeometry(1, 1, 1, 14);
const ico = new THREE.IcosahedronGeometry(1, 2);

function useMaterials(palette) {
  const p = PALETTES[palette] || PALETTES.ochre;
  return useMemo(() => {
    const bump = noiseTexture(3);
    bump.repeat.set(3, 3);
    const interior = [0, 1, 2, 3].map(
      (i) =>
        new THREE.MeshStandardMaterial({
          color: '#0a1220',
          roughness: 0.9,
          emissive: new THREE.Color('#ffffff'),
          emissiveMap: glowTexture(11 + i * 17, 5),
          emissiveIntensity: 0,
        })
    );
    return {
      interior,
      stone: new THREE.MeshStandardMaterial({ color: p.stone, roughness: 0.78, bumpMap: bump, bumpScale: 0.9 }),
      stoneDark: new THREE.MeshStandardMaterial({ color: new THREE.Color(p.stone).multiplyScalar(0.62), roughness: 0.85, bumpMap: bump, bumpScale: 1.1 }),
      glass: new THREE.MeshPhysicalMaterial({
        color: p.glass,
        metalness: 0.15,
        roughness: 0.04,
        transparent: true,
        opacity: 0.58,
        envMapIntensity: 2.2,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        reflectivity: 1,
      }),
      rail: new THREE.MeshPhysicalMaterial({ color: '#cfe3ee', metalness: 0, roughness: 0.04, transparent: true, opacity: 0.28, envMapIntensity: 1.6 }),
      metal: new THREE.MeshStandardMaterial({ color: '#0c0d10', metalness: 0.7, roughness: 0.34 }),
      brass: new THREE.MeshStandardMaterial({ color: p.brass, metalness: 0.9, roughness: 0.3, envMapIntensity: 1.4 }),
      timber: new THREE.MeshStandardMaterial({ color: '#8a6a47', roughness: 0.7 }),
      leaf: new THREE.MeshStandardMaterial({ color: '#476b34', roughness: 1 }),
      water: new THREE.MeshPhysicalMaterial({ color: '#16587a', metalness: 0, roughness: 0.02, envMapIntensity: 2.4, clearcoat: 1 }),
      lamp: new THREE.MeshStandardMaterial({ color: '#f6e3b0', emissive: '#ffcf80', emissiveIntensity: 0 }),
      crane: new THREE.MeshStandardMaterial({ color: '#e0a21b', roughness: 0.55, metalness: 0.25 }),
      steel: new THREE.MeshStandardMaterial({ color: '#4a4f52', roughness: 0.5, metalness: 0.6 }),
    };
  }, [p]);
}

// All the repeated parts of one tower, as instanced meshes, so a whole building is a dozen draw calls.
function planBlock(floors, w, d, id, mats) {
  const layers = {};
  const add = (key, geo, mat, f, px, py, pz, sx, sy, sz, opts = {}) => {
    if (!layers[key]) layers[key] = { geo, mat, entries: [], ...opts };
    layers[key].entries.push({ f, px, py, pz, sx, sy, sz });
  };
  const bodyH = FLOOR_H - SLAB;
  for (let f = 0; f < floors; f++) {
    const fromTop = floors - 1 - f;
    const fw = w * (fromTop === 0 ? 0.76 : fromTop <= 2 ? 0.92 : 1);
    const fd = d * (fromTop === 0 ? 0.84 : 1);
    const bays = Math.max(3, Math.round(fw / 2.6));
    const baysD = Math.max(3, Math.round(fd / 2.6));
    add('slab', box, mats.stone, f, 0, SLAB / 2, 0, fw + 0.5, SLAB, fd + 0.5, { cast: true, receive: true });
    add('glass', box, mats.glass, f, 0, SLAB + bodyH / 2, 0, fw, bodyH, fd, { cast: false, receive: false });
    add(`room${(f + id) % 4}`, box, mats.interior[(f + id) % 4], f, 0, SLAB + bodyH / 2, 0, fw - 0.2, bodyH - 0.1, fd - 0.2, { cast: false, receive: false });
    for (let k = 0; k <= bays; k++) {
      const x = -fw / 2 + (k * fw) / bays;
      [1, -1].forEach((s) => add('mullion', box, mats.metal, f, x, SLAB + bodyH / 2, s * (fd / 2), 0.14, bodyH, 0.36, { cast: true }));
    }
    for (let k = 1; k < baysD; k++) {
      const z = -fd / 2 + (k * fd) / baysD;
      [1, -1].forEach((s) => add('mullion', box, mats.metal, f, s * (fw / 2), SLAB + bodyH / 2, z, 0.36, bodyH, 0.14, { cast: true }));
    }
    // stone pilasters at the four corners
    [1, -1].forEach((sx) => [1, -1].forEach((sz) => add('pilaster', box, mats.stoneDark, f, sx * (fw / 2), FLOOR_H / 2, sz * (fd / 2), 0.9, FLOOR_H, 0.9, { cast: true, receive: true })));
    if (fromTop > 0) {
      [1, -1].forEach((s) => {
        const bz = s * (fd / 2 + 1.15);
        const bwid = fw * 0.62;
        add('balcony', box, mats.stone, f, 0, 0.11, bz, bwid, 0.22, 2.3, { cast: true, receive: true });
        add('railglass', box, mats.rail, f, 0, 0.22 + 0.55, s * (fd / 2 + 2.28), bwid, 1.1, 0.04, { cast: false });
        add('railcap', box, mats.metal, f, 0, 0.22 + 1.1, s * (fd / 2 + 2.28), bwid, 0.05, 0.09, { cast: true });
        if ((f + id) % 2 === 0) [1, -1].forEach((e) => add('fin', box, mats.brass, f, e * (bwid / 2), 0.22 + 0.85, bz, 0.1, 1.7, 2.3, { cast: true }));
      });
    }
  }
  return Object.entries(layers).map(([key, l]) => ({ key, ...l }));
}

function Block({ x, z, w, d, floors, mats, state, id }) {
  const layers = useMemo(() => planBlock(floors, w, d, id, mats), [floors, w, d, id, mats]);
  const refs = useRef([]);
  const roof = useRef();
  const last = useRef(-1);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const scl = useMemo(() => new THREE.Vector3(), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);

  const apply = (build) => {
    const n = clamp01(build) * floors;
    layers.forEach((L, i) => {
      const mesh = refs.current[i];
      if (!mesh) return;
      L.entries.forEach((e, k) => {
        const t = ease3(clamp01(n - e.f));
        const s = Math.max(t, 0.0001);
        pos.set(x + e.px, e.f * FLOOR_H + e.py * s, z + e.pz);
        scl.set(t > 0.0005 ? e.sx : 0.0001, e.sy * s, t > 0.0005 ? e.sz : 0.0001);
        m.compose(pos, quat, scl);
        mesh.setMatrixAt(k, m);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });
    if (roof.current) {
      const t = ease3(clamp01((n - (floors - 0.35)) / 0.35));
      roof.current.visible = t > 0.001;
      roof.current.scale.setScalar(Math.max(t, 0.001));
    }
  };

  useLayoutEffect(() => {
    apply(state.s_build);
    last.current = state.s_build;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers]);

  useFrame(() => {
    if (Math.abs(state.s_build - last.current) > 0.0004) {
      apply(state.s_build);
      last.current = state.s_build;
    }
  });

  const topW = w * 0.76;
  const topD = d * 0.84;
  return (
    <group>
      {layers.map((L, i) => (
        <instancedMesh key={L.key} ref={(el) => (refs.current[i] = el)} args={[L.geo, L.mat, L.entries.length]} castShadow={L.cast} receiveShadow={L.receive} frustumCulled={false} />
      ))}
      <group ref={roof} position={[x, floors * FLOOR_H, z]}>
        <mesh geometry={box} material={mats.stone} position={[0, 0.15, 0]} scale={[topW + 0.5, 0.3, topD + 0.5]} castShadow receiveShadow />
        <mesh geometry={box} material={mats.glass} position={[0, 0.65, topD / 2 + 0.1]} scale={[topW, 0.7, 0.05]} />
        <mesh geometry={box} material={mats.glass} position={[0, 0.65, -topD / 2 - 0.1]} scale={[topW, 0.7, 0.05]} />
        {/* roof pool */}
        <mesh geometry={box} material={mats.stoneDark} position={[0, 0.34, 0.9]} scale={[topW * 0.62, 0.12, 3.6]} receiveShadow />
        <mesh geometry={box} material={mats.water} position={[0, 0.43, 0.9]} scale={[topW * 0.58, 0.06, 3.1]} />
        {/* pergola */}
        {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} geometry={box} material={mats.metal} position={[sx * topW * 0.4, 1.7, sz * topD * 0.3 - 1.2]} scale={[0.14, 3.2, 0.14]} castShadow />
        )))}
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} geometry={box} material={mats.timber} position={[0, 3.35, -topD * 0.3 - 1.2 + (i * topD * 0.6) / 8]} scale={[topW * 0.84, 0.1, 0.16]} castShadow />
        ))}
        {/* loungers and planters */}
        {[-2.6, -0.9, 0.9, 2.6].map((o, i) => (
          <mesh key={i} geometry={box} material={mats.stone} position={[o, 0.5, -topD * 0.3 + 2.4]} scale={[1.1, 0.22, 0.46]} castShadow />
        ))}
        {[-1, 1].map((sx, i) => (
          <group key={i} position={[sx * topW * 0.4, 0, topD * 0.32]}>
            <mesh geometry={box} material={mats.stoneDark} position={[0, 0.5, 0]} scale={[1.3, 0.55, 1.3]} castShadow />
            <mesh geometry={ico} material={mats.leaf} position={[0, 1.4, 0]} scale={[0.9, 0.9, 0.9]} castShadow />
          </group>
        ))}
      </group>
    </group>
  );
}

function Crane({ x, z, floors, state, mats }) {
  const g = useRef();
  const jib = useRef();
  const mast = useRef();
  const hook = useRef();
  useFrame((_, dt) => {
    const b = state.s_build;
    const show = 1 - THREE.MathUtils.smoothstep(b, 0.9, 1);
    const present = show > 0.01 && b > 0.001;
    g.current.visible = present;
    if (!present) return;
    const H = Math.max(b * floors * FLOOR_H + 9, 10);
    mast.current.scale.y = H;
    mast.current.position.y = H / 2;
    jib.current.position.y = H;
    jib.current.rotation.y += dt * 0.22;
    jib.current.scale.setScalar(Math.max(show, 0.001));
    hook.current.position.y = -3 - Math.sin(performance.now() / 900) * 1.2;
  });
  return (
    <group ref={g} position={[x, 0, z]}>
      <mesh ref={mast} geometry={box} material={mats.crane} scale={[1, 1, 1]} castShadow />
      <group ref={jib}>
        <mesh geometry={box} material={mats.crane} position={[9, 0.6, 0]} scale={[22, 0.7, 0.7]} castShadow />
        <mesh geometry={box} material={mats.crane} position={[-5.5, 0.6, 0]} scale={[8, 0.7, 0.7]} />
        <mesh geometry={box} material={mats.steel} position={[-8, -0.4, 0]} scale={[2.2, 2, 1.4]} />
        <mesh geometry={box} material={mats.crane} position={[0, 2.2, 0]} scale={[0.5, 3.4, 0.5]} />
        <group position={[14, 0, 0]}>
          <mesh geometry={cyl} material={mats.steel} position={[0, -1.6, 0]} scale={[0.05, 3.2, 0.05]} />
          <mesh ref={hook} geometry={box} material={mats.steel} position={[0, -3.2, 0]} scale={[0.5, 0.5, 0.5]} />
        </group>
      </group>
    </group>
  );
}

function Landscape({ mats, blocks }) {
  const crowns = useRef();
  const trunks = useRef();
  const city = useRef();
  const grass = useMemo(() => {
    const t = grassTexture();
    t.repeat.set(70, 70);
    return t;
  }, []);
  const trees = useMemo(() => {
    const r = rng(42);
    const out = [];
    const place = (x, z, s) => out.push({ x, z, s });
    // Keep the lawn in front of the hero camera open so the building is never hidden behind foliage.
    const clearOfCamera = (a, rad) => !(rad < 100 && a > 0.2 && a < 1.9);
    let guard = 0;
    while (out.length < 64 && guard++ < 600) {
      const a = r() * Math.PI * 2;
      const rad = 46 + r() * 80;
      if (clearOfCamera(a, rad)) place(Math.cos(a) * rad, Math.sin(a) * rad, 2.0 + r() * 1.8);
    }
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      if (clearOfCamera(a, 39)) place(Math.cos(a) * 39, Math.sin(a) * 31, 1.4 + r() * 0.7);
    }
    return out;
  }, []);
  const lamps = useMemo(() => Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return [Math.cos(a) * 36.4, Math.sin(a) * 36.4 * 0.86];
  }), []);
  const bollards = useMemo(() => Array.from({ length: 22 }, (_, i) => [-18 + i * 1.7, 24.5]), []);
  const skyline = useMemo(() => {
    const r = rng(77);
    return Array.from({ length: 150 }, () => {
      const a = r() * Math.PI * 2;
      const rad = 330 + r() * 260;
      return { x: Math.cos(a) * rad, z: Math.sin(a) * rad, w: 14 + r() * 26, d: 14 + r() * 26, h: 20 + Math.pow(r(), 2.2) * 120, tone: 0.62 + r() * 0.22 };
    });
  }, []);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const greens = ['#2f4a2a', '#3a5a2f', '#4a6a3a', '#2b4326', '#587a42', '#3e5e35'].map((c) => new THREE.Color(c));
    const r = rng(3);
    let i = 0;
    trees.forEach((t, ti) => {
      for (let k = 0; k < 3; k++) {
        const ox = (r() - 0.5) * t.s * 0.7;
        const oz = (r() - 0.5) * t.s * 0.7;
        const oy = t.s * (1.5 + k * 0.45);
        const sc = t.s * (0.62 - k * 0.1 + r() * 0.12);
        q.setFromEuler(e.set(r() * 3, r() * 3, r() * 3));
        m.compose(new THREE.Vector3(t.x + ox, oy, t.z + oz), q, new THREE.Vector3(sc, sc * 0.85, sc));
        crowns.current.setMatrixAt(i, m);
        crowns.current.setColorAt(i, greens[(ti + k) % greens.length].clone().offsetHSL(0, 0, (r() - 0.5) * 0.06));
        i++;
      }
      m.compose(new THREE.Vector3(t.x, t.s * 0.75, t.z), new THREE.Quaternion(), new THREE.Vector3(0.14 * t.s, t.s * 1.5, 0.14 * t.s));
      trunks.current.setMatrixAt(ti, m);
    });
    crowns.current.instanceMatrix.needsUpdate = true;
    crowns.current.instanceColor.needsUpdate = true;
    trunks.current.instanceMatrix.needsUpdate = true;
    skyline.forEach((b, k) => {
      m.compose(new THREE.Vector3(b.x, b.h / 2, b.z), new THREE.Quaternion(), new THREE.Vector3(b.w, b.h, b.d));
      city.current.setMatrixAt(k, m);
      city.current.setColorAt(k, new THREE.Color().setScalar(b.tone));
    });
    city.current.instanceMatrix.needsUpdate = true;
    city.current.instanceColor.needsUpdate = true;
  }, [trees, skyline]);

  const podiumW = blocks === 2 ? 44 : 28;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.05, 0]} receiveShadow>
        <circleGeometry args={[480, 64]} />
        <meshStandardMaterial map={grass} color="#b4cc86" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} receiveShadow scale={[1, 0.86, 1]}>
        <ringGeometry args={[33, 40, 96, 1]} />
        <meshStandardMaterial color="#2c2e33" roughness={0.92} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]} receiveShadow scale={[1, 0.86, 1]}>
        <ringGeometry args={[32.4, 33, 96, 1]} />
        <meshStandardMaterial color="#dcd6c8" roughness={0.9} />
      </mesh>
      <mesh geometry={box} material={mats.stone} position={[0, 0.2, 0]} scale={[podiumW, 0.4, 30]} receiveShadow castShadow />
      <mesh geometry={box} material={mats.stoneDark} position={[0, 0.1, 16.5]} scale={[podiumW * 0.5, 0.2, 3]} receiveShadow />
      <mesh geometry={box} material={mats.stone} position={[0, 0.05, 25]} scale={[10, 0.1, 18]} receiveShadow />
      {/* lobby canopy */}
      <mesh geometry={box} material={mats.metal} position={[-10.5, 4.2, 12]} scale={[10, 0.25, 6]} castShadow />
      <mesh geometry={box} material={mats.glass} position={[-10.5, 2.1, 9.2]} scale={[8.5, 3.6, 0.08]} />
      {/* pond */}
      <mesh rotation-x={-Math.PI / 2} position={[-58, 0.06, 6]} scale={[1.9, 1, 1]}>
        <circleGeometry args={[9, 48]} />
        <primitive object={mats.water} attach="material" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[-58, 0.03, 6]} scale={[2.05, 1.12, 1]}>
        <circleGeometry args={[9, 48]} />
        <meshStandardMaterial color="#cfc9b8" roughness={0.9} />
      </mesh>
      <instancedMesh ref={crowns} args={[ico, undefined, trees.length * 3]} castShadow receiveShadow frustumCulled={false}>
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
      <instancedMesh ref={trunks} args={[cyl, undefined, trees.length]} castShadow frustumCulled={false}>
        <meshStandardMaterial color="#4b3a28" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={city} args={[box, undefined, skyline.length]} frustumCulled={false}>
        <meshStandardMaterial roughness={0.95} color="#9aa7b8" />
      </instancedMesh>
      {lamps.map(([lx, lz], i) => (
        <group key={i} position={[lx, 0, lz]}>
          <mesh geometry={cyl} material={mats.metal} position={[0, 2, 0]} scale={[0.07, 4, 0.07]} castShadow />
          <mesh geometry={ico} material={mats.lamp} position={[0, 4.1, 0]} scale={[0.26, 0.26, 0.26]} />
        </group>
      ))}
      {bollards.map(([bx, bz], i) => (
        <mesh key={i} geometry={cyl} material={mats.lamp} position={[bx, 0.25, bz]} scale={[0.1, 0.5, 0.1]} />
      ))}
    </group>
  );
}

// Presentation mode: just the building on a stone plinth that grows with it, with a soft ground shadow.
function Minimal({ mats, blocks, state }) {
  const plinth = useRef();
  const catcher = useRef();
  const podiumW = blocks === 2 ? 46 : 30;
  useFrame(() => {
    const t = ease3(clamp01(state.s_build / 0.06));
    const s = Math.max(t, 0.0001);
    plinth.current.scale.set(s, s, s);
    plinth.current.visible = t > 0.001;
    catcher.current.visible = t > 0.02;
  });
  return (
    <group>
      <group ref={plinth}>
        <mesh geometry={box} material={mats.stone} position={[0, 0.2, 0]} scale={[podiumW, 0.4, 32]} receiveShadow castShadow />
        <mesh geometry={box} material={mats.stoneDark} position={[0, 0.06, 18.4]} scale={[podiumW * 0.46, 0.12, 4]} receiveShadow />
      </group>
      <mesh ref={catcher} rotation-x={-Math.PI / 2} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[320, 320]} />
        <shadowMaterial transparent opacity={0.22} />
      </mesh>
    </group>
  );
}

function Stars({ state }) {
  const ref = useRef();
  const geo = useMemo(() => {
    const r = rng(9);
    const pos = new Float32Array(900 * 3);
    for (let i = 0; i < 900; i++) {
      const v = r() * 0.95 + 0.04;
      const a = r() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * Math.sqrt(1 - v * v) * 900;
      pos[i * 3 + 1] = v * 900;
      pos[i * 3 + 2] = Math.sin(a) * Math.sqrt(1 - v * v) * 900;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useFrame(() => {
    ref.current.material.opacity = THREE.MathUtils.smoothstep(state.s_dusk, 0.6, 1) * 0.85;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#ffffff" size={1.4} sizeAttenuation={false} transparent opacity={0} depthWrite={false} fog={false} />
    </points>
  );
}

function Motes({ state }) {
  const ref = useRef();
  const { geo, vel } = useMemo(() => {
    const r = rng(77);
    const n = 140;
    const pos = new Float32Array(n * 3);
    const vel = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (r() - 0.5) * 80;
      pos[i * 3 + 1] = r() * 56;
      pos[i * 3 + 2] = (r() - 0.5) * 80;
      vel[i] = 0.2 + r() * 0.4;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { geo: g, vel };
  }, []);
  useFrame((_, dt) => {
    if (state.reduced) return;
    const a = geo.attributes.position;
    for (let i = 0; i < vel.length; i++) {
      let y = a.getY(i) + vel[i] * dt;
      if (y > 58) y = 0;
      a.setY(i, y);
    }
    a.needsUpdate = true;
    ref.current.material.opacity = 0.4 * (1 - state.s_dusk * 0.5);
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#fff1d6" size={0.16} transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

export function TowerModel({ state, palette = 'ochre', floors = 14, blocks = 2, scenic = false }) {
  const mats = useMaterials(palette);
  state.mats = mats;
  const w = 13;
  const d = 16;
  return (
    <group>
      {scenic ? <Landscape mats={mats} blocks={blocks} /> : <Minimal mats={mats} blocks={blocks} state={state} />}
      {blocks === 2 ? (
        <>
          <Block id={0} x={-11.5} z={-1.5} w={w} d={d} floors={floors} mats={mats} state={state} />
          <Block id={1} x={11.5} z={2.5} w={w} d={d - 1.5} floors={Math.max(floors - 2, 6)} mats={mats} state={state} />
          <Crane x={-1.5} z={-13} floors={floors} state={state} mats={mats} />
        </>
      ) : (
        <>
          <Block id={0} x={0} z={0} w={w + 2} d={d} floors={floors} mats={mats} state={state} />
          <Crane x={12} z={-12} floors={floors} state={state} mats={mats} />
        </>
      )}
      {scenic && <Stars state={state} />}
      {scenic && <Motes state={state} />}
    </group>
  );
}

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTES, FLOOR_H, rng, canvasTexture, noiseTexture, glowTexture } from './Tower.jsx';

// The construction model used by the scroll story. It is built the way a real tower is:
//   stage 0  structure   columns, concrete core and floor slabs rise first
//   stage 1  envelope    stone fascia, corner piers, glass and mullions follow a few floors behind
//   stage 2  fit-out     balconies slide out, rails, brass fins and sunshades, then the roof garden
// A tower crane works beside it and green safety netting wraps the open floors until they are finished.

const SLAB = 0.7;
const BODY = FLOOR_H - SLAB;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ease = (t) => 1 - Math.pow(1 - t, 3);
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const stagesOf = (b, floors) => {
  const s = b * (floors + 6);
  return [s, s - 3, s - 5.2];
};

const box = new THREE.BoxGeometry(1, 1, 1);
const cyl = new THREE.CylinderGeometry(1, 1, 1, 12);
const ico = new THREE.IcosahedronGeometry(1, 2);
const plane = new THREE.PlaneGeometry(1, 1);

// A unit box whose texture coordinates are scaled to real-world size, so concrete keeps its grain on any slab.
function uvBox(sx, sy, sz, tile = 2.6) {
  const g = new THREE.BoxGeometry(1, 1, 1);
  const uv = g.attributes.uv;
  const dims = [[sz, sy], [sz, sy], [sx, sz], [sx, sz], [sx, sy], [sx, sy]];
  for (let f = 0; f < 6; f++) {
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, (uv.getX(i) * dims[f][0]) / tile, (uv.getY(i) * dims[f][1]) / tile);
    }
  }
  return g;
}

function concreteTexture() {
  const r = rng(21);
  return canvasTexture(
    512,
    512,
    (g, w, h) => {
      g.fillStyle = '#e4e1da';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 24000; i++) {
        const v = 170 + r() * 70;
        g.fillStyle = `rgba(${v | 0},${(v - 3) | 0},${(v - 8) | 0},${0.16 + r() * 0.3})`;
        g.fillRect(r() * w, r() * h, 1 + r() * 2.4, 1 + r() * 2.4);
      }
      g.fillStyle = 'rgba(70,64,58,0.12)';
      for (let y = 0; y < h; y += 64) g.fillRect(0, y, w, 2);
      g.fillStyle = 'rgba(46,42,38,0.34)';
      for (let y = 32; y < h; y += 128) for (let x = 32; x < w; x += 128) {
        g.beginPath();
        g.arc(x, y, 3.4, 0, 6.283);
        g.fill();
      }
      for (let i = 0; i < 16; i++) {
        const x = r() * w;
        const gr = g.createLinearGradient(x, 0, x, h);
        gr.addColorStop(0, 'rgba(60,55,50,0)');
        gr.addColorStop(0.5, `rgba(60,55,50,${0.05 + r() * 0.08})`);
        gr.addColorStop(1, 'rgba(60,55,50,0)');
        g.fillStyle = gr;
        g.fillRect(x, 0, 3 + r() * 9, h);
      }
    },
    { repeat: true }
  );
}

// Curtain wall: dark reflective vision glass above, a lighter fritted spandrel panel at the slab edge.
function glassTexture(seed) {
  const r = rng(seed);
  return canvasTexture(640, 256, (g, w, h) => {
    const bays = 5;
    const bw = w / bays;
    for (let b = 0; b < bays; b++) {
      const x = b * bw;
      const hue = 206 + r() * 18;
      const sat = 38 + r() * 22;
      const l0 = 12 + r() * 6;
      const gr = g.createLinearGradient(0, 0, 0, h * 0.78);
      gr.addColorStop(0, `hsl(${hue},${sat}%,${l0 + 8}%)`);
      gr.addColorStop(1, `hsl(${hue},${sat}%,${l0}%)`);
      g.fillStyle = gr;
      g.fillRect(x, 0, bw, h * 0.78);
      g.fillStyle = `hsl(${hue - 4},${sat - 14}%,${25 + r() * 5}%)`;
      g.fillRect(x, h * 0.78, bw, h * 0.22);
    }
    g.fillStyle = 'rgba(255,255,255,0.07)';
    for (let y = h * 0.8; y < h; y += 6) for (let x = 0; x < w; x += 6) g.fillRect(x + (y % 12 ? 3 : 0), y, 2, 2);
  });
}

function netTexture() {
  return canvasTexture(
    128,
    128,
    (g, w, h) => {
      g.fillStyle = 'rgba(46,130,76,0.1)';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(18,86,48,0.8)';
      g.lineWidth = 2.2;
      for (let i = 0; i <= w; i += 32) {
        g.beginPath();
        g.moveTo(i, 0);
        g.lineTo(i, h);
        g.stroke();
        g.beginPath();
        g.moveTo(0, i);
        g.lineTo(w, i);
        g.stroke();
      }
    },
    { repeat: true }
  );
}

function trussTexture() {
  return canvasTexture(
    128,
    128,
    (g, w, h) => {
      g.strokeStyle = '#ffffff';
      g.lineWidth = 8;
      g.beginPath();
      g.moveTo(5, 0);
      g.lineTo(5, h);
      g.moveTo(w - 5, 0);
      g.lineTo(w - 5, h);
      g.stroke();
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(5, 0);
      g.lineTo(w - 5, h);
      g.moveTo(w - 5, 0);
      g.lineTo(5, h);
      g.stroke();
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(0, 3);
      g.lineTo(w, 3);
      g.moveTo(0, h - 3);
      g.lineTo(w, h - 3);
      g.stroke();
    },
    { repeat: true }
  );
}

function useBuildMaterials(palette) {
  const p = PALETTES[palette] || PALETTES.ochre;
  return useMemo(() => {
    const concrete = concreteTexture();
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
      concrete: new THREE.MeshStandardMaterial({ map: concrete, color: '#aaa69e', roughness: 0.96, bumpMap: concrete, bumpScale: 1.4 }),
      stone: new THREE.MeshStandardMaterial({ map: concrete, color: p.stone, roughness: 0.78, bumpMap: concrete, bumpScale: 0.9 }),
      stoneDark: new THREE.MeshStandardMaterial({ map: concrete, color: new THREE.Color(p.stone).multiplyScalar(0.64), roughness: 0.84, bumpMap: concrete, bumpScale: 1.1 }),
      glass: new THREE.MeshPhysicalMaterial({
        map: glassTexture(5),
        color: '#ffffff',
        metalness: 0.55,
        roughness: 0.03,
        envMapIntensity: 3.6,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
        transparent: true,
        opacity: 0.94,
      }),
      rail: new THREE.MeshPhysicalMaterial({ color: '#cfe3ee', roughness: 0.04, transparent: true, opacity: 0.3, envMapIntensity: 1.8 }),
      metal: new THREE.MeshStandardMaterial({ color: '#0c0d10', metalness: 0.75, roughness: 0.32 }),
      louver: new THREE.MeshStandardMaterial({ color: '#e9e6df', metalness: 0.5, roughness: 0.4 }),
      brass: new THREE.MeshStandardMaterial({ color: p.brass, metalness: 0.92, roughness: 0.28, envMapIntensity: 1.6 }),
      timber: new THREE.MeshStandardMaterial({ color: '#8a6a47', roughness: 0.7 }),
      leaf: new THREE.MeshStandardMaterial({ color: '#476b34', roughness: 1 }),
      trunk: new THREE.MeshStandardMaterial({ color: '#4b3a28', roughness: 1 }),
      water: new THREE.MeshPhysicalMaterial({ color: '#16587a', roughness: 0.02, envMapIntensity: 2.4, clearcoat: 1 }),
      lamp: new THREE.MeshStandardMaterial({ color: '#f6e3b0', emissive: '#ffcf80', emissiveIntensity: 0 }),
      rebar: new THREE.MeshStandardMaterial({ color: '#6a4a38', metalness: 0.6, roughness: 0.55 }),
      crane: new THREE.MeshStandardMaterial({ color: '#f0b323', roughness: 0.5, metalness: 0.3 }),
      steel: new THREE.MeshStandardMaterial({ color: '#50555a', roughness: 0.5, metalness: 0.6 }),
      weight: new THREE.MeshStandardMaterial({ color: '#8d8b86', map: concrete, roughness: 0.9 }),
      cabin: new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.5 }),
      beacon: new THREE.MeshStandardMaterial({ color: '#ff3b30', emissive: '#ff2a1f', emissiveIntensity: 0 }),
      netTex: netTexture(),
      trussTex: trussTexture(),
    };
  }, [p]);
}

// Every repeated part of one tower, grouped into instanced meshes.
function planBlock(floors, w, d, id, mats) {
  const layers = {};
  const dims = [];
  const add = (key, geo, mat, e, opts = {}) => {
    if (!layers[key]) layers[key] = { geo, mat, entries: [], ...opts };
    layers[key].entries.push(e);
  };
  const E = (stage, lead, f, px, py, pz, sx, sy, sz, mode = 'grow', dir = 1) => ({ stage, lead, f, px, py, pz, sx, sy, sz, mode, dir });
  const slabGeo = uvBox(w + 0.3, SLAB, d + 0.3);
  const fasciaGeo = uvBox(w + 0.6, SLAB + 0.04, d + 0.6);
  const coreGeo = uvBox(4.4, BODY, 5.6);
  const colGeo = uvBox(0.55, BODY, 0.55);
  const pilGeo = uvBox(0.9, FLOOR_H, 0.9);
  const balGeo = uvBox(w * 0.62, 0.22, 2.3);

  for (let f = 0; f < floors; f++) {
    const fromTop = floors - 1 - f;
    const fw = w * (fromTop === 0 ? 0.76 : fromTop <= 2 ? 0.92 : 1);
    const fd = d * (fromTop === 0 ? 0.84 : 1);
    dims.push({ fw, fd });
    const bays = Math.max(3, Math.round(fw / 2.6));
    const baysD = Math.max(3, Math.round(fd / 2.6));

    // stage 0: structure
    add('slab', slabGeo, mats.concrete, E(0, -0.75, f, 0, SLAB / 2, 0, fw + 0.3, SLAB, fd + 0.3), { cast: true, receive: true });
    add('core', coreGeo, mats.concrete, E(0, -0.4, f, 0, SLAB + BODY / 2, 0, 4.4, BODY, 5.6), { cast: true, receive: true });
    for (let k = 0; k < 4; k++) {
      const x = -fw / 2 + 0.5 + (k * (fw - 1)) / 3;
      [1, -1].forEach((s) => add('col', colGeo, mats.concrete, E(0, 0, f, x, SLAB + BODY / 2, s * (fd / 2 - 0.5), 0.55, BODY, 0.55), { cast: true, receive: true }));
    }

    // stage 1: envelope
    add('fascia', fasciaGeo, mats.stone, E(1, -0.15, f, 0, SLAB / 2, 0, fw + 0.62, SLAB + 0.04, fd + 0.62), { cast: true, receive: true });
    add('glass', box, mats.glass, E(1, -0.2, f, 0, SLAB + BODY / 2, 0, fw, BODY, fd));
    add(`room${(f + id) % 4}`, box, mats.interior[(f + id) % 4], E(1, -0.5, f, 0, SLAB + BODY / 2, 0, fw - 0.25, BODY - 0.1, fd - 0.25));
    for (let k = 0; k <= bays; k++) {
      const x = -fw / 2 + (k * fw) / bays;
      [1, -1].forEach((s) => add('mullion', box, mats.metal, E(1, -0.3, f, x, SLAB + BODY / 2, s * (fd / 2), 0.14, BODY, 0.36), { cast: true }));
    }
    for (let k = 1; k < baysD; k++) {
      const z = -fd / 2 + (k * fd) / baysD;
      [1, -1].forEach((s) => add('mullion', box, mats.metal, E(1, -0.3, f, s * (fw / 2), SLAB + BODY / 2, z, 0.36, BODY, 0.14), { cast: true }));
    }
    [1, -1].forEach((sx) => [1, -1].forEach((sz) => add('pilaster', pilGeo, mats.stoneDark, E(1, 0, f, sx * (fw / 2), FLOOR_H / 2, sz * (fd / 2), 0.9, FLOOR_H, 0.9), { cast: true, receive: true })));

    // stage 2: fit-out
    if (fromTop > 0) {
      [1, -1].forEach((s) => {
        const bz = s * (fd / 2 + 1.15);
        const bwid = fw * 0.62;
        add('balcony', balGeo, mats.stone, E(2, 0, f, 0, 0.11, bz, bwid, 0.22, 2.3, 'out', s), { cast: true, receive: true });
        add('railglass', box, mats.rail, E(2, -0.35, f, 0, 0.22 + 0.55, s * (fd / 2 + 2.28), bwid, 1.1, 0.04));
        add('railcap', box, mats.metal, E(2, -0.45, f, 0, 0.22 + 1.1, s * (fd / 2 + 2.28), bwid, 0.05, 0.09), { cast: true });
        if ((f + id) % 2 === 0) [1, -1].forEach((e) => add('fin', box, mats.brass, E(2, -0.55, f, e * (bwid / 2), 0.22 + 0.85, bz, 0.1, 1.7, 2.3), { cast: true }));
      });
    }
    [1, -1].forEach((s) => add('louver', box, mats.louver, E(2, -0.2, f, 0, SLAB + BODY - 0.15, s * (fd / 2 + 0.4), fw, 0.07, 0.9), { cast: true }));
  }
  return { layers: Object.entries(layers).map(([key, l]) => ({ key, ...l })), dims };
}

function Block({ x, z, w, d, floors, mats, state, id }) {
  const { layers, dims } = useMemo(() => planBlock(floors, w, d, id, mats), [floors, w, d, id, mats]);
  const refs = useRef([]);
  const roof = useRef();
  const rods = useRef();
  const planes = useRef([]);
  const last = useRef(-1);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const scl = useMemo(() => new THREE.Vector3(), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);
  const netMats = useMemo(
    () =>
      [0, 1, 2, 3].map(() => {
        const t = mats.netTex.clone();
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.needsUpdate = true;
        return new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide, depthWrite: false, opacity: 0.9 });
      }),
    [mats]
  );

  const apply = (build) => {
    const N = stagesOf(build, floors);
    layers.forEach((L, i) => {
      const mesh = refs.current[i];
      if (!mesh) return;
      L.entries.forEach((e, k) => {
        const t = ease(clamp01(N[e.stage] + e.lead - e.f));
        if (t < 0.0008) {
          pos.set(0, -400, 0);
          scl.set(0.0001, 0.0001, 0.0001);
        } else if (e.mode === 'out') {
          pos.set(x + e.px, e.f * FLOOR_H + e.py, z + e.pz - e.dir * (e.sz / 2) * (1 - t));
          scl.set(e.sx, e.sy, Math.max(e.sz * t, 0.0001));
        } else {
          pos.set(x + e.px, e.f * FLOOR_H + (e.py - e.sy / 2) + (e.sy * t) / 2, z + e.pz);
          scl.set(e.sx, Math.max(e.sy * t, 0.0001), e.sz);
        }
        m.compose(pos, quat, scl);
        mesh.setMatrixAt(k, m);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });

    if (roof.current) {
      const t = ease(clamp01(N[2] - (floors - 0.6)));
      roof.current.visible = t > 0.002;
      roof.current.scale.setScalar(Math.max(t, 0.001));
    }

    // rebar stubs on the newest slab, until the structure is topped out
    if (rods.current) {
      const topF = Math.min(N[0], floors);
      const live = N[0] > 0.25 && N[0] < floors + 0.2;
      const dm = dims[Math.min(floors - 1, Math.max(0, Math.floor(topF)))];
      const yTop = topF * FLOOR_H;
      const pts = [];
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => pts.push([sx * (dm.fw / 2 - 0.3), sz * (dm.fd / 2 - 0.3)]));
      [-0.5, 0.5].forEach((o) => [1, -1].forEach((s) => pts.push([o * dm.fw * 0.8, s * (dm.fd / 2 - 0.3)])));
      [1, -1].forEach((s) => pts.push([s * (dm.fw / 2 - 0.3), 0]));
      pts.forEach(([px, pz], i) => {
        pos.set(x + px, yTop + 0.9, z + pz);
        scl.set(live ? 0.045 : 0.0001, live ? 1.8 : 0.0001, live ? 0.045 : 0.0001);
        m.compose(pos, quat, scl);
        rods.current.setMatrixAt(i, m);
      });
      rods.current.instanceMatrix.needsUpdate = true;
    }

    // safety netting wraps the floors that are open or still being finished
    const yb = Math.max(0, Math.min(N[2], floors)) * FLOOR_H;
    const yt = Math.max(0, Math.min(N[0], floors)) * FLOOR_H + 1.5;
    const h = yt - yb;
    const show = N[0] > 0.4 && N[2] < floors - 0.25 && h > 1;
    const specs = [
      { rx: 0, px: 0, pz: d / 2 + 3.4, width: w + 6.8 },
      { rx: Math.PI, px: 0, pz: -(d / 2 + 3.4), width: w + 6.8 },
      { rx: Math.PI / 2, px: w / 2 + 3.4, pz: 0, width: d + 6.8 },
      { rx: -Math.PI / 2, px: -(w / 2 + 3.4), pz: 0, width: d + 6.8 },
    ];
    planes.current.forEach((pl, i) => {
      if (!pl) return;
      pl.visible = show;
      if (!show) return;
      const s = specs[i];
      pl.position.set(x + s.px, yb + h / 2, z + s.pz);
      pl.rotation.set(0, s.rx, 0);
      pl.scale.set(s.width, h, 1);
      const t = netMats[i].map;
      t.repeat.set(s.width / 6.4, h / 6.4);
      t.offset.set(0, (yb / 6.4) % 1);
    });
  };

  useLayoutEffect(() => {
    apply(state.s_build);
    last.current = state.s_build;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers]);

  useFrame(() => {
    if (Math.abs(state.s_build - last.current) > 0.00008) {
      apply(state.s_build);
      last.current = state.s_build;
    }
  });

  const topW = w * 0.76;
  const topD = d * 0.84;
  return (
    <group>
      {layers.map((L, i) => (
        <instancedMesh key={L.key} ref={(el) => (refs.current[i] = el)} args={[L.geo, L.mat, L.entries.length]} castShadow={!!L.cast} receiveShadow={!!L.receive} frustumCulled={false} />
      ))}
      <instancedMesh ref={rods} args={[cyl, mats.rebar, 10]} castShadow frustumCulled={false} />
      {netMats.map((mt, i) => (
        <mesh key={i} ref={(el) => (planes.current[i] = el)} geometry={plane} material={mt} visible={false} />
      ))}
      <group ref={roof} position={[x, floors * FLOOR_H, z]}>
        <mesh geometry={box} material={mats.stone} position={[0, 0.15, 0]} scale={[topW + 0.5, 0.3, topD + 0.5]} castShadow receiveShadow />
        <mesh geometry={box} material={mats.glass} position={[0, 0.65, topD / 2 + 0.1]} scale={[topW, 0.7, 0.05]} />
        <mesh geometry={box} material={mats.glass} position={[0, 0.65, -topD / 2 - 0.1]} scale={[topW, 0.7, 0.05]} />
        <mesh geometry={box} material={mats.stoneDark} position={[0, 0.34, 0.9]} scale={[topW * 0.62, 0.12, 3.6]} receiveShadow />
        <mesh geometry={box} material={mats.water} position={[0, 0.43, 0.9]} scale={[topW * 0.58, 0.06, 3.1]} />
        {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} geometry={box} material={mats.metal} position={[sx * topW * 0.4, 1.7, sz * topD * 0.3 - 1.2]} scale={[0.14, 3.2, 0.14]} castShadow />
        )))}
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} geometry={box} material={mats.timber} position={[0, 3.35, -topD * 0.3 - 1.2 + (i * topD * 0.6) / 8]} scale={[topW * 0.84, 0.1, 0.16]} castShadow />
        ))}
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

function trussMaterial(mats, color = '#f0b323') {
  const t = mats.trussTex.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  return new THREE.MeshStandardMaterial({ map: t, color, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.55, metalness: 0.3 });
}

// A lattice tower crane. The trolley runs along the jib, the load swings on its cable, and the beacon blinks.
function Crane({ x, z, floors, state, mats }) {
  const g = useRef();
  const jib = useRef();
  const trolley = useRef();
  const cable = useRef();
  const hookGroup = useRef();
  const beacon = useRef();
  const mastBits = useRef([]);
  const mastPlanes = useMemo(() => [0, 1, 2, 3].map(() => trussMaterial(mats)), [mats]);
  const jibPlanes = useMemo(() => [0, 1, 2].map(() => trussMaterial(mats)), [mats]);
  const lastH = useRef(-1);

  useFrame((_, dt) => {
    const b = state.s_build;
    const N = stagesOf(b, floors);
    const H = Math.min(N[0], floors) * FLOOR_H + 13;
    const show = Math.min(smooth(0.004, 0.03, b), 1 - smooth(floors - 2.2, floors + 0.4, N[2]));
    g.current.visible = show > 0.01;
    if (show <= 0.01) return;
    g.current.scale.set(show, show, show);
    if (Math.abs(H - lastH.current) > 0.02) {
      lastH.current = H;
      mastBits.current.forEach((o) => {
        if (!o) return;
        o.scale.y = o.userData.plane ? H : H;
        o.position.y = H / 2;
      });
      mastPlanes.forEach((mt) => mt.map.repeat.set(1, H / 1.4));
      jib.current.position.y = H;
    }
    const t = state.reduced ? 0 : performance.now() / 1000;
    jib.current.rotation.y = 0.5 + b * 5 + t * 0.07;
    const tx = 15 + Math.sin(t * 0.22) * 6;
    trolley.current.position.x = tx;
    const len = 7 + (1 + Math.sin(t * 0.37)) * 3.4;
    cable.current.scale.y = len;
    cable.current.position.y = -0.55 - len / 2;
    hookGroup.current.position.y = -0.55 - len;
    hookGroup.current.rotation.z = Math.sin(t * 0.9) * 0.025;
    mats.beacon.emissiveIntensity = 1.2 + Math.sin(t * 4) * 1.2;
  });

  const post = (sx, sz, i) => (
    <mesh key={`p${i}`} ref={(el) => (mastBits.current[i] = el)} geometry={box} material={mats.crane} position={[sx * 0.7, 6, sz * 0.7]} scale={[0.13, 12, 0.13]} castShadow />
  );
  return (
    <group ref={g} position={[x, 0, z]}>
      {[[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sz], i) => post(sx, sz, i))}
      <mesh ref={(el) => (mastBits.current[4] = el)} geometry={plane} material={mastPlanes[0]} position={[0, 6, 0.7]} scale={[1.4, 12, 1]} />
      <mesh ref={(el) => (mastBits.current[5] = el)} geometry={plane} material={mastPlanes[1]} position={[0, 6, -0.7]} scale={[1.4, 12, 1]} />
      <mesh ref={(el) => (mastBits.current[6] = el)} geometry={plane} material={mastPlanes[2]} position={[0.7, 6, 0]} rotation={[0, Math.PI / 2, 0]} scale={[1.4, 12, 1]} />
      <mesh ref={(el) => (mastBits.current[7] = el)} geometry={plane} material={mastPlanes[3]} position={[-0.7, 6, 0]} rotation={[0, Math.PI / 2, 0]} scale={[1.4, 12, 1]} />
      <group ref={jib} position={[0, 12, 0]}>
        <mesh geometry={box} material={mats.crane} position={[12, 1.05, 0]} scale={[25, 0.12, 0.12]} castShadow />
        <mesh geometry={box} material={mats.crane} position={[12, -0.1, 0.6]} scale={[25, 0.12, 0.12]} castShadow />
        <mesh geometry={box} material={mats.crane} position={[12, -0.1, -0.6]} scale={[25, 0.12, 0.12]} castShadow />
        <mesh geometry={plane} material={jibPlanes[0]} position={[12, 0.5, 0.6]} scale={[25, 1.1, 1]} onUpdate={(o) => jibPlanes[0].map.repeat.set(25 / 1.1, 1)} />
        <mesh geometry={plane} material={jibPlanes[1]} position={[12, 0.5, -0.6]} scale={[25, 1.1, 1]} onUpdate={() => jibPlanes[1].map.repeat.set(25 / 1.1, 1)} />
        <mesh geometry={box} material={mats.crane} position={[-4.5, 0.5, 0]} scale={[9, 0.12, 0.12]} castShadow />
        <mesh geometry={plane} material={jibPlanes[2]} position={[-4.5, 0.5, 0.5]} scale={[9, 1.1, 1]} onUpdate={() => jibPlanes[2].map.repeat.set(9 / 1.1, 1)} />
        {[0, 1, 2].map((i) => (
          <mesh key={i} geometry={box} material={mats.weight} position={[-7.6 + i * 1.2, 0.05, 0]} scale={[1.1, 1.2, 1.5]} castShadow />
        ))}
        <mesh geometry={box} material={mats.cabin} position={[1.4, -0.9, 0.9]} scale={[1.7, 1.5, 1.6]} castShadow />
        <mesh geometry={box} material={mats.glass} position={[2.26, -0.85, 0.9]} scale={[0.04, 0.9, 1.2]} />
        <mesh geometry={box} material={mats.crane} position={[0, 3.2, 0]} scale={[0.22, 4.6, 0.22]} castShadow />
        <mesh geometry={box} material={mats.steel} position={[11, 3.2, 0]} rotation={[0, 0, -0.2018]} scale={[22.5, 0.05, 0.05]} />
        <mesh geometry={box} material={mats.steel} position={[-4, 3.2, 0]} rotation={[0, 0, 0.5126]} scale={[9.2, 0.05, 0.05]} />
        <mesh geometry={ico} material={mats.beacon} position={[0, 5.65, 0]} scale={[0.26, 0.26, 0.26]} />
        <group ref={trolley} position={[15, 0, 0]}>
          <mesh geometry={box} material={mats.steel} position={[0, -0.35, 0]} scale={[1.1, 0.45, 1.5]} castShadow />
          <mesh ref={cable} geometry={cyl} material={mats.steel} position={[0, -4, 0]} scale={[0.03, 7, 0.03]} />
          <group ref={hookGroup} position={[0, -7.5, 0]}>
            <mesh geometry={box} material={mats.steel} scale={[0.55, 0.7, 0.55]} castShadow />
            {[[-0.9, 0.4], [0.9, 0.4]].map(([sx, sy], i) => (
              <mesh key={i} geometry={box} material={mats.steel} position={[sx * 0.5, -0.9, 0]} rotation={[0, 0, sx > 0 ? 0.62 : -0.62]} scale={[0.03, 1.5, 0.03]} />
            ))}
            <mesh geometry={box} material={mats.timber} position={[0, -2.2, 0]} scale={[2.6, 1.4, 1.2]} castShadow />
          </group>
        </group>
      </group>
    </group>
  );
}

// The ground the tower stands on: a stone plinth that grows with it, and trees planted once the building is finished.
function Site({ mats, blocks, floors, state }) {
  const plinth = useRef();
  const catcher = useRef();
  const lobby = useRef();
  const trees = useRef([]);
  const podiumW = blocks === 2 ? 46 : 30;
  const spots = useMemo(() => {
    const r = rng(14);
    const out = [];
    for (let i = 0; i < 9; i++) out.push({ x: -20 + i * 5, z: 13.4 + (r() - 0.5) * 0.8, s: 1.5 + r() * 0.6 });
    for (let i = 0; i < 7; i++) out.push({ x: -17 + i * 5.6, z: -13.4 + (r() - 0.5) * 0.8, s: 1.4 + r() * 0.6 });
    return out;
  }, []);
  useFrame(() => {
    const b = state.s_build;
    const t = ease(clamp01(b / 0.045));
    const on = t > 0.002;
    plinth.current.visible = on;
    catcher.current.visible = on;
    if (on) plinth.current.scale.setScalar(Math.max(t, 0.001));
    const N2 = stagesOf(b, floors)[2];
    const land = ease(clamp01((N2 - (floors - 1.6)) / 1.6));
    lobby.current.visible = land > 0.002;
    lobby.current.scale.setScalar(Math.max(land, 0.001));
    trees.current.forEach((tr, i) => {
      if (!tr) return;
      const k = ease(clamp01(land * 1.4 - (i / spots.length) * 0.4));
      tr.visible = k > 0.002;
      tr.scale.setScalar(Math.max(k, 0.001));
    });
  });
  return (
    <group>
      <group ref={plinth}>
        <mesh geometry={box} material={mats.stone} position={[0, 0.2, 0]} scale={[podiumW, 0.4, 32]} receiveShadow castShadow />
        <mesh geometry={box} material={mats.stoneDark} position={[0, 0.07, 17.6]} scale={[podiumW * 0.46, 0.14, 3.2]} receiveShadow />
        <mesh geometry={box} material={mats.stoneDark} position={[0, 0.02, 19.6]} scale={[podiumW * 0.36, 0.04, 1.6]} receiveShadow />
      </group>
      <group ref={lobby}>
        <mesh geometry={box} material={mats.metal} position={[-10.5, 4.4, 11.6]} scale={[10, 0.25, 5.4]} castShadow />
        <mesh geometry={box} material={mats.glass} position={[-10.5, 2.3, 9.3]} scale={[8.5, 3.6, 0.08]} />
        {[-14, -7].map((px) => (
          <mesh key={px} geometry={cyl} material={mats.metal} position={[px, 2.2, 13.6]} scale={[0.1, 4.4, 0.1]} castShadow />
        ))}
      </group>
      {spots.map((s, i) => (
        <group key={i} ref={(el) => (trees.current[i] = el)} position={[s.x, 0.4, s.z]} visible={false}>
          <mesh geometry={cyl} material={mats.trunk} position={[0, s.s * 0.8, 0]} scale={[0.14, s.s * 1.6, 0.14]} castShadow />
          <mesh geometry={ico} material={mats.leaf} position={[0, s.s * 2.1, 0]} scale={[s.s * 0.95, s.s * 0.85, s.s * 0.95]} castShadow />
          <mesh geometry={ico} material={mats.leaf} position={[s.s * 0.35, s.s * 1.7, 0.2]} scale={[s.s * 0.6, s.s * 0.55, s.s * 0.6]} castShadow />
        </group>
      ))}
      <mesh ref={catcher} rotation-x={-Math.PI / 2} position={[0, 0.004, 0]} receiveShadow visible={false}>
        <planeGeometry args={[340, 340]} />
        <shadowMaterial transparent opacity={0.22} />
      </mesh>
    </group>
  );
}

export function BuildModel({ state, palette = 'ochre', floors = 14, blocks = 2 }) {
  const mats = useBuildMaterials(palette);
  state.mats = mats;
  const w = 13;
  const d = 16;
  useFrame(() => {
    // Day glass is a mirror of the sky; at night it turns clear so the lit rooms show through.
    mats.glass.opacity = THREE.MathUtils.lerp(0.94, 0.46, smooth(0.25, 0.85, state.s_dusk));
  });
  return (
    <group>
      <Site mats={mats} blocks={blocks} floors={floors} state={state} />
      {blocks === 2 ? (
        <>
          <Block id={0} x={-11.5} z={-1.5} w={w} d={d} floors={floors} mats={mats} state={state} />
          <Block id={1} x={11.5} z={2.5} w={w} d={d - 1.5} floors={Math.max(floors - 2, 6)} mats={mats} state={state} />
          <Crane x={-1.5} z={-14} floors={floors} state={state} mats={mats} />
        </>
      ) : (
        <>
          <Block id={0} x={0} z={0} w={w + 2} d={d} floors={floors} mats={mats} state={state} />
          <Crane x={13} z={-13} floors={floors} state={state} mats={mats} />
        </>
      )}
    </group>
  );
}

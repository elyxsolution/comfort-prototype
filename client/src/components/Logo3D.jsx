import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import L from '../lib/logoShapes.json';

// The logo, traced from the client's own artwork: 27 gold wavy rays on an arc, and the teal lettering.
// Everything below is measured in the traced image's units (about 1600 wide).
const [CX, CY] = L.center;
const B = L.bounds;
const BW = B.x1 - B.x0;
const BH = B.y1 - B.y0;
const BCX = (B.x0 + B.x1) / 2;
const BCY = (B.y0 + B.y1) / 2;
const TS = L.textScale;
// When the rays complete their circle it reaches below the artwork, so the drawing frame is taller than the logo.
const FRAME_PAD = 60;
const FRAME_X0 = B.x0 - FRAME_PAD;
const FRAME_X1 = B.x1 + FRAME_PAD;
const FRAME_Y0 = B.y0 - FRAME_PAD;
const FRAME_Y1 = Math.max(B.y1, CY + (CY - B.y0)) + FRAME_PAD;
const FRAME_W = FRAME_X1 - FRAME_X0;
const FRAME_H = FRAME_Y1 - FRAME_Y0;
export const LOGO_ASPECT = BW / BH;

const RB = (() => { const xs = [], ys = []; L.rays.forEach((d) => { const n = d.match(/-?\d+\.?\d*/g).map(Number); n.forEach((v, i) => (i % 2 ? ys : xs).push(v)); }); return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) }; })();
const nums = (d) => (d.match(/-?\d+\.?\d*/g) || []).map(Number);
const loader = new SVGLoader();
const shapesOf = (d) => loader.parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}" fill-rule="evenodd"/></svg>`).paths.flatMap((p) => SVGLoader.createShapes(p));
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function buildGeometry() {
  const rayShapes = L.rays.map(shapesOf);
  const rayGeos = rayShapes.map((s) => {
    const g = new THREE.ExtrudeGeometry(s, { depth: 26, bevelEnabled: true, bevelThickness: 7, bevelSize: 5, bevelSegments: 3, curveSegments: 10 });
    g.translate(-CX, -CY, -13);
    g.scale(1, -1, 1);
    return g;
  });
  const textGeos = L.text.map((d) => {
    const s = shapesOf(d);
    const g = new THREE.ExtrudeGeometry(s, { depth: 34, bevelEnabled: true, bevelThickness: 8, bevelSize: 6, bevelSegments: 3, curveSegments: 10 });
    g.translate(-BCX / TS, -BCY / TS, -17);
    g.scale(TS, -TS, TS);
    return g;
  });
  // where each letter sits (for the hover wave), in logo units from the left edge
  const textX = L.text.map((d) => {
    const n = nums(d);
    const xs = n.filter((_, i) => i % 2 === 0);
    return ((Math.min(...xs) + Math.max(...xs)) / 2) * TS - B.x0;
  });
  const textY = L.text.map((d) => {
    const n = nums(d);
    const ys = n.filter((_, i) => i % 2 === 1);
    return ((Math.min(...ys) + Math.max(...ys)) / 2) * TS;
  });
  return { rayGeos, textGeos, textX, textY };
}

function Scene({ api, tone, still }) {
  const { camera, size, invalidate, gl, scene } = useThree();
  const G = useMemo(buildGeometry, []);
  const arc = useRef();
  const group = useRef();
  const rays = useRef([]);
  const copies = useRef([]);
  const letters = useRef([]);
  const mount = useRef(performance.now() / 1000);
  const state = useRef({ hover: 0, px: 0, py: 0, rx: 0, ry: 0 });
  const dark = tone === 'dark';
  const mats = useMemo(
    () => ({
      gold: new THREE.MeshStandardMaterial({ color: '#c19a40', metalness: 0.25, roughness: 0.5, envMapIntensity: 0.45, emissive: '#c9a45a', emissiveIntensity: 0, side: THREE.DoubleSide }),
      teal: new THREE.MeshStandardMaterial({ color: dark ? '#86cdbc' : '#256a59', metalness: 0.05, roughness: 0.6, envMapIntensity: 0.3, side: THREE.DoubleSide }),
    }),
    [dark]
  );

  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pm.dispose();
    };
  }, [gl, scene]);

  useEffect(() => {
    camera.zoom = size.width / FRAME_W;
    camera.position.set((FRAME_X0 + FRAME_X1) / 2 - BCX, -((FRAME_Y0 + FRAME_Y1) / 2 - BCY), 1500);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size, invalidate]);

  api.current.invalidate = invalidate;
  api.current.state = state.current;

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const t = performance.now() / 1000;
    const s = state.current;
    let busy = false;

    // hover and pointer follow
    const target = 0;
    s.hover += (target - s.hover) * (1 - Math.exp(-dt * 7));
    const h = 0;

    // intro: the rays draw in around the arc, then the lettering follows
    const intro = still ? 99 : t - mount.current;
    if (intro < 2.6) busy = true;

    // click: the circle completes, turns once, then returns to the logo
    const a = api.current.anim;
    let p = -1;
    if (a) {
      p = (t - a.t0) / a.dur;
      if (p >= 1) api.current.anim = null;
      else busy = true;
    }
    const ring = p >= 0 ? p : 0;
    const complete = smooth(0, 0.3, ring);
    const retract = smooth(0.8, 1, ring);
    const spin = easeInOut(smooth(0.3, 0.8, ring));

    arc.current.rotation.z = -spin * Math.PI * 2;
    mats.gold.emissiveIntensity = 0.5 * (complete - retract) * (p >= 0 ? 1 : 0) + h * 0.12;

    const n = rays.current.length;
    rays.current.forEach((m, i) => {
      if (!m) return;
      const drawIn = easeOut(clamp01((intro - 0.04 * i) / 0.8));
      const wave = Math.sin(t * 4.2 - i * 0.5);
      m.scale.setScalar(Math.max(drawIn, 0.0001) * (1 + h * 0.06 * Math.abs(wave)));
      m.position.z = h * wave * 34;
      m.rotation.z = h * Math.sin(t * 3.1 - i * 0.42) * 0.045;
      m.rotation.x = h * Math.cos(t * 3.1 - i * 0.42) * 0.25;
    });
    copies.current.forEach((m, i) => {
      if (!m) return;
      const grow = easeOut(clamp01(complete * 1.7 - 0.7 * (i / n)));
      const gone = easeOut(clamp01(retract * 1.7 - 0.7 * (1 - i / n)));
      const v = Math.max(grow * (1 - gone), 0.0001);
      m.scale.setScalar(v);
      m.visible = v > 0.001;
      m.position.z = Math.sin(t * 5 - i * 0.5) * 14 * v;
    });
    letters.current.forEach((m, i) => {
      if (!m) return;
      const lx = G.textX[i] / BW;
      const reveal = easeOut(clamp01((intro - 0.5 - lx * 0.8) / 0.55));
      const hop = h * Math.max(0, Math.sin(t * 4.2 - lx * 7)) * 12;
      const clickHop = p >= 0 && p < 0.45 ? Math.max(0, Math.sin((p / 0.45) * Math.PI - lx * 3.5)) * 16 : 0;
      m.scale.setScalar(Math.max(reveal, 0.0001));
      m.position.y = -(hop + clickHop) + (1 - reveal) * -26;
      m.position.z = reveal * (h * 10 + clickHop * 0.5);
      m.rotation.y = 0;
    });

    if (busy) invalidate();
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[-500, 700, 900]} intensity={1.7} />
      <directionalLight position={[600, -300, 500]} intensity={0.7} color="#9fd8ff" />
      <group ref={group} position={[0, 0, 0]}>
        {/* the arc of rays, pivoting about the arc's own centre */}
        <group ref={arc} position={[CX - BCX, -(CY - BCY), 0]}>
          {G.rayGeos.map((g, i) => (
            <mesh key={'r' + i} ref={(el) => (rays.current[i] = el)} geometry={g} material={mats.gold} />
          ))}
          {G.rayGeos.map((g, i) => (
            <mesh key={'c' + i} ref={(el) => (copies.current[i] = el)} geometry={g} material={mats.gold} rotation-z={Math.PI} visible={false} scale={0.0001} />
          ))}
        </group>
        {G.textGeos.map((g, i) => (
          <mesh key={'t' + i} ref={(el) => (letters.current[i] = el)} geometry={g} material={mats.teal} position={[0, 0, 0]} />
        ))}
      </group>
    </>
  );
}

// Static vector version: used while the 3D loads, if WebGL is unavailable, and for the small mark in the dock.
export function LogoSvg({ tone = 'light', mark = false, className = '', style, title = 'Comfort Builders & Developers' }) {
  const teal = tone === 'dark' ? '#7cc4b3' : L.colors.teal;
  const vb = mark ? `${RB.x0 - 6} ${RB.y0 - 6} ${RB.x1 - RB.x0 + 12} ${RB.y1 - RB.y0 + 12}` : `${B.x0} ${B.y0} ${BW} ${BH}`;
  return (
    <svg className={className} style={style} viewBox={vb} role="img" aria-label={title} focusable="false">
      {L.rays.map((d, i) => <path key={i} d={d} fill={L.colors.gold} />)}
      {!mark && (
        <g transform={`scale(${TS})`}>
          {L.text.map((d, i) => <path key={i} d={d} fill={teal} fillRule="evenodd" />)}
        </g>
      )}
    </svg>
  );
}

class Boundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// The logo as a link. It does nothing on hover; click it to watch the circle of rays complete, turn once, and return.
export default function Logo3D({ height = 52, tone = 'light', className = '', to = '/', label = 'Comfort Builders and Developers, home' }) {
  const wrap = useRef();
  const api = useRef({ inside: false, px: 0, py: 0, anim: null, invalidate: () => {} });
  const [still, setStill] = useState(false);
  const [ready, setReady] = useState(false);
  const width = height * LOGO_ASPECT;
  const canvasW = width * (FRAME_W / BW);
  const canvasH = height * (FRAME_H / BH);

  useEffect(() => {
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setStill(rm.matches);
    sync();
    rm.addEventListener('change', sync);
    return () => rm.removeEventListener('change', sync);
  }, []);

  const click = () => {
    if (still) return;
    api.current.anim = { t0: performance.now() / 1000, dur: 3.4 };
    api.current.invalidate();
  };

  return (
    <Link
      ref={wrap}
      to={to}
      className={`logo3d ${className}`}
      style={{ width, height }}
      aria-label={label}
      onClick={click}
    >
      {!ready && <LogoSvg className="logo3d__fallback" tone={tone} />}
      <Boundary fallback={<LogoSvg className="logo3d__fallback" tone={tone} />}>
        <div className="logo3d__canvas" style={{ width: canvasW, height: canvasH, left: -(width * (FRAME_PAD / BW)), top: -(height * (FRAME_PAD / BH)), opacity: ready ? 1 : 0 }}>
          <Canvas
            orthographic
            frameloop="demand"
            dpr={[1, 2]}
            camera={{ position: [0, 0, 1500], near: 1, far: 4000, zoom: 1 }}
            gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
            onCreated={({ gl }) => {
              gl.setClearColor(0x000000, 0);
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.05;
              setReady(true);
            }}
          >
            <Suspense fallback={null}>
              <Scene api={api} tone={tone} still={still} />
            </Suspense>
          </Canvas>
        </div>
      </Boundary>
    </Link>
  );
}

import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, ToneMapping, Vignette, N8AO, SMAA } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { TowerModel } from './Tower.jsx';
import { BuildModel } from './BuildTower.jsx';

// Shared, mutable scene state. Scroll triggers write the target values; the rig damps toward them.
export function createStageState(initial = {}) {
  const s = {
    build: 1,
    dusk: 0,
    rot: 0.55,
    zoom: 1.34,
    lift: 0.22,
    look: 0.38,
    mx: 0,
    my: 0,
    reduced: false,
    onBg: null,
    ...initial,
  };
  ['build', 'dusk', 'rot', 'zoom', 'lift', 'look'].forEach((k) => (s['s_' + k] = s[k]));
  return s;
}

const DAY_SUN = new THREE.Color('#ffe3b8');
const DUSK_SUN = new THREE.Color('#ff9a5c');
const FOG_DAY = new THREE.Color('#d6dce6');
const FOG_DUSK = new THREE.Color('#141a2c');
const tmp = new THREE.Color();

function configureSky(sky) {
  const u = sky.material.uniforms;
  u.turbidity.value = 2.6;
  u.rayleigh.value = 1.3;
  u.mieCoefficient.value = 0.004;
  u.mieDirectionalG.value = 0.8;
  return sky;
}

function Rig({ state, orbit, quality, scenic, bgDay, bgNight }) {
  const { camera, scene, gl } = useThree();
  const sun = useRef();
  const moon = useRef();
  const bloom = useRef();
  const lastEnv = useRef({ d: -9, a: -9 });
  const day = useMemo(() => new THREE.Color(bgDay), [bgDay]);
  const night = useMemo(() => new THREE.Color(bgNight), [bgNight]);
  const bg = useMemo(() => new THREE.Color(bgDay), [bgDay]);
  const sky = useMemo(() => {
    const s = configureSky(new Sky());
    s.scale.setScalar(1000);
    return s;
  }, []);
  // A second sky, rendered once in a while into a cube map: the glass and brass reflect the real sky and sun.
  const env = useMemo(() => {
    const envScene = new THREE.Scene();
    const s = configureSky(new Sky());
    s.scale.setScalar(1000);
    envScene.add(s);
    return { scene: envScene, sky: s, pmrem: new THREE.PMREMGenerator(gl), rt: null };
  }, [gl]);
  const sunVec = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    if (!scenic) scene.background = bg;
    return () => {
      env.rt?.dispose();
      env.pmrem.dispose();
    };
  }, [env, scenic, scene, bg]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const k = state.reduced ? 100 : 3.2;
    // The build is eased with a soft critically-damped follow, so it glides through fast wheel flicks and reverses cleanly.
    state.s_build = THREE.MathUtils.damp(state.s_build, state.build, state.reduced ? 100 : 2.4, dt);
    if (state.build === 0 && state.s_build < 0.0025) state.s_build = 0;
    if (state.build === 1 && state.s_build > 0.9975) state.s_build = 1;
    state.s_dusk = THREE.MathUtils.damp(state.s_dusk, state.dusk, k * 0.8, dt);
    state.s_rot = THREE.MathUtils.damp(state.s_rot, state.rot, k * 0.7, dt);
    state.s_zoom = THREE.MathUtils.damp(state.s_zoom, state.zoom, k * 0.8, dt);
    state.s_lift = THREE.MathUtils.damp(state.s_lift, state.lift, k * 0.8, dt);
    state.s_look = THREE.MathUtils.damp(state.s_look, state.look, k * 0.8, dt);

    const d = state.s_dusk;
    const t = state.reduced ? 0 : performance.now() / 1000;
    const az = state.s_rot + t * (orbit ? 0.02 : 0.01) + state.mx * 0.08;
    const r = 128 * state.s_zoom;
    const h = 9 + state.s_lift * 50 + state.my * -3;
    camera.position.set(Math.sin(az) * r, h, Math.cos(az) * r);
    camera.lookAt(0, 6 + state.s_look * 34, 0);

    // Golden hour (10 degrees) sinking below the horizon (-7). The sun keeps to one side of the plot and only drifts as you turn.
    const el = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(scenic ? 10 : 24, -7, d));
    const sa = 0.95 + (state.s_rot - 0.55) * 0.3;
    sunVec.set(Math.cos(el) * Math.sin(sa), Math.sin(el), Math.cos(el) * Math.cos(sa));
    sky.material.uniforms.sunPosition.value.copy(sunVec);

    const daylight = 1 - THREE.MathUtils.smoothstep(d, 0.2, 0.9);
    sun.current.position.copy(sunVec).multiplyScalar(140);
    sun.current.intensity = (scenic ? 4.2 : 2.7) * daylight;
    sun.current.color.lerpColors(DAY_SUN, DUSK_SUN, THREE.MathUtils.smoothstep(d, 0.05, 0.6));
    moon.current.intensity = (scenic ? 0.55 : 0.9) * THREE.MathUtils.smoothstep(d, 0.4, 1);

    if (scenic) {
      tmp.lerpColors(FOG_DAY, FOG_DUSK, THREE.MathUtils.smoothstep(d, 0.1, 0.9));
      scene.fog?.color.copy(tmp);
    } else {
      // The page turns from paper to night as the tower is finished; the canvas and the page share the same colour.
      bg.lerpColors(day, night, THREE.MathUtils.smoothstep(d, 0.12, 0.92));
      state.onBg?.('#' + bg.getHexString());
    }

    // Re-light the reflections only when the sky has really changed.
    if (Math.abs(d - lastEnv.current.d) > 0.025 || Math.abs(sa - lastEnv.current.a) > 0.05) {
      env.sky.material.uniforms.sunPosition.value.copy(sunVec);
      env.rt?.dispose();
      env.rt = env.pmrem.fromScene(env.scene, 0, 0.1, 1200);
      scene.environment = env.rt.texture;
      scene.environmentIntensity = THREE.MathUtils.lerp(scenic ? 1 : 0.8, 0.5, d);
      lastEnv.current = { d, a: sa };
    }

    const lit = THREE.MathUtils.smoothstep(d, 0.22, 0.88);
    state.mats?.interior.forEach((m) => (m.emissiveIntensity = lit * 2.7));
    if (state.mats) state.mats.lamp.emissiveIntensity = lit * 3.4;
    if (bloom.current) bloom.current.intensity = (scenic ? 0.12 : 0.05) + lit * 0.95;
  }, -1);

  return (
    <>
      {scenic && <primitive object={sky} />}
      {scenic && <fog attach="fog" args={['#d6dce6', 130, 560]} />}
      <directionalLight
        ref={sun}
        castShadow
        shadow-mapSize={quality === 'low' ? [1024, 1024] : [3072, 3072]}
        shadow-camera-left={-62}
        shadow-camera-right={62}
        shadow-camera-top={66}
        shadow-camera-bottom={-44}
        shadow-camera-near={10}
        shadow-camera-far={340}
        shadow-bias={-0.0003}
        shadow-normalBias={0.04}
      />
      <directionalLight ref={moon} position={[-60, 80, 40]} color="#8fa6ff" />
      <EffectComposer multisampling={0}>
        {quality === 'low' ? <SMAA /> : <N8AO aoRadius={3.2} distanceFalloff={1.2} intensity={2.4} quality="medium" color="#0a0f1c" />}
        <Bloom ref={bloom} mipmapBlur luminanceThreshold={0.97} luminanceSmoothing={0.2} intensity={0.1} radius={0.7} />
        {scenic ? <Vignette eskil={false} offset={0.3} darkness={0.42} /> : <></>}
        {scenic ? <ToneMapping mode={ToneMappingMode.ACES_FILMIC} /> : <></>}
        <SMAA />
      </EffectComposer>
    </>
  );
}

class Boundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <div className="stage-fallback" role="img" aria-label="Illustration of a Comfort Builders apartment tower" /> : this.props.children;
  }
}

export default function TowerStage({
  state,
  palette = 'ochre',
  floors = 14,
  blocks = 2,
  orbit = false,
  label,
  scenic = false,
  bgDay = '#f3f3f0',
  bgNight = '#090d1c',
  className = '',
  still = false,
}) {
  const wrap = useRef();
  const [visible, setVisible] = useState(true);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      setMobile(mq.matches);
      state.reduced = rm.matches || still;
    };
    sync();
    mq.addEventListener('change', sync);
    rm.addEventListener('change', sync);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '120px' });
    io.observe(wrap.current);
    const onMove = (e) => {
      state.mx = (e.clientX / window.innerWidth - 0.5) * 2;
      state.my = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      mq.removeEventListener('change', sync);
      rm.removeEventListener('change', sync);
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }, [state, still]);

  return (
    <div ref={wrap} className={`stage-canvas ${className}`} role="img" aria-label={label || 'Interactive 3D model of a Comfort Builders apartment tower'}>
      <Boundary>
        <Canvas
          flat
          shadows="soft"
          dpr={mobile ? [1, 1.25] : [1, 1.6]}
          frameloop={visible ? 'always' : 'never'}
          camera={{ fov: 26, near: 1, far: 2400, position: [0, 20, 128] }}
          gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
        >
          <Suspense fallback={null}>
            <Rig state={state} orbit={orbit} quality={mobile ? 'low' : 'high'} scenic={scenic} bgDay={bgDay} bgNight={bgNight} />
            {scenic ? (
              <TowerModel state={state} palette={palette} floors={floors} blocks={blocks} scenic />
            ) : (
              <BuildModel state={state} palette={palette} floors={floors} blocks={blocks} />
            )}
          </Suspense>
        </Canvas>
      </Boundary>
    </div>
  );
}

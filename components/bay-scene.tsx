"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, useTexture } from "@react-three/drei";

/* the hero mark IS the logo artwork: the image is cut into a grid of shards
   that fly in from everywhere and reassemble the picture, then crossfade to
   the seamless full-resolution plane */
const PLANE_W = 5.4;
const PLANE_H = 5.25;
const GRID = 12;
const FLOAT_Y = 1.0;

/* deterministic PRNG so every load (and screenshot) matches */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const easeOutQuart = (p: number) => 1 - Math.pow(1 - p, 4);
const smoothstep = (p: number) => {
  const c = THREE.MathUtils.clamp(p, 0, 1);
  return c * c * (3 - 2 * c);
};

function ShatteredLogo({ timeOffset = 0 }: { timeOffset?: number }) {
  const tiles = useRef<THREE.Group>(null!);
  const imagePlane = useRef<THREE.Mesh>(null!);
  const imageMat = useRef<THREE.MeshBasicMaterial>(null!);
  const float = useRef<THREE.Group>(null!);
  const parallax = useRef<THREE.Group>(null!);
  // fit the mark on narrow (mobile) viewports
  const viewport = useThree((s) => s.viewport);
  const fit = Math.min(1, viewport.width / 7);

  const tex = useTexture("/logo-hero.webp?v=3");
  useEffect(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 16;
    tex.needsUpdate = true;
  }, [tex]);

  const tileMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
      }),
    [tex],
  );

  const { geometries, targets, starts, delays, axes, angles, scatters } =
    useMemo(() => {
      const geometries: THREE.PlaneGeometry[] = [];
      const targets: THREE.Vector3[] = [];
      const starts: THREE.Vector3[] = [];
      const delays: number[] = [];
      const axes: THREE.Vector3[] = [];
      const angles: number[] = [];
      const scatters: THREE.Vector3[] = [];
      const rand = mulberry32(20170901);
      const tw = PLANE_W / GRID;
      const th = PLANE_H / GRID;
      for (let gy = 0; gy < GRID; gy++) {
        for (let gx = 0; gx < GRID; gx++) {
          const geo = new THREE.PlaneGeometry(tw, th);
          const uv = geo.attributes.uv as THREE.BufferAttribute;
          for (let i = 0; i < uv.count; i++) {
            uv.setXY(i, (gx + uv.getX(i)) / GRID, (gy + uv.getY(i)) / GRID);
          }
          geometries.push(geo);
          targets.push(
            new THREE.Vector3(
              (gx + 0.5 - GRID / 2) * tw,
              (gy + 0.5 - GRID / 2) * th,
              0,
            ),
          );
          const dir = new THREE.Vector3(
            rand() * 2 - 1,
            rand() * 2 - 1,
            rand() * 2 - 1,
          ).normalize();
          starts.push(dir.multiplyScalar(13 + rand() * 8));
          delays.push(rand() * 1.0);
          axes.push(
            new THREE.Vector3(
              rand() * 2 - 1,
              rand() * 2 - 1,
              rand() * 2 - 1,
            ).normalize(),
          );
          angles.push((1.5 + rand() * 2) * Math.PI);
          // direction the shard drifts when the user scrolls
          scatters.push(
            new THREE.Vector3(
              rand() * 2 - 1,
              rand() * 2 - 1,
              rand() * 2 - 1,
            )
              .normalize()
              .multiplyScalar(1.2 + rand() * 2),
          );
        }
      }
      return { geometries, targets, starts, delays, axes, angles, scatters };
    }, []);

  const tmp = useMemo(() => new THREE.Vector3(), []);

  const sheenMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uMap: { value: tex },
          uTime: { value: 0 },
          uStrength: { value: 0 },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D uMap;
          uniform float uTime;
          uniform float uStrength;
          varying vec2 vUv;
          void main() {
            float a = texture2D(uMap, vUv).a;
            float d = (vUv.x + vUv.y) * 0.5;
            float pos = fract(uTime * 0.14) * 1.7 - 0.35;
            float band = smoothstep(0.1, 0.0, abs(d - pos));
            float i = band * a * uStrength * 0.5;
            gl_FragColor = vec4(vec3(0.75, 0.85, 1.0) * i, i);
          }
        `,
      }),
    [tex],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime + timeOffset;
    const fuse = smoothstep((t - 2.4) / 0.9);
    // scrolling pulls the assembled image back apart into shards
    const scroll = smoothstep(
      Math.min(1, (typeof window !== "undefined" ? window.scrollY : 0) / 520),
    );
    // crossfade the assembled shards into the seamless full image
    const cross = smoothstep((fuse - 0.8) / 0.2) * (1 - scroll);

    tiles.current.visible = cross < 1;
    tileMaterial.opacity = 1 - cross * cross;
    imagePlane.current.visible = cross > 0;
    imageMat.current.opacity = cross;
    sheenMaterial.uniforms.uTime.value = t;
    sheenMaterial.uniforms.uStrength.value = cross;

    const kids = tiles.current.children;
    for (let i = 0; i < kids.length; i++) {
      const m = kids[i] as THREE.Mesh;
      const p = THREE.MathUtils.clamp((t - 0.3 - delays[i]) / 1.6, 0, 1);
      const e = easeOutQuart(p);
      tmp.lerpVectors(starts[i], targets[i], e);
      tmp.addScaledVector(scatters[i], scroll * e);
      tmp.y += Math.sin(t * 1.2 + i * 1.7) * 0.015 * e * (1 - cross);
      m.position.copy(tmp);
      m.quaternion.setFromAxisAngle(
        axes[i],
        angles[i] * (1 - e) + scroll * 0.8,
      );
    }

    // gentle float + slow sway (no pointer coupling)
    float.current.position.y = FLOAT_Y + Math.sin(t * 0.5) * 0.06 * fuse;
    parallax.current.rotation.y = Math.sin(t * 0.3) * 0.035;
    parallax.current.rotation.x = Math.cos(t * 0.23) * 0.015;
  });

  return (
    <group ref={float} position={[0.05, FLOAT_Y, 0.4]} scale={fit}>
      <group ref={parallax}>
        <group ref={tiles}>
          {geometries.map((geo, i) => (
            <mesh key={i} geometry={geo} material={tileMaterial} />
          ))}
        </group>
        <mesh ref={imagePlane} visible={false} renderOrder={1}>
          <planeGeometry args={[PLANE_W, PLANE_H]} />
          <meshBasicMaterial
            ref={imageMat}
            map={tex}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {/* glossy light sweep gliding across the mark */}
        <mesh
          position={[0, 0, 0.02]}
          renderOrder={2}
          material={sheenMaterial}
        >
          <planeGeometry args={[PLANE_W, PLANE_H]} />
        </mesh>
      </group>
    </group>
  );
}

/* shared wave field: the silk sheet (GLSL) and the threads (JS) sample the
   SAME function, so the lines ride the fabric instead of drifting on their own */
const SILK_POS = { x: 0, y: -2.3, z: -3 } as const;
function silkWaveH(x: number, y: number, t: number) {
  const wx = x + Math.sin(y * 0.35 + t * 0.2) * 1.2; // domain warp
  let h = 0;
  h += Math.sin(wx * 0.22 + t * 0.4 + y * 0.12) * 0.75;
  h += Math.sin(wx * 0.45 - t * 0.28 + y * 0.3) * 0.4;
  h += Math.sin(y * 0.55 + t * 0.34 + wx * 0.18) * 0.32;
  h += Math.sin((wx - y) * 0.9 + t * 0.6) * 0.1;
  h += Math.sin(x * 1.9 + t * 1.1 + y * 1.4) * 0.05; // micro cloth ripple
  h += Math.sin(y * 2.4 - t * 0.85 + x * 0.7) * 0.04;
  return h * 0.85;
}

/* flowing silk sheet — smooth liquid-fabric waves in the lower third */
function SilkWave() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: { uTime: { value: 0 } },
        vertexShader: /* glsl */ `
          uniform float uTime;
          varying vec3 vNormal;
          varying vec3 vPos;
          varying vec2 vUv;
          varying float vH;

          float waveH(vec2 p) {
            float t = uTime;
            float wx = p.x + sin(p.y * 0.35 + t * 0.2) * 1.2; // domain warp
            float h = 0.0;
            h += sin(wx * 0.22 + t * 0.40 + p.y * 0.12) * 0.75;
            h += sin(wx * 0.45 - t * 0.28 + p.y * 0.30) * 0.40;
            h += sin(p.y * 0.55 + t * 0.34 + wx * 0.18) * 0.32;
            h += sin((wx - p.y) * 0.90 + t * 0.60) * 0.10;
            h += sin(p.x * 1.9 + t * 1.1 + p.y * 1.4) * 0.05; // micro cloth
            h += sin(p.y * 2.4 - t * 0.85 + p.x * 0.7) * 0.04;
            return h * 0.85;
          }

          void main() {
            vUv = uv;
            vec3 pos = position;
            float h = waveH(pos.xy);
            pos.z += h;
            float eps = 0.4;
            float hx = waveH(position.xy + vec2(eps, 0.0));
            float hy = waveH(position.xy + vec2(0.0, eps));
            vec3 n = normalize(vec3(-(hx - h) / eps, -(hy - h) / eps, 1.0));
            vNormal = normalMatrix * n;
            vH = h;
            vec4 mv = modelViewMatrix * vec4(pos, 1.0);
            vPos = mv.xyz;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          varying vec3 vNormal;
          varying vec3 vPos;
          varying vec2 vUv;
          varying float vH;

          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
          }

          void main() {
            vec3 N = normalize(vNormal);
            vec3 V = normalize(-vPos);
            float ndv = max(dot(N, V), 0.0);
            float fres = pow(1.0 - ndv, 2.5);

            vec3 deep = vec3(0.025, 0.045, 0.11);
            vec3 mid  = vec3(0.09, 0.13, 0.34);
            vec3 lav  = vec3(0.52, 0.55, 0.93);
            vec3 teal = vec3(0.35, 0.85, 0.80);
            vec3 ice  = vec3(0.55, 0.85, 1.00);

            float hN = clamp(vH * 0.38 + 0.5, 0.0, 1.0);
            // sheen hue drifts between lavender and teal across the fabric
            float hueMix = 0.5 + 0.5 * sin(vUv.x * 9.0 + vH * 1.5);
            vec3 sheenCol = mix(lav, teal, hueMix * 0.45);
            vec3 col = mix(deep, mid, hN);
            col = mix(col, sheenCol, smoothstep(0.62, 0.98, hN) * 0.55);

            vec3 L = normalize(vec3(0.3, 0.45, 0.85));
            float spec = pow(max(dot(reflect(-L, N), V), 0.0), 40.0);
            col += ice * spec * 0.55;
            col += sheenCol * fres * 0.18;

            float fadeX = smoothstep(0.0, 0.14, vUv.x) * smoothstep(1.0, 0.86, vUv.x);
            float fadeY = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.62, vUv.y);
            // valleys dissolve into the night; only the silky crests read
            float crest = 0.22 + 0.78 * smoothstep(-0.5, 1.0, vH);
            float alpha = fadeX * fadeY * crest * 0.9;

            // per-pixel dither — no gradient banding, adds fabric micro-grain
            col += (hash(gl_FragCoord.xy * 0.7) - 0.5) * 0.014;

            gl_FragColor = vec4(col, alpha);
          }
        `,
      }),
    [],
  );

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position={[SILK_POS.x, SILK_POS.y, SILK_POS.z]}
      material={material}
    >
      <planeGeometry args={[46, 17, 220, 70]} />
    </mesh>
  );
}

/* hand-rolled star field: per-star size/brightness/hue with a soft gaussian
   core and gentle twinkle — alpha-preserving blending so the transparent
   canvas never occludes the CSS sky */
const STAR_COUNT = 170;

function StarField() {
  const geometry = useMemo(() => {
    const rand = mulberry32(42);
    const positions = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);
    const phases = new Float32Array(STAR_COUNT);
    const tints = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) {
      positions[i * 3] = (rand() * 2 - 1) * 24;
      positions[i * 3 + 1] = -3 + rand() * 16;
      positions[i * 3 + 2] = -6 - rand() * 9;
      const big = rand() > 0.88;
      sizes[i] = big ? 1.6 + rand() * 1.2 : 0.5 + rand() * 0.9;
      phases[i] = rand() * Math.PI * 2;
      tints[i] = rand();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geo.setAttribute("aTint", new THREE.BufferAttribute(tints, 1));
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneFactor,
        blendSrcAlpha: THREE.ZeroFactor,
        blendDstAlpha: THREE.OneFactor,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
        },
        vertexShader: /* glsl */ `
          uniform float uPixelRatio;
          attribute float aSize;
          attribute float aPhase;
          attribute float aTint;
          varying float vPhase;
          varying float vTint;
          void main() {
            vPhase = aPhase;
            vTint = aTint;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * uPixelRatio * (160.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          varying float vPhase;
          varying float vTint;
          void main() {
            vec2 d = gl_PointCoord - 0.5;
            float r2 = dot(d, d);
            // soft gaussian core with a faint wider halo
            float core = exp(-r2 * 42.0);
            float halo = exp(-r2 * 9.0) * 0.25;
            float twinkle = 0.7 + 0.3 * sin(uTime * (0.5 + vTint * 0.9) + vPhase);
            vec3 tint = mix(vec3(0.85, 0.9, 1.0), vec3(0.72, 0.76, 1.0), vTint);
            vec3 col = tint * (core + halo) * twinkle * 0.85;
            gl_FragColor = vec4(col, 1.0);
          }
        `,
      }),
    [],
  );

  const gl = useThree((s) => s.gl);
  useEffect(() => {
    material.uniforms.uPixelRatio.value = gl.getPixelRatio();
  }, [gl, material]);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <points
      geometry={geometry}
      material={material}
      frustumCulled={false}
    />
  );
}

/* luminous threads flowing across the lower third, like the poster */
const THREAD_COLORS = [
  "#2dd4bf",
  "#38bdf8",
  "#5f8bff",
  "#818cf8",
  "#a78bfa",
  "#67e8f9",
];
const THREAD_SEG = 130;

function FlowLines() {
  const lines = useMemo(() => {
    const rand = mulberry32(7);
    return Array.from({ length: 10 }, (_, i) => {
      const positions = new Float32Array(THREAD_SEG * 3);
      const colors = new Float32Array(THREAD_SEG * 3);
      // fade the thread out toward both ends so it dissolves with the silk
      for (let s = 0; s < THREAD_SEG; s++) {
        const x = -19 + (38 * s) / (THREAD_SEG - 1);
        const env =
          THREE.MathUtils.smoothstep(x, -19, -12) *
          (1 - THREE.MathUtils.smoothstep(x, 12, 19));
        colors[s * 3] = colors[s * 3 + 1] = colors[s * 3 + 2] = env;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const material = new THREE.LineBasicMaterial({
        color: THREAD_COLORS[i % THREAD_COLORS.length],
        vertexColors: true,
        transparent: true,
        opacity: 0.2 + rand() * 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      return {
        obj: new THREE.Line(geometry, material),
        // each thread rides one contour row of the silk, near → far
        yRow: -5 + i * 1.25 + rand() * 0.7,
        lift: 0.05 + rand() * 0.1,
      };
    });
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (const l of lines) {
      const pos = l.obj.geometry.attributes.position as THREE.BufferAttribute;
      for (let s = 0; s < THREAD_SEG; s++) {
        const x = -19 + (38 * s) / (THREAD_SEG - 1);
        const h = silkWaveH(x, l.yRow, t);
        pos.setXYZ(
          s,
          SILK_POS.x + x,
          SILK_POS.y + h + l.lift,
          SILK_POS.z - l.yRow,
        );
      }
      pos.needsUpdate = true;
    }
  });

  return (
    <group>
      {lines.map((l, i) => (
        <primitive key={i} object={l.obj} />
      ))}
    </group>
  );
}

/* soft radial glow behind the mark — computed in the fragment shader, so it
   is perfectly smooth at any resolution (no texture upscaling, no banding) */
function GlowDisc() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        // add RGB but leave the canvas alpha untouched — on a transparent
        // canvas, writing alpha would occlude the CSS sky behind the quad
        blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneFactor,
        blendSrcAlpha: THREE.ZeroFactor,
        blendDstAlpha: THREE.OneFactor,
        fog: false,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          varying vec2 vUv;
          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
          }
          void main() {
            vec2 d = vUv - 0.5;
            float r = length(d) * 2.0;
            // gaussian falloff, forced to exactly 0 before the quad edge
            float g = exp(-r * r * 5.0) * smoothstep(1.0, 0.7, r);
            vec3 col = mix(vec3(0.27, 0.37, 0.78), vec3(0.5, 0.6, 1.0), g);
            vec3 outCol = col * g * 0.55;
            // dither scaled by the glow itself — fades out before the quad edge
            outCol += (hash(gl_FragCoord.xy) - 0.5) * 0.02 * g;
            gl_FragColor = vec4(max(outCol, 0.0), 1.0);
          }
        `,
      }),
    [],
  );
  return (
    <mesh position={[0.3, 0.7, -5.5]} material={material}>
      <planeGeometry args={[11, 11]} />
    </mesh>
  );
}

export default function BayScene({ snap = false }: { snap?: boolean }) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 2.4, 14.5], fov: 40 }}
      gl={{ antialias: true }}
      onCreated={({ camera }) => camera.lookAt(0, 0.05, 0)}
    >
      {/* transparent canvas — the CSS gradient behind provides the sky */}
      <fog attach="fog" args={["#141f3b", 16, 34]} />

      <ambientLight intensity={0.3} />
      <spotLight
        position={[0, 14, 3]}
        angle={0.7}
        penumbra={1}
        intensity={2}
        color="#e8eeff"
      />
      <spotLight
        position={[8, 12, 10]}
        angle={0.5}
        penumbra={1}
        intensity={1.6}
        color="#dbe6ff"
      />
      <pointLight position={[0, 2, -6]} intensity={55} color="#2f6bff" />
      <pointLight position={[-13, -3, 8]} intensity={3} color="#134dd8" />

      <GlowDisc />
      <ShatteredLogo timeOffset={snap ? 8 : 0} />
      <SilkWave />
      <FlowLines />

      {/* studio-style env for the reflective floor */}
      <Environment resolution={256}>
        <Lightformer
          form="rect"
          intensity={4}
          position={[0, 6, -9]}
          scale={[16, 3, 1]}
          color="#ffffff"
        />
        <Lightformer
          form="rect"
          intensity={1.7}
          position={[0, 9, 0]}
          rotation-x={Math.PI / 2}
          scale={[14, 14, 1]}
          color="#dbe6ff"
        />
        <Lightformer
          form="rect"
          intensity={2.5}
          position={[-8, 2, 6]}
          rotation-y={Math.PI / 2.6}
          scale={[6, 2, 1]}
          color="#9db9ff"
        />
        <Lightformer
          form="rect"
          intensity={2.5}
          position={[8, -1, 6]}
          rotation-y={-Math.PI / 2.6}
          scale={[6, 2, 1]}
          color="#2f6bff"
        />
      </Environment>

      {/* No postprocessing: on a transparent canvas, bloom/vignette bleed into
          the alpha channel and leak dark haze around bright edges. The glow is
          built into the mark, the GlowDisc and the star halos instead. */}
    </Canvas>
  );
}

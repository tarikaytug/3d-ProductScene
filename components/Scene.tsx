"use client";

import { Suspense, useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  ContactShadows,
  OrbitControls,
  RoundedBox,
  Center,
} from "@react-three/drei";
import * as THREE from "three";
import { useConfiguratorStore } from "@/store/useConfiguratorStore";

/* ——————————————————————————————————————————————
   Constants
   —————————————————————————————————————————————— */

const UNIT = 0.36;
const KEY_GAP = 0.04;
const KEY_H = 0.13;
const BODY_H = 0.35;
const LERP = 0.045;

/* ——————————————————————————————————————————————
   Key Layout Generator (65% Mechanical KB)
   —————————————————————————————————————————————— */

interface KeyData {
  x: number;
  z: number;
  w: number;
  d: number;
}

function generateKeys(): KeyData[] {
  const rows: number[][] = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
    [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
    [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25],
    [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.75],
    [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25],
  ];

  const TOTAL_W = 15;
  const keys: KeyData[] = [];

  rows.forEach((row, ri) => {
    let cursor = 0;
    row.forEach((kw) => {
      const w = kw * UNIT - KEY_GAP;
      const d = UNIT - KEY_GAP;
      const x = (cursor + kw / 2) * UNIT - (TOTAL_W * UNIT) / 2;
      const z = (ri - (rows.length - 1) / 2) * UNIT;
      keys.push({ x, z, w, d });
      cursor += kw;
    });
  });

  return keys;
}

/* ——————————————————————————————————————————————
   Keyboard Model
   —————————————————————————————————————————————— */

function KeyboardModel() {
  const bodyColor = useConfiguratorStore((s) => s.bodyColor);
  const keycapColor = useConfiguratorStore((s) => s.keycapColor);
  const switchColor = useConfiguratorStore((s) => s.switchColor);

  /* — Refs for materials (body & accent use JSX-declared materials) — */
  const bodyMatRef = useRef<THREE.MeshPhysicalMaterial>(null!);
  const accentMatRef = useRef<THREE.MeshPhysicalMaterial>(null!);
  const keycapMatRef = useRef<THREE.MeshPhysicalMaterial>(null!);

  /* — Lerp targets — */
  const tBody = useRef(new THREE.Color(bodyColor));
  const tKeycap = useRef(new THREE.Color(keycapColor));
  const tAccent = useRef(new THREE.Color(switchColor));

  useEffect(() => {
    tBody.current.set(bodyColor);
  }, [bodyColor]);
  useEffect(() => {
    tKeycap.current.set(keycapColor);
  }, [keycapColor]);
  useEffect(() => {
    tAccent.current.set(switchColor);
  }, [switchColor]);

  /* — Key positions (memoized) — */
  const keys = useMemo(generateKeys, []);
  const bodyW = 15 * UNIT + 0.3;
  const bodyD = 5 * UNIT + 0.25;

  /* — Animation loop — */
  useFrame((state) => {
    if (bodyMatRef.current) {
      bodyMatRef.current.color.lerp(tBody.current, LERP);
    }
    if (keycapMatRef.current) {
      keycapMatRef.current.color.lerp(tKeycap.current, LERP);
    }
    if (accentMatRef.current) {
      accentMatRef.current.color.lerp(tAccent.current, LERP);
      accentMatRef.current.emissive.lerp(tAccent.current, LERP);
      accentMatRef.current.emissiveIntensity =
        0.3 + Math.sin(state.clock.elapsedTime * 1.5) * 0.15;
    }
  });

  return (
    <group rotation={[0.12, 0, 0]}>
      {/* ——— Body ——— */}
      <RoundedBox args={[bodyW, BODY_H, bodyD]} radius={0.08} smoothness={4}>
        <meshPhysicalMaterial
          ref={bodyMatRef}
          color={bodyColor}
          roughness={0.25}
          metalness={0.3}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </RoundedBox>

      {/* ——— Inner Plate ——— */}
      <mesh position={[0, BODY_H / 2 + 0.005, 0]}>
        <boxGeometry args={[bodyW - 0.16, 0.01, bodyD - 0.16]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* ——— Accent LED Strip (back edge) ——— */}
      <RoundedBox
        args={[bodyW - 0.2, 0.035, 0.05]}
        position={[0, BODY_H / 2, -bodyD / 2 + 0.04]}
        radius={0.015}
      >
        <meshPhysicalMaterial
          ref={accentMatRef}
          color={switchColor}
          emissive={switchColor}
          emissiveIntensity={0.4}
          roughness={0.2}
          metalness={0.8}
        />
      </RoundedBox>

      {/* ——— Keycaps (shared material via first key ref) ——— */}
      {keys.map((k, i) => (
        <mesh
          key={i}
          position={[k.x, BODY_H / 2 + KEY_H / 2 + 0.015, k.z]}
          castShadow
        >
          <boxGeometry args={[k.w, KEY_H, k.d]} />
          <meshPhysicalMaterial
            ref={i === 0 ? keycapMatRef : undefined}
            color={keycapColor}
            roughness={0.55}
            metalness={0.05}
            clearcoat={0.4}
            clearcoatRoughness={0.25}
          />
        </mesh>
      ))}

      {/* ——— USB-C Port ——— */}
      <mesh
        position={[0, 0, -bodyD / 2 - 0.02]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.04, 0.04, 0.06, 16]} />
        <meshStandardMaterial color="#333" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

/* ——————————————————————————————————————————————
   Lights
   —————————————————————————————————————————————— */

function Lights() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <spotLight
        position={[8, 10, 5]}
        intensity={80}
        angle={0.25}
        penumbra={1}
        castShadow
        shadow-mapSize={1024}
      />
      <spotLight
        position={[-6, 8, -4]}
        intensity={40}
        angle={0.3}
        penumbra={1}
        color="#a78bfa"
      />
      <pointLight position={[0, 5, -8]} intensity={20} color="#06b6d4" />
    </>
  );
}

/* ——————————————————————————————————————————————
   Scene (exported – dynamically imported)
   —————————————————————————————————————————————— */

export default function Scene() {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas
        camera={{ position: [4, 3, 4], fov: 35 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
      >
        {/* Background & Fog */}
        <color attach="background" args={["#09090b"]} />
        <fog attach="fog" args={["#09090b", 10, 22]} />

        <Lights />

        {/* Suspense handles async loading (Environment HDR) */}
        <Suspense fallback={null}>
          <Environment preset="city" environmentIntensity={0.3} />
        </Suspense>

        {/* Keyboard */}
        <Center>
          <KeyboardModel />
        </Center>

        {/* Ground shadow */}
        <ContactShadows
          position={[0, -0.55, 0]}
          opacity={0.35}
          scale={12}
          blur={2.5}
          far={4}
        />

        {/* Orbit Controls — auto-rotate + damping */}
        <OrbitControls
          autoRotate
          autoRotateSpeed={0.4}
          enablePan={false}
          enableZoom={false}
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={Math.PI / 5}
        />
      </Canvas>
    </div>
  );
}

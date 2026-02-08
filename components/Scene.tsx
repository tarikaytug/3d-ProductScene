"use client";

import { Suspense, useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  ContactShadows,
  OrbitControls,
  RoundedBox,
  Center,
  Sparkles,
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

/** Sculpted key profile — row-based Y offsets (like SA/Cherry profiles) */
const ROW_Y = [0.018, 0.008, 0, 0.004, 0.01];

/* ——————————————————————————————————————————————
   Key Layout Generator (65 % Mechanical Keyboard)
   —————————————————————————————————————————————— */

interface KeyData {
  x: number;
  z: number;
  w: number;
  d: number;
  row: number;
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
      keys.push({ x, z, w, d, row: ri });
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
  const activeCategory = useConfiguratorStore((s) => s.activeCategory);

  const groupRef = useRef<THREE.Group>(null!);

  /* — Material refs (body & accent are JSX-declared) — */
  const bodyMatRef = useRef<THREE.MeshPhysicalMaterial>(null!);
  const accentMatRef = useRef<THREE.MeshPhysicalMaterial>(null!);

  /* — Shared keycap material (one instance, ≈60 meshes) — */
  const keycapMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(keycapColor),
        roughness: 0.55,
        metalness: 0.05,
        clearcoat: 0.4,
        clearcoatRoughness: 0.25,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

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

  /* — Category-based rotation targets — */
  const tRotation = useRef({ x: 0.12, y: 0, z: 0 });

  useEffect(() => {
    switch (activeCategory) {
      case "body":
        tRotation.current = { x: 0.15, y: 0, z: 0 };
        break;
      case "keycaps":
        tRotation.current = { x: 0.55, y: 0, z: 0 };
        break;
      case "switches":
        tRotation.current = { x: 0.08, y: 0.35, z: 0 };
        break;
    }
  }, [activeCategory]);

  /* — Entry scale animation — */
  const targetScale = useRef(new THREE.Vector3(0.01, 0.01, 0.01));

  useEffect(() => {
    const t = setTimeout(() => targetScale.current.set(1, 1, 1), 200);
    return () => clearTimeout(t);
  }, []);

  /* — Color-change pulse — */
  useEffect(() => {
    targetScale.current.set(1.015, 1.015, 1.015);
    const t = setTimeout(() => targetScale.current.set(1, 1, 1), 150);
    return () => clearTimeout(t);
  }, [bodyColor, keycapColor, switchColor]);

  /* — Key positions (memoized) — */
  const keys = useMemo(generateKeys, []);
  const bodyW = 15 * UNIT + 0.3;
  const bodyD = 5 * UNIT + 0.25;

  /* ——— Animation loop ——— */
  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;

    // Smooth scale (entry + pulse)
    g.scale.lerp(targetScale.current, 0.06);

    // Smooth rotation based on active category
    g.rotation.x = THREE.MathUtils.lerp(
      g.rotation.x,
      tRotation.current.x,
      0.025
    );
    g.rotation.y = THREE.MathUtils.lerp(
      g.rotation.y,
      tRotation.current.y,
      0.025
    );

    // Material color lerps
    if (bodyMatRef.current) {
      bodyMatRef.current.color.lerp(tBody.current, LERP);
    }
    keycapMat.color.lerp(tKeycap.current, LERP);

    if (accentMatRef.current) {
      accentMatRef.current.color.lerp(tAccent.current, LERP);
      accentMatRef.current.emissive.lerp(tAccent.current, LERP);
      accentMatRef.current.emissiveIntensity =
        0.3 + Math.sin(state.clock.elapsedTime * 1.5) * 0.15;
    }
  });

  return (
    <group ref={groupRef} scale={0.01}>
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

      {/* ——— Keycaps (shared material for synchronized lerp) ——— */}
      {keys.map((k, i) => (
        <mesh
          key={i}
          position={[
            k.x,
            BODY_H / 2 + KEY_H / 2 + 0.015 + (ROW_Y[k.row] ?? 0),
            k.z,
          ]}
          material={keycapMat}
          castShadow
        >
          <boxGeometry args={[k.w, KEY_H, k.d]} />
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

      {/* ——— Rubber feet (4 corners) ——— */}
      {[
        [-bodyW / 2 + 0.2, -BODY_H / 2, -bodyD / 2 + 0.15],
        [bodyW / 2 - 0.2, -BODY_H / 2, -bodyD / 2 + 0.15],
        [-bodyW / 2 + 0.2, -BODY_H / 2, bodyD / 2 - 0.15],
        [bodyW / 2 - 0.2, -BODY_H / 2, bodyD / 2 - 0.15],
      ].map((pos, i) => (
        <mesh key={`foot-${i}`} position={pos as [number, number, number]}>
          <cylinderGeometry args={[0.06, 0.07, 0.03, 16]} />
          <meshStandardMaterial color="#222" roughness={0.9} />
        </mesh>
      ))}
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

      {/* Key light (warm) */}
      <spotLight
        position={[8, 10, 5]}
        intensity={80}
        angle={0.25}
        penumbra={1}
        castShadow
        shadow-mapSize={1024}
      />

      {/* Fill light (purple tint) */}
      <spotLight
        position={[-6, 8, -4]}
        intensity={40}
        angle={0.3}
        penumbra={1}
        color="#a78bfa"
      />

      {/* Rim light (cyan) */}
      <pointLight position={[0, 5, -8]} intensity={20} color="#06b6d4" />

      {/* Under-glow bounce light */}
      <pointLight position={[0, -3, 0]} intensity={5} color="#a78bfa" />
    </>
  );
}

/* ——————————————————————————————————————————————
   Scene (exported – dynamically imported by page)
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

        {/* Atmospheric particles */}
        <Sparkles
          count={50}
          scale={10}
          size={1.2}
          speed={0.2}
          opacity={0.08}
          color="#a78bfa"
        />

        {/* Environment map for realistic reflections */}
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

"use client";

import { Suspense, useRef, useMemo, useEffect, useCallback } from "react";
import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber";
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
import { soundEngine } from "@/lib/soundEngine";

/* ——————————————————————————————————————————————
   Constants
   —————————————————————————————————————————————— */

const UNIT = 0.36;
const KEY_GAP = 0.04;
const KEY_H = 0.13;
const BODY_H = 0.35;
const LERP = 0.045;
const KEY_PRESS_DEPTH = -0.045;
const KEY_PRESS_LERP = 0.28;

const ROW_Y = [0.018, 0.008, 0, 0.004, 0.01];

/* ——————————————————————————————————————————————
   Physical keyboard → key index mapping
   —————————————————————————————————————————————— */

const KEY_MAP: Record<string, number> = {
  // Row 0 — Number row (14 keys)
  Backquote: 0, Digit1: 1, Digit2: 2, Digit3: 3, Digit4: 4,
  Digit5: 5, Digit6: 6, Digit7: 7, Digit8: 8, Digit9: 9,
  Digit0: 10, Minus: 11, Equal: 12, Backspace: 13,
  // Row 1 — QWERTY (14 keys)
  Tab: 14, KeyQ: 15, KeyW: 16, KeyE: 17, KeyR: 18,
  KeyT: 19, KeyY: 20, KeyU: 21, KeyI: 22, KeyO: 23,
  KeyP: 24, BracketLeft: 25, BracketRight: 26, Backslash: 27,
  // Row 2 — Home row (13 keys)
  CapsLock: 28, KeyA: 29, KeyS: 30, KeyD: 31, KeyF: 32,
  KeyG: 33, KeyH: 34, KeyJ: 35, KeyK: 36, KeyL: 37,
  Semicolon: 38, Quote: 39, Enter: 40,
  // Row 3 — Bottom row (12 keys)
  ShiftLeft: 41, KeyZ: 42, KeyX: 43, KeyC: 44, KeyV: 45,
  KeyB: 46, KeyN: 47, KeyM: 48, Comma: 49, Period: 50,
  Slash: 51, ShiftRight: 52,
  // Row 4 — Space row (7 keys)
  ControlLeft: 53, MetaLeft: 54, AltLeft: 55, Space: 56,
  AltRight: 57, ContextMenu: 58, ControlRight: 59,
};

/* ——————————————————————————————————————————————
   Key Layout Generator (65 % Mechanical KB)
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
      keys.push({
        x: (cursor + kw / 2) * UNIT - (TOTAL_W * UNIT) / 2,
        z: (ri - (rows.length - 1) / 2) * UNIT,
        w: kw * UNIT - KEY_GAP,
        d: UNIT - KEY_GAP,
        row: ri,
      });
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
  const switchId = useConfiguratorStore((s) => s.selectedOptions.switches);
  const isSoundOn = useConfiguratorStore((s) => s.soundEnabled);

  const groupRef = useRef<THREE.Group>(null!);
  const keysGroupRef = useRef<THREE.Group>(null!);

  /* — Material refs — */
  const bodyMatRef = useRef<THREE.MeshPhysicalMaterial>(null!);
  const accentMatRef = useRef<THREE.MeshPhysicalMaterial>(null!);

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

  useEffect(() => { tBody.current.set(bodyColor); }, [bodyColor]);
  useEffect(() => { tKeycap.current.set(keycapColor); }, [keycapColor]);
  useEffect(() => { tAccent.current.set(switchColor); }, [switchColor]);

  /* — Rotation targets — */
  const tRotation = useRef({ x: 0.15, y: 0 });

  useEffect(() => {
    switch (activeCategory) {
      case "body":    tRotation.current = { x: 0.15, y: 0 }; break;
      case "keycaps": tRotation.current = { x: 0.55, y: 0 }; break;
      case "switches": tRotation.current = { x: 0.08, y: 0.35 }; break;
    }
  }, [activeCategory]);

  /* — Entry + pulse scale — */
  const targetScale = useRef(new THREE.Vector3(0.01, 0.01, 0.01));

  useEffect(() => {
    const t = setTimeout(() => targetScale.current.set(1, 1, 1), 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    targetScale.current.set(1.015, 1.015, 1.015);
    const t = setTimeout(() => targetScale.current.set(1, 1, 1), 150);
    return () => clearTimeout(t);
  }, [bodyColor, keycapColor, switchColor]);

  /* — Keys — */
  const keys = useMemo(generateKeys, []);
  const bodyW = 15 * UNIT + 0.3;
  const bodyD = 5 * UNIT + 0.25;

  /* ═══════════════════════════════════════════
     Key press tracking
     ═══════════════════════════════════════════ */

  const pressedKeys = useRef(new Set<number>());
  const keyOffsets = useRef(new Float32Array(keys.length));

  // Base Y for each key (precomputed)
  const baseY = useMemo(
    () => keys.map((k) => BODY_H / 2 + KEY_H / 2 + 0.015 + (ROW_Y[k.row] ?? 0)),
    [keys]
  );

  // Physical keyboard events
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const idx = KEY_MAP[e.code];
      if (idx === undefined) return;
      if (!e.repeat) {
        pressedKeys.current.add(idx);
        if (isSoundOn) soundEngine.playDown(switchId);
      }
    };
    const up = (e: KeyboardEvent) => {
      const idx = KEY_MAP[e.code];
      if (idx === undefined) return;
      pressedKeys.current.delete(idx);
      if (isSoundOn) soundEngine.playUp(switchId);
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [switchId, isSoundOn]);

  // 3D click on keycap
  const handleKeyPointerDown = useCallback(
    (i: number, e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      pressedKeys.current.add(i);
      if (isSoundOn) soundEngine.playDown(switchId);
    },
    [switchId, isSoundOn]
  );

  const handleKeyPointerUp = useCallback(
    (i: number) => {
      pressedKeys.current.delete(i);
      if (isSoundOn) soundEngine.playUp(switchId);
    },
    [switchId, isSoundOn]
  );

  /* ═══════════════════════════════════════════
     Animation loop
     ═══════════════════════════════════════════ */

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;

    // Scale (entry + pulse)
    g.scale.lerp(targetScale.current, 0.06);

    // Rotation (category-based)
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, tRotation.current.x, 0.025);
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, tRotation.current.y, 0.025);

    // Color lerps
    bodyMatRef.current?.color.lerp(tBody.current, LERP);
    keycapMat.color.lerp(tKeycap.current, LERP);

    if (accentMatRef.current) {
      accentMatRef.current.color.lerp(tAccent.current, LERP);
      accentMatRef.current.emissive.lerp(tAccent.current, LERP);
      accentMatRef.current.emissiveIntensity =
        0.3 + Math.sin(state.clock.elapsedTime * 1.5) * 0.15;
    }

    // Key press Y offsets (smooth spring)
    if (keysGroupRef.current) {
      const children = keysGroupRef.current.children;
      for (let i = 0; i < children.length; i++) {
        const target = pressedKeys.current.has(i) ? KEY_PRESS_DEPTH : 0;
        keyOffsets.current[i] = THREE.MathUtils.lerp(
          keyOffsets.current[i],
          target,
          KEY_PRESS_LERP
        );
        children[i].position.y = baseY[i] + keyOffsets.current[i];
      }
    }
  });

  /* ═══════════════════════════════════════════
     JSX
     ═══════════════════════════════════════════ */

  return (
    <group ref={groupRef} scale={0.01}>
      {/* Body */}
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

      {/* Inner Plate */}
      <mesh position={[0, BODY_H / 2 + 0.005, 0]}>
        <boxGeometry args={[bodyW - 0.16, 0.01, bodyD - 0.16]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Accent LED Strip */}
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

      {/* Keycaps */}
      <group ref={keysGroupRef}>
        {keys.map((k, i) => (
          <mesh
            key={i}
            position={[k.x, baseY[i], k.z]}
            material={keycapMat}
            castShadow
            onPointerDown={(e) => handleKeyPointerDown(i, e)}
            onPointerUp={() => handleKeyPointerUp(i)}
            onPointerLeave={() => {
              pressedKeys.current.delete(i);
            }}
          >
            <boxGeometry args={[k.w, KEY_H, k.d]} />
          </mesh>
        ))}
      </group>

      {/* USB-C Port */}
      <mesh
        position={[0, 0, -bodyD / 2 - 0.02]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.04, 0.04, 0.06, 16]} />
        <meshStandardMaterial color="#333" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Rubber Feet */}
      {[
        [-bodyW / 2 + 0.2, -BODY_H / 2, -bodyD / 2 + 0.15],
        [bodyW / 2 - 0.2, -BODY_H / 2, -bodyD / 2 + 0.15],
        [-bodyW / 2 + 0.2, -BODY_H / 2, bodyD / 2 - 0.15],
        [bodyW / 2 - 0.2, -BODY_H / 2, bodyD / 2 - 0.15],
      ].map((pos, i) => (
        <mesh key={`ft-${i}`} position={pos as [number, number, number]}>
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
      <spotLight position={[8, 10, 5]} intensity={80} angle={0.25} penumbra={1} castShadow shadow-mapSize={1024} />
      <spotLight position={[-6, 8, -4]} intensity={40} angle={0.3} penumbra={1} color="#a78bfa" />
      <pointLight position={[0, 5, -8]} intensity={20} color="#06b6d4" />
      <pointLight position={[0, -3, 0]} intensity={5} color="#a78bfa" />
    </>
  );
}

/* ——————————————————————————————————————————————
   Scene Export
   —————————————————————————————————————————————— */

export default function Scene() {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas
        camera={{ position: [4, 3, 4], fov: 35 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#09090b"]} />
        <fog attach="fog" args={["#09090b", 10, 22]} />

        <Lights />

        <Sparkles count={50} scale={10} size={1.2} speed={0.2} opacity={0.08} color="#a78bfa" />

        <Suspense fallback={null}>
          <Environment preset="city" environmentIntensity={0.3} />
        </Suspense>

        <Center>
          <KeyboardModel />
        </Center>

        <ContactShadows position={[0, -0.55, 0]} opacity={0.35} scale={12} blur={2.5} far={4} />

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

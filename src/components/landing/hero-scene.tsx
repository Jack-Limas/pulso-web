"use client";

import { Float, Line, RoundedBox, Sparkles } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

const BLUE = "#1f4bff";
const RED = "#ff2e4d";
const YELLOW = "#ffd23f";

const PULSE: [number, number, number][] = [
  [-1.25, 0, 0],
  [-0.65, 0, 0],
  [-0.4, 0.6, 0],
  [0.05, -0.75, 0],
  [0.4, 0.35, 0],
  [0.6, 0, 0],
  [1.2, 0, 0],
];

/** The logo as a physical object that leans toward the pointer. */
function PulseBlock() {
  const group = useRef<Group>(null);

  useFrame(({ pointer }, delta) => {
    const block = group.current;
    if (!block) {
      return;
    }
    block.rotation.y += (pointer.x * 0.6 - block.rotation.y) * Math.min(1, delta * 3);
    block.rotation.x += (-pointer.y * 0.4 - block.rotation.x) * Math.min(1, delta * 3);
  });

  return (
    <group ref={group}>
      <RoundedBox args={[2.6, 2.6, 0.5]} radius={0.45} smoothness={6} position={[0.22, -0.22, -0.32]}>
        <meshStandardMaterial color={RED} roughness={0.35} metalness={0.15} />
      </RoundedBox>
      <RoundedBox args={[2.6, 2.6, 0.55]} radius={0.45} smoothness={6}>
        <meshStandardMaterial color={BLUE} roughness={0.25} metalness={0.25} />
      </RoundedBox>
      <Line points={PULSE} color="white" lineWidth={6} position={[0, 0, 0.3]} />
      <mesh position={[1.2, 0, 0.32]}>
        <sphereGeometry args={[0.14, 32, 32]} />
        <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

function Coin({ position, speed }: { position: [number, number, number]; speed: number }) {
  return (
    <Float speed={speed} rotationIntensity={2.2} floatIntensity={1.6}>
      <mesh position={position} rotation={[Math.PI / 2.4, 0, 0.4]}>
        <cylinderGeometry args={[0.32, 0.32, 0.08, 40]} />
        <meshStandardMaterial color={YELLOW} metalness={0.8} roughness={0.25} />
      </mesh>
    </Float>
  );
}

export default function HeroScene() {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 6.5], fov: 42 }} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} />
      <pointLight position={[-4, -2, 3]} intensity={40} color={RED} />
      <pointLight position={[4, 3, 2]} intensity={30} color="#7a3cff" />
      <Float speed={1.6} rotationIntensity={0.25} floatIntensity={0.8}>
        <PulseBlock />
      </Float>
      <Coin position={[-2.4, 1.4, -0.5]} speed={2.2} />
      <Coin position={[2.5, -1.3, 0.2]} speed={1.7} />
      <Coin position={[2.1, 1.8, -1.2]} speed={2.6} />
      <Coin position={[-2.1, -1.7, -0.8]} speed={1.9} />
      <Sparkles count={60} scale={[7, 5, 3]} size={2.4} speed={0.4} color={YELLOW} />
    </Canvas>
  );
}

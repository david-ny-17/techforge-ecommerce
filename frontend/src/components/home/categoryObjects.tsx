import { Edges } from "@react-three/drei"
import { MeshStandardMaterial } from "three"

import type { ObjectKind } from "@/components/home/showcase-data"

const MATERIALS = {
  dark: new MeshStandardMaterial({ color: "#16161d", metalness: 0.92, roughness: 0.28 }),
  silver: new MeshStandardMaterial({ color: "#b8b8c8", metalness: 1, roughness: 0.22 }),
  accent: new MeshStandardMaterial({
    color: "#5b19a0",
    emissive: "#8b2fe8",
    emissiveIntensity: 1.4,
    metalness: 0.4,
    roughness: 0.35,
  }),
  screen: new MeshStandardMaterial({
    color: "#0b0714",
    emissive: "#6d28d9",
    emissiveIntensity: 0.9,
    metalness: 0.2,
    roughness: 0.4,
  }),
}
type MaterialKey = keyof typeof MATERIALS

const EDGE_COLOR = "#a966ff"

type Vec3 = [number, number, number]

interface PartProps {
  position?: Vec3
  rotation?: Vec3
  scale?: Vec3
  mat?: MaterialKey
  edges?: boolean
}

function Box({
  size,
  mat = "dark",
  edges = true,
  ...transform
}: PartProps & { size: Vec3 }) {
  return (
    <mesh {...transform} material={MATERIALS[mat]}>
      <boxGeometry args={size} />
      {edges && <Edges color={EDGE_COLOR} threshold={15} />}
    </mesh>
  )
}

function Cylinder({
  radius,
  height,
  mat = "dark",
  edges = false,
  ...transform
}: PartProps & { radius: number; height: number }) {
  return (
    <mesh {...transform} material={MATERIALS[mat]}>
      <cylinderGeometry args={[radius, radius, height, 40]} />
      {edges && <Edges color={EDGE_COLOR} threshold={30} />}
    </mesh>
  )
}

function Ring({
  radius,
  tube = 0.025,
  arc = Math.PI * 2,
  mat = "accent",
  ...transform
}: PartProps & { radius: number; tube?: number; arc?: number }) {
  return (
    <mesh {...transform} material={MATERIALS[mat]}>
      <torusGeometry args={[radius, tube, 10, 56, arc]} />
    </mesh>
  )
}

function Ball({ radius, mat = "dark", ...transform }: PartProps & { radius: number }) {
  return (
    <mesh {...transform} material={MATERIALS[mat]}>
      <sphereGeometry args={[radius, 32, 24]} />
    </mesh>
  )
}

function Cpu() {
  return (
    <group scale={1.1}>
      <Box size={[1.5, 0.1, 1.5]} />
      <Box size={[1.02, 0.1, 1.02]} mat="silver" position={[0, 0.1, 0]} />
      <Box size={[0.5, 0.02, 0.5]} mat="accent" edges={false} position={[0, 0.16, 0]} />
      <Box size={[0.14, 0.02, 0.14]} mat="accent" edges={false} position={[-0.62, 0.06, -0.62]} />
    </group>
  )
}

function Motherboard() {
  return (
    <group scale={0.95}>
      <Box size={[1.8, 0.08, 1.8]} />
      <Box size={[0.55, 0.07, 0.55]} mat="silver" position={[-0.15, 0.075, 0.1]} />
      <Box size={[0.28, 0.02, 0.28]} mat="accent" edges={false} position={[-0.15, 0.12, 0.1]} />
      <Box size={[0.1, 0.07, 1.0]} mat="accent" edges={false} position={[0.5, 0.075, 0.1]} />
      <Box size={[0.1, 0.07, 1.0]} mat="accent" edges={false} position={[0.68, 0.075, 0.1]} />
      <Box size={[0.3, 0.22, 0.9]} mat="silver" position={[-0.72, 0.15, 0.1]} />
      <Box size={[1.0, 0.06, 0.1]} position={[-0.2, 0.07, -0.6]} />
      <Box size={[0.3, 0.1, 0.3]} mat="silver" position={[0.55, 0.09, -0.5]} />
    </group>
  )
}

function RamStick({ z }: { z: number }) {
  return (
    <group position={[0, 0, z]}>
      <Box size={[1.7, 0.56, 0.06]} />
      {[-0.55, -0.18, 0.19, 0.56].map((x) => (
        <Box
          key={x}
          size={[0.3, 0.26, 0.03]}
          mat="silver"
          edges={false}
          position={[x, -0.02, 0.045]}
        />
      ))}
      <Box size={[1.7, 0.1, 0.12]} mat="accent" edges={false} position={[0, 0.3, 0]} />
      <Box size={[1.5, 0.08, 0.035]} mat="silver" edges={false} position={[0, -0.3, 0]} />
    </group>
  )
}

function Ram() {
  return (
    <group>
      <RamStick z={-0.16} />
      <RamStick z={0.16} />
    </group>
  )
}

function Gpu() {
  return (
    <group scale={0.95}>
      <Box size={[1.8, 0.34, 0.7]} />
      {[-0.58, 0, 0.58].map((x) => (
        <group key={x} position={[x, 0.18, 0]}>
          <Cylinder radius={0.24} height={0.05} mat="silver" />
          <Ring radius={0.25} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} />
          <Cylinder radius={0.07} height={0.08} mat="accent" />
        </group>
      ))}
      <Box size={[0.06, 0.5, 0.7]} mat="silver" position={[-0.93, 0.05, 0]} />
      <Box size={[1.0, 0.06, 0.1]} mat="silver" edges={false} position={[0.3, -0.2, -0.3]} />
      <Box size={[1.7, 0.02, 0.1]} mat="accent" edges={false} position={[0, 0.17, 0.32]} />
    </group>
  )
}

function Storage() {
  return (
    <group scale={1.05}>
      <Box size={[1.8, 0.08, 0.52]} />
      <Box size={[1.1, 0.1, 0.44]} mat="silver" position={[-0.25, 0.09, 0]} />
      <Box size={[1.1, 0.03, 0.06]} mat="accent" edges={false} position={[-0.25, 0.155, 0]} />
      <Box size={[0.28, 0.05, 0.3]} mat="silver" edges={false} position={[0.55, 0.065, 0]} />
      <Box size={[0.12, 0.05, 0.3]} mat="accent" edges={false} position={[0.78, 0.065, 0]} />
      <Box size={[0.1, 0.07, 0.5]} mat="silver" edges={false} position={[-0.86, 0, 0]} />
    </group>
  )
}

function Psu() {
  return (
    <group>
      <Box size={[1.5, 0.85, 1.05]} />
      <Cylinder
        radius={0.36}
        height={0.04}
        mat="silver"
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 0.53]}
      />
      <Ring radius={0.37} tube={0.03} position={[0, 0, 0.55]} />
      <Cylinder
        radius={0.09}
        height={0.06}
        mat="accent"
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 0.56]}
      />
      <Box size={[0.9, 0.01, 0.4]} mat="accent" edges={false} position={[0, 0.43, 0]} />
    </group>
  )
}

function Case() {
  return (
    <group scale={0.9}>
      <Box size={[1.0, 1.7, 1.5]} />
      <Box size={[0.01, 1.4, 1.2]} mat="screen" edges={false} position={[0.505, 0, 0]} />
      <Box size={[0.012, 0.1, 0.9]} mat="accent" edges={false} position={[0.51, -0.25, 0]} />
      <Box size={[0.012, 0.35, 0.3]} mat="accent" edges={false} position={[0.51, 0.3, -0.2]} />
      {[-0.5, 0, 0.5].map((y) => (
        <Ring key={y} radius={0.2} tube={0.03} position={[0, y, 0.76]} />
      ))}
    </group>
  )
}

function Cooler() {
  return (
    <group scale={0.95}>
      <Box size={[1.0, 0.08, 0.9]} mat="silver" position={[0, -0.6, 0]} />
      {Array.from({ length: 11 }, (_, i) => (
        <Box
          key={i}
          size={[1.1, 0.035, 0.75]}
          mat="silver"
          edges={false}
          position={[0, -0.45 + i * 0.1, 0]}
        />
      ))}
      {[-0.32, 0.32].map((x) => (
        <Cylinder key={x} radius={0.04} height={1.2} mat="accent" position={[x, -0.05, 0]} />
      ))}
      <Box size={[1.15, 0.05, 0.8]} position={[0, 0.62, 0]} />
      <Cylinder
        radius={0.42}
        height={0.08}
        mat="dark"
        edges
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 0.47]}
      />
      <Ring radius={0.43} tube={0.03} position={[0, 0, 0.52]} />
      <Cylinder
        radius={0.1}
        height={0.1}
        mat="accent"
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 0.5]}
      />
    </group>
  )
}

function Monitor() {
  return (
    <group scale={0.88} position={[0, 0.2, 0]}>
      <Box size={[1.9, 1.1, 0.08]} />
      <Box size={[1.8, 1.0, 0.01]} mat="screen" edges={false} position={[0, 0, 0.045]} />
      <Box size={[0.9, 0.06, 0.005]} mat="accent" edges={false} position={[-0.4, 0.25, 0.052]} />
      <Box size={[0.5, 0.3, 0.005]} mat="accent" edges={false} position={[0.5, -0.1, 0.052]} />
      <Box size={[0.14, 0.4, 0.08]} mat="silver" position={[0, -0.7, -0.08]} />
      <Box size={[0.8, 0.04, 0.45]} mat="silver" position={[0, -0.92, 0]} />
    </group>
  )
}

function Keyboard() {
  const keys: { id: string; x: number; z: number; accent: boolean }[] = []
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 12; col++) {
      keys.push({
        id: `${row}-${col}`,
        x: -0.82 + col * 0.15,
        z: -0.27 + row * 0.14,
        accent: row === 1 && col >= 2 && col <= 4,
      })
    }
  }

  return (
    <group scale={0.95}>
      <Box size={[1.9, 0.1, 0.72]} />
      {keys.map((key) => (
        <Box
          key={key.id}
          size={[0.12, 0.05, 0.12]}
          mat={key.accent ? "accent" : "dark"}
          edges={!key.accent}
          position={[key.x, 0.075, key.z]}
        />
      ))}
      <Box size={[0.7, 0.05, 0.12]} position={[0, 0.075, 0.29]} />
    </group>
  )
}

function Mouse() {
  return (
    <group scale={1.25}>
      <Ball radius={1} scale={[0.5, 0.3, 0.85]} position={[0, 0.05, 0]} />
      <Ring radius={0.5} tube={0.02} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1.7, 1]} position={[0, 0.05, 0]} />
      <Cylinder
        radius={0.05}
        height={0.14}
        mat="accent"
        rotation={[0, 0, Math.PI / 2]}
        position={[0, 0.34, 0.3]}
      />
    </group>
  )
}

function Headset() {
  return (
    <group position={[0, -0.15, 0]}>
      <Ring radius={0.72} tube={0.05} arc={Math.PI} mat="silver" />
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.72, 0, 0]}>
          <Cylinder
            radius={0.34}
            height={0.26}
            edges
            rotation={[0, 0, Math.PI / 2]}
          />
          <Ring
            radius={0.28}
            tube={0.07}
            rotation={[0, Math.PI / 2, 0]}
            position={[-side * 0.16, 0, 0]}
          />
          <Cylinder
            radius={0.24}
            height={0.03}
            mat="accent"
            rotation={[0, 0, Math.PI / 2]}
            position={[side * 0.14, 0, 0]}
          />
        </group>
      ))}
    </group>
  )
}

function Microphone() {
  return (
    <group scale={0.88} position={[0, 0.3, 0]}>
      <mesh material={MATERIALS.dark}>
        <capsuleGeometry args={[0.28, 0.75, 8, 24]} />
      </mesh>
      {[0.25, 0, -0.25].map((y) => (
        <Ring key={y} radius={0.285} tube={0.02} rotation={[Math.PI / 2, 0, 0]} position={[0, y, 0]} />
      ))}
      <Cylinder radius={0.04} height={0.45} mat="silver" position={[0, -0.88, 0]} />
      <Cylinder radius={0.45} height={0.06} edges position={[0, -1.12, 0]} />
    </group>
  )
}

function Laptop() {
  return (
    <group position={[0, -0.3, 0]}>
      <Box size={[1.7, 0.08, 1.2]} />
      <Box size={[1.4, 0.01, 0.5]} mat="screen" edges={false} position={[0, 0.045, -0.1]} />
      <Box size={[0.5, 0.01, 0.28]} mat="silver" edges={false} position={[0, 0.045, 0.36]} />
      <group position={[0, 0.04, -0.58]} rotation={[-0.2, 0, 0]}>
        <Box size={[1.7, 1.1, 0.05]} position={[0, 0.55, 0]} />
        <Box size={[1.56, 0.96, 0.01]} mat="screen" edges={false} position={[0, 0.55, 0.03]} />
      </group>
    </group>
  )
}

function Accessory() {
  return (
    <group scale={1.1}>
      <Cylinder
        radius={0.5}
        height={0.3}
        edges
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0.25, 0]}
      />
      <Ring radius={0.34} tube={0.045} position={[0, 0.25, 0.16]} />
      <Ball radius={0.22} mat="screen" scale={[1, 1, 0.45]} position={[0, 0.25, 0.12]} />
      <Box size={[0.22, 0.3, 0.12]} mat="silver" position={[0, -0.1, -0.05]} />
      <Box size={[1.0, 0.06, 0.5]} mat="silver" position={[0, -0.28, -0.05]} />
    </group>
  )
}

export default function CategoryObject({ kind }: { kind: ObjectKind }) {
  switch (kind) {
    case "cpu":
      return <Cpu />
    case "motherboard":
      return <Motherboard />
    case "ram":
      return <Ram />
    case "gpu":
      return <Gpu />
    case "storage":
      return <Storage />
    case "psu":
      return <Psu />
    case "case":
      return <Case />
    case "cooler":
      return <Cooler />
    case "monitor":
      return <Monitor />
    case "keyboard":
      return <Keyboard />
    case "mouse":
      return <Mouse />
    case "headset":
      return <Headset />
    case "microphone":
      return <Microphone />
    case "laptop":
      return <Laptop />
    case "accessory":
      return <Accessory />
  }
}
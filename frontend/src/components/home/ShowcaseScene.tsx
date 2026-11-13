import { Environment, Lightformer } from "@react-three/drei"
import { Canvas, useFrame } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import type { RefObject } from "react"
import { AdditiveBlending, MathUtils } from "three"
import type { Group, MeshStandardMaterial } from "three"

import CategoryObject from "@/components/home/categoryObjects"
import { SHOWCASE_ITEMS } from "@/components/home/showcase-data"
import type { ShowcaseItem } from "@/components/home/showcase-data"

const COUNT = SHOWCASE_ITEMS.length
const SPACING = 2.15 
const VISIBLE_RANGE = 3.6 

interface CarouselItemProps {
  item: ShowcaseItem
  index: number
  progress: RefObject<number>
  onItemClick: (index: number) => void
}

function CarouselItem({ item, index, progress, onItemClick }: CarouselItemProps) {
  const outerRef = useRef<Group>(null)
  const spinRef = useRef<Group>(null)

  useFrame((state, delta) => {
    const outer = outerRef.current
    const spin = spinRef.current
    if (!outer || !spin) return

    // Distancia con signo al elemento central, dando la vuelta por el camino más corto
    let offset = (((index - progress.current) % COUNT) + COUNT) % COUNT
    if (offset > COUNT / 2) offset -= COUNT
    const distance = Math.abs(offset)

    outer.visible = distance < VISIBLE_RANGE
    if (!outer.visible) return

    const focus = 1 - Math.min(distance, 1) // 1 en el centro, 0 en los lados
    const bob = Math.sin(state.clock.elapsedTime * 1.3 + index) * 0.07 * focus

    outer.position.set(offset * SPACING, bob + focus * 0.1, -distance * 1.1)
    outer.rotation.y = -offset * 0.4
    outer.scale.setScalar(MathUtils.clamp(1 - distance * 0.2, 0.45, 1))
    spin.rotation.y += delta * (0.2 + focus * 0.5)
  })

  return (
    <group
      ref={outerRef}
      visible={false}
      onClick={(e) => {
        e.stopPropagation()
        onItemClick(index)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = "pointer"
      }}
      onPointerOut={() => {
        document.body.style.cursor = ""
      }}
    >
      <group rotation={[item.tilt, 0, 0]}>
        <group ref={spinRef}>
          <CategoryObject kind={item.kind} />
        </group>
      </group>
    </group>
  )
}

function Carousel({
  target,
  onItemClick,
}: {
  target: number
  onItemClick: (index: number) => void
}) {
  
  const progress = useRef(target)

  useFrame((_, delta) => {
    progress.current = MathUtils.damp(progress.current, target, 4.5, delta)
  })

  return (
    <>
      {SHOWCASE_ITEMS.map((item, index) => (
        <CarouselItem
          key={item.slug}
          item={item}
          index={index}
          progress={progress}
          onItemClick={onItemClick}
        />
      ))}
    </>
  )
}

function Podium() {
  const ringMaterial = useRef<MeshStandardMaterial>(null)

  useFrame((state) => {
    if (ringMaterial.current) {
      ringMaterial.current.emissiveIntensity = 1.8 + Math.sin(state.clock.elapsedTime * 2) * 0.6
    }
  })

  return (
    <group position={[0, -1.05, 0]}>
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[1.55, 1.7, 0.22, 64]} />
        <meshStandardMaterial color="#0d0d14" metalness={0.95} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.45, 0.025, 12, 96]} />
        <meshStandardMaterial
          ref={ringMaterial}
          color="#8b2fe8"
          emissive="#8b2fe8"
          emissiveIntensity={2}
        />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.45, 64]} />
        <meshBasicMaterial
          color="#8b2fe8"
          transparent
          opacity={0.18}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 3.2, 0]}>
        <cylinderGeometry args={[0.6, 1.45, 6.4, 48, 1, true]} />
        <meshBasicMaterial
          color="#8b2fe8"
          transparent
          opacity={0.07}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

function Rig() {
  useFrame((state, delta) => {
    const { camera, pointer, size } = state
    const targetZ = size.width / size.height < 1 ? 9.8 : 8.4
    camera.position.x = MathUtils.damp(camera.position.x, pointer.x * 0.6, 3, delta)
    camera.position.y = MathUtils.damp(camera.position.y, 0.6 + pointer.y * 0.25, 3, delta)
    camera.position.z = MathUtils.damp(camera.position.z, targetZ, 4, delta)
    camera.lookAt(0, -0.2, 0)
  })
  return null
}

interface ShowcaseSceneProps {
  target: number
  active: boolean 
  onItemClick: (index: number) => void
}

export default function ShowcaseScene({ target, active, onItemClick }: ShowcaseSceneProps) {
  
  useEffect(() => {
    return () => {
      document.body.style.cursor = ""
    }
  }, [])

  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0.6, 8.4], fov: 38 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <fog attach="fog" args={["#000000", 10, 19]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 6, 5]} intensity={1.6} />
      <pointLight position={[0, 0.2, 2.5]} color="#a966ff" intensity={25} distance={9} decay={2} />

      {/* Reflejos para el metal, generados con luces (sin descargar nada) */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#ffffff" position={[0, 5, 3]} scale={[10, 2, 1]} />
        <Lightformer
          form="rect"
          intensity={3}
          color="#8b2fe8"
          position={[-5, 1, 2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[8, 2, 1]}
        />
        <Lightformer
          form="rect"
          intensity={3}
          color="#a966ff"
          position={[5, 1, 2]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[8, 2, 1]}
        />
        <Lightformer form="ring" intensity={1.5} color="#ffffff" position={[0, 2, -6]} scale={6} />
      </Environment>

      <Rig />
      <Podium />
      <Carousel target={target} onItemClick={onItemClick} />
    </Canvas>
  )
}
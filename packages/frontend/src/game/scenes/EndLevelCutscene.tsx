import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { CutsceneEngine, type CutsceneStep } from "../systems/CutsceneEngine";
import { Rafa } from "../entities/Rafa";
import { HidingSpot } from "../entities/HidingSpot";
import { MelHouse } from "../entities/MelHouse";
import { getFrame, getFrameAspectRatio } from "../systems/SpriteAnimator";

// ---------------------------------------------------------------------------
// EndLevelCutscene -- Full end-of-level cutscene scene (F54-T06)
// ---------------------------------------------------------------------------
// Renders inside the R3F Canvas. Orchestrates the CutsceneEngine with the
// stage (bush, house, Rafa) and animated Mel sprite.
// ---------------------------------------------------------------------------

interface EndLevelCutsceneProps {
  onComplete: () => void;
  onSkip: () => void;
}

// Heart particle data
interface HeartParticle {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  opacity: number;
}

export function EndLevelCutscene({ onComplete, onSkip }: EndLevelCutsceneProps) {
  // Refs for animated values (no per-frame re-renders)
  const melXRef = useRef(13);
  const melYRef = useRef(0.7);
  const melZRef = useRef(0.1);
  const melScaleRef = useRef(1.4);
  const melOpacityRef = useRef(1);
  const melAnimRef = useRef("walk_slow");
  const melAnimElapsed = useRef(0);
  const capeVisibleRef = useRef(true);
  const capeFlutterRef = useRef(0);
  const showCapeOnBushRef = useRef(false);
  const doorOpenRef = useRef(false);
  const rafaStateRef = useRef<"idle" | "crouch" | "hug" | "happy">("idle");
  const showHugSpriteRef = useRef(false);
  const fadeOpacityRef = useRef(0);

  // State for React-rendered values that need re-render
  const [rafaState, setRafaState] = useState<"idle" | "crouch" | "hug" | "happy">("idle");
  const [doorOpen, setDoorOpen] = useState(false);
  const [showCapeOnBush, setShowCapeOnBush] = useState(false);
  const [hearts, setHearts] = useState<HeartParticle[]>([]);
  const [showSkipHint, setShowSkipHint] = useState(false);
  const [fadeOpacity, setFadeOpacity] = useState(0);

  // Sprite refs for direct mutation
  const melSpriteRef = useRef<THREE.Sprite>(null);
  const capeMeshRef = useRef<THREE.Mesh>(null);
  const hugSpriteRef = useRef<THREE.Sprite>(null);
  const fadeRef = useRef<THREE.Mesh>(null);

  // Heart ID counter
  const heartIdRef = useRef(0);

  // Jump on owner texture for hug moment
  const hugTexture = useMemo(() => {
    const tex = new THREE.TextureLoader().load("/sprites/mel/jump_on_owner.png");
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  // Cape material
  const capeMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: "#DC143C",
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    }),
    [],
  );

  // Ground material
  const groundMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#4a7a3a", roughness: 0.9 }),
    [],
  );

  // Build the cutscene engine
  const engineRef = useRef<CutsceneEngine | null>(null);
  const completedRef = useRef(false);

  const buildSteps = useCallback((): CutsceneStep[] => [
    {
      id: "entrance",
      duration: 1.5,
      onStart: () => {
        melXRef.current = 13;
        melAnimRef.current = "walk_slow";
        capeVisibleRef.current = true;
      },
      onUpdate: (progress) => {
        // Walk from x=13 to x~7.5
        melXRef.current = 13 - progress * 5.5;
      },
    },
    {
      id: "approach_bush",
      duration: 1.0,
      onUpdate: (progress) => {
        // Walk from x~7.5 to x=7 (bush center)
        melXRef.current = 7.5 - progress * 0.5;
      },
    },
    {
      id: "behind_bush",
      duration: 0.8,
      onStart: () => {
        capeVisibleRef.current = false;
        melZRef.current = -0.5; // Behind bush (z-occlusion)
        melAnimRef.current = "peek";
        melAnimElapsed.current = 0;
      },
      onUpdate: () => {
        // Mel stays behind bush, peek animation plays
      },
    },
    {
      id: "cape_drop",
      duration: 0.8,
      onUpdate: () => {
        // Cape "dropped" behind bush
      },
      onEnd: () => {
        showCapeOnBushRef.current = true;
        setShowCapeOnBush(true);
      },
    },
    {
      id: "emerge",
      duration: 0.8,
      onStart: () => {
        melZRef.current = 0.1; // Back in front
        melAnimRef.current = "walk_slow";
        melAnimElapsed.current = 0;
      },
      onUpdate: (progress) => {
        // Walk from x=7 to x=4
        melXRef.current = 7 - progress * 3;
      },
    },
    {
      id: "approach_door",
      duration: 1.2,
      onStart: () => {
        doorOpenRef.current = true;
        setDoorOpen(true);
        rafaStateRef.current = "crouch";
        setRafaState("crouch");
      },
      onUpdate: (progress) => {
        // Walk from x=4 to x=3.5
        melXRef.current = 4 - progress * 0.5;
      },
    },
    {
      id: "enter_house",
      duration: 0.8,
      onUpdate: (progress) => {
        // Walk through door, shrink and fade
        melXRef.current = 3.5 - progress * 1.0;
        melScaleRef.current = 1.4 * (1 - progress * 0.3);
        melOpacityRef.current = 1 - progress;
      },
      onEnd: () => {
        melOpacityRef.current = 0;
      },
    },
    {
      id: "hug",
      duration: 2.0,
      onStart: () => {
        showHugSpriteRef.current = true;
        rafaStateRef.current = "hug";
        setRafaState("hug");
        // Spawn heart particles
        const newHearts: HeartParticle[] = [];
        for (let i = 0; i < 4; i++) {
          heartIdRef.current++;
          newHearts.push({
            id: heartIdRef.current,
            x: 3.2 + (Math.random() - 0.5) * 0.8,
            y: 1.5,
            z: 0.3 + Math.random() * 0.3,
            vx: (Math.random() - 0.5) * 0.5,
            opacity: 1,
          });
        }
        setHearts(newHearts);
      },
      onUpdate: (progress) => {
        if (progress > 0.75) {
          rafaStateRef.current = "happy";
          setRafaState("happy");
        }
      },
      onEnd: () => {
        showHugSpriteRef.current = false;
      },
    },
    {
      id: "fade_out",
      duration: 1.5,
      onUpdate: (progress) => {
        fadeOpacityRef.current = progress;
        setFadeOpacity(progress);
      },
      onEnd: () => {
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete();
        }
      },
    },
  ], [onComplete]);

  // Initialize engine
  useEffect(() => {
    const engine = new CutsceneEngine(buildSteps());
    engineRef.current = engine;
    engine.start();

    // Show skip hint after 1s
    const hintTimer = setTimeout(() => setShowSkipHint(true), 1000);

    return () => {
      clearTimeout(hintTimer);
    };
  }, [buildSteps]);

  // Skip handling
  const skippedRef = useRef(false);
  useEffect(() => {
    let canSkip = false;
    const timer = setTimeout(() => { canSkip = true; }, 1000);

    const handleSkip = () => {
      if (canSkip && !skippedRef.current) {
        skippedRef.current = true;
        engineRef.current?.skip();
        onSkip();
      }
    };

    window.addEventListener("keydown", handleSkip);
    window.addEventListener("pointerdown", handleSkip);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleSkip);
      window.removeEventListener("pointerdown", handleSkip);
    };
  }, [onSkip]);

  // Main animation loop
  useFrame((_, delta) => {
    const engine = engineRef.current;
    if (!engine) return;

    engine.update(delta);

    // Update mel animation elapsed
    melAnimElapsed.current += delta;

    // Update cape flutter
    capeFlutterRef.current += delta;

    // Update Mel sprite position and texture
    if (melSpriteRef.current) {
      const texture = getFrame(melAnimRef.current, melAnimElapsed.current);
      const aspectRatio = getFrameAspectRatio(melAnimRef.current, melAnimElapsed.current);
      const mat = melSpriteRef.current.material as THREE.SpriteMaterial;
      mat.map = texture;
      mat.opacity = melOpacityRef.current;
      mat.needsUpdate = true;

      melSpriteRef.current.position.set(melXRef.current, melYRef.current, melZRef.current);
      // Mel walks left -> flip sprite (negative scale X)
      const scale = melScaleRef.current;
      melSpriteRef.current.scale.set(-scale * aspectRatio, scale, 1);
    }

    // Update cape
    if (capeMeshRef.current) {
      capeMeshRef.current.visible = capeVisibleRef.current;
      if (capeVisibleRef.current) {
        capeMeshRef.current.position.set(
          melXRef.current + 0.3,
          melYRef.current + 0.1,
          melZRef.current - 0.05,
        );
        capeMeshRef.current.rotation.z = Math.sin(capeFlutterRef.current * Math.PI * 2 * 3) * 0.05;
      }
    }

    // Update hug sprite
    if (hugSpriteRef.current) {
      hugSpriteRef.current.visible = showHugSpriteRef.current;
    }

    // Update heart particles
    setHearts(prev => {
      if (prev.length === 0) return prev;
      const updated = prev
        .map(h => ({
          ...h,
          y: h.y + delta * 1.5,
          x: h.x + h.vx * delta,
          opacity: h.opacity - delta * 0.6,
        }))
        .filter(h => h.opacity > 0);
      return updated;
    });

    // Update fade overlay
    if (fadeRef.current) {
      const mat = fadeRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = fadeOpacityRef.current;
    }
  });

  return (
    <>
      {/* Cutscene camera */}
      <PerspectiveCamera makeDefault position={[5, 3, 12]} fov={50} />

      {/* Warm lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.8}
        color="#FFFAF0"
        castShadow
      />

      {/* Ground */}
      <mesh receiveShadow position={[5, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 6]} />
        <primitive object={groundMat} attach="material" />
      </mesh>

      {/* House */}
      <MelHouse position={[3, 0, 0]} doorOpen={doorOpen} />

      {/* Hiding spot (bush) */}
      <HidingSpot position={[7, 0, 0]} showCape={showCapeOnBush} />

      {/* Rafa */}
      <Rafa position={[3.5, 0, 0.5]} state={rafaState} facingRight />

      {/* Mel sprite */}
      <sprite ref={melSpriteRef} position={[13, 0.7, 0.1]}>
        <spriteMaterial transparent depthTest={false} />
      </sprite>

      {/* Cape overlay */}
      <mesh ref={capeMeshRef} position={[13.3, 0.8, 0.05]}>
        <planeGeometry args={[0.4, 0.8]} />
        <primitive object={capeMat} attach="material" />
      </mesh>

      {/* Hug sprite (jump_on_owner) */}
      <sprite ref={hugSpriteRef} position={[3.2, 1.2, 0.5]} scale={[2, 2, 1]} visible={false}>
        <spriteMaterial map={hugTexture} transparent depthTest={false} />
      </sprite>

      {/* Heart particles */}
      {hearts.map(h => (
        <mesh key={h.id} position={[h.x, h.y, h.z]}>
          <boxGeometry args={[0.15, 0.15, 0.05]} />
          <meshStandardMaterial
            color="#FF6B6B"
            emissive="#FF6B6B"
            emissiveIntensity={0.3}
            transparent
            opacity={h.opacity}
          />
        </mesh>
      ))}

      {/* Full-screen fade-to-black overlay (rendered as a large plane in front of camera) */}
      <mesh ref={fadeRef} position={[5, 3, 11]} renderOrder={999}>
        <planeGeometry args={[30, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0} depthTest={false} />
      </mesh>

      {/* Skip hint rendered as a small text plane */}
      {showSkipHint && fadeOpacity < 0.5 && (
        <CutsceneSkipHint />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Skip hint -- HTML overlay rendered via drei Html would add complexity;
// instead we use a simple sprite with canvas-rendered text.
// ---------------------------------------------------------------------------

function CutsceneSkipHint() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, 512, 64);
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "24px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Pressione para pular", 256, 32);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  return (
    <sprite position={[5, 0.3, 10]} scale={[4, 0.5, 1]} renderOrder={1000}>
      <spriteMaterial map={texture} transparent depthTest={false} />
    </sprite>
  );
}

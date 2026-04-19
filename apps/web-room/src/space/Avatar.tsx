import React, { Suspense, useEffect, useMemo, useRef } from "react";
import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { getAvatarConfig, preloadAvatarModel } from "./avatar-config";

type RoomAvatarProps = {
  avatarId?: string | null;
  position: [number, number, number];
  yaw: number;
};

class AvatarErrorBoundary extends React.Component<
  {
    fallback: React.ReactNode;
    resetKey: string;
    children: React.ReactNode;
  },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: { resetKey: string }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function AvatarFallback({
  avatarId,
  position,
  yaw,
  loading = false,
}: RoomAvatarProps & { loading?: boolean }) {
  const config = getAvatarConfig(avatarId);
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current || !glowRef.current) return;

    const idle = Math.sin(clock.getElapsedTime() * 1.8);
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      position[1] + idle * 0.025,
      1 - Math.exp(-delta * 6),
    );

    const targetGlow = loading ? 1.8 : 0.9;
    glowRef.current.emissiveIntensity = THREE.MathUtils.lerp(
      glowRef.current.emissiveIntensity,
      targetGlow + idle * 0.18,
      1 - Math.exp(-delta * 5),
    );
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, yaw + config.rotationY, 0]}
      scale={1}
    >
      <mesh position={[0, 1.05, 0]} castShadow>
        <capsuleGeometry args={[0.24, 1.1, 8, 16]} />
        <meshStandardMaterial
          color={config.fallbackColor}
          roughness={0.45}
          metalness={0.08}
        />
      </mesh>
      <mesh position={[0, 2.0, 0]} castShadow>
        <sphereGeometry args={[0.24, 16, 16]} />
        <meshStandardMaterial color="#f5d5c0" roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.28, 0.22]}>
        <boxGeometry args={[0.34, 0.14, 0.03]} />
        <meshStandardMaterial
          ref={glowRef}
          color="#ffffff"
          emissive={config.fallbackColor}
          emissiveIntensity={loading ? 1.6 : 0.7}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <cylinderGeometry args={[0.34, 0.42, 0.14, 18]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
    </group>
  );
}

function LoadedAvatar({ avatarId, position, yaw }: RoomAvatarProps) {
  const config = getAvatarConfig(avatarId);
  const rootRef = useRef<THREE.Group>(null);
  const previousPositionRef = useRef(new THREE.Vector3(position[0], position[1], position[2]));
  const previousYawRef = useRef(yaw);
  const movementStateRef = useRef<"idle" | "forward" | "back" | "left" | "right">("idle");
  const activeActionRef = useRef<THREE.AnimationAction | null>(null);
  const { scene, animations } = useGLTF(config.url);
  const clonedScene = useMemo(() => cloneSkeleton(scene), [scene]);
  const modelOffset = useMemo(() => {
    clonedScene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(clonedScene);

    if (box.isEmpty()) {
      return new THREE.Vector3(0, 0, 0);
    }

    const center = new THREE.Vector3();
    box.getCenter(center);

    return new THREE.Vector3(-center.x, 0, -center.z);
  }, [clonedScene]);
  const { actions } = useAnimations(animations, clonedScene);
  const hasAnimations = animations.length > 0;
  const actionMap = useMemo(() => {
    const entries = Object.entries(actions).filter((entry): entry is [string, THREE.AnimationAction] => Boolean(entry[1]));
    const normalized = new Map<string, THREE.AnimationAction>();

    entries.forEach(([name, action]) => {
      normalized.set(name.toLowerCase(), action);
    });

    return normalized;
  }, [actions]);

  const resolveAction = useMemo(() => {
    return (movementState: "idle" | "forward" | "back" | "left" | "right") => {
      const candidatesByState: Record<typeof movementState, string[]> = {
        idle: ["characterarmature|idle", "characterarmature|idle_neutral", "idle", "idle_neutral"],
        forward: ["characterarmature|run", "run", "characterarmature|walk", "walk"],
        back: ["characterarmature|run_back", "run_back"],
        left: ["characterarmature|run_left", "run_left"],
        right: ["characterarmature|run_right", "run_right"],
      };

      for (const candidate of candidatesByState[movementState]) {
        const match = actionMap.get(candidate);
        if (match) {
          return match;
        }
      }

      return null;
    };
  }, [actionMap]);

  useMemo(() => {
    clonedScene.traverse((child: THREE.Object3D) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => {
          material.needsUpdate = true;
        });
      } else if (child.material) {
        child.material.needsUpdate = true;
      }
    });
    return clonedScene;
  }, [clonedScene]);

  useEffect(() => {
    if (!hasAnimations) return;
    const idleAction = resolveAction("idle");
    if (idleAction) {
      idleAction.reset().fadeIn(0.25).play();
      activeActionRef.current = idleAction;
    }

    return () => {
      Object.values(actions).forEach((action) => action?.fadeOut(0.2));
    };
  }, [actions, hasAnimations, resolveAction]);

  useFrame(({ clock }, delta) => {
    if (!rootRef.current) return;

    if (hasAnimations) {
      const currentPosition = new THREE.Vector3(position[0], position[1], position[2]);
      const previousPosition = previousPositionRef.current;
      const movementDelta = currentPosition.clone().sub(previousPosition);
      const planarDistance = Math.hypot(movementDelta.x, movementDelta.z);
      const movementThreshold = 0.0025;
      let nextMovementState: "idle" | "forward" | "back" | "left" | "right" = "idle";

      if (planarDistance > movementThreshold) {
        const localDelta = movementDelta.clone().applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          -(previousYawRef.current + config.rotationY),
        );

        if (Math.abs(localDelta.x) > Math.abs(localDelta.z)) {
          nextMovementState = localDelta.x > 0 ? "right" : "left";
        } else {
          nextMovementState = localDelta.z > 0 ? "back" : "forward";
        }
      }

      if (movementStateRef.current !== nextMovementState) {
        const nextAction = resolveAction(nextMovementState) || resolveAction("idle");
        if (nextAction && nextAction !== activeActionRef.current) {
          activeActionRef.current?.fadeOut(0.18);
          nextAction.reset().fadeIn(0.18).play();
          activeActionRef.current = nextAction;
        }
        movementStateRef.current = nextMovementState;
      }

      previousPositionRef.current.copy(currentPosition);
      previousYawRef.current = yaw;
      rootRef.current.position.y = THREE.MathUtils.lerp(
        rootRef.current.position.y,
        position[1] + config.floorOffset,
        1 - Math.exp(-delta * 10),
      );
      rootRef.current.position.x = THREE.MathUtils.lerp(
        rootRef.current.position.x,
        position[0],
        1 - Math.exp(-delta * 10),
      );
      rootRef.current.position.z = THREE.MathUtils.lerp(
        rootRef.current.position.z,
        position[2],
        1 - Math.exp(-delta * 10),
      );
      rootRef.current.rotation.y = THREE.MathUtils.lerp(
        rootRef.current.rotation.y,
        yaw + config.rotationY,
        1 - Math.exp(-delta * 10),
      );
      return;
    }

    const idle = Math.sin(clock.getElapsedTime() * 1.7);
    rootRef.current.position.y = THREE.MathUtils.lerp(
      rootRef.current.position.y,
      position[1] + config.floorOffset + idle * 0.03,
      1 - Math.exp(-delta * 6),
    );
    rootRef.current.scale.setScalar(config.scale);
    rootRef.current.scale.y = config.scale * (1 + idle * 0.02);
  });

  return (
    <group
      ref={rootRef}
      position={[position[0], position[1] + config.floorOffset, position[2]]}
      rotation={[0, yaw + config.rotationY, 0]}
      scale={config.scale}
    >
      <primitive object={clonedScene} position={modelOffset} />
    </group>
  );
}

export function RoomAvatar({ avatarId, position, yaw }: RoomAvatarProps) {
  const config = getAvatarConfig(avatarId);

  useEffect(() => {
    preloadAvatarModel(avatarId);
  }, [avatarId]);

  return (
    <AvatarErrorBoundary
      resetKey={`${avatarId || "default"}:${config.url}`}
      fallback={
        <AvatarFallback avatarId={avatarId} position={position} yaw={yaw} />
      }
    >
      <Suspense
        fallback={
          <AvatarFallback
            avatarId={avatarId}
            position={position}
            yaw={yaw}
            loading
          />
        }
      >
        <LoadedAvatar avatarId={avatarId} position={position} yaw={yaw} />
      </Suspense>
    </AvatarErrorBoundary>
  );
}

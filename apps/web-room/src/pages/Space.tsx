import { useEffect, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Box, PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import { useSocket } from "../context/SocketProvider";
import TrailerOverlay from "../components/TrailerOverlay";
import CommentsOverlay from "../components/CommentsOverlay";
import InfoOverlay from "../components/InfoOverlay";
import AiOverlay from "../components/AiOverlay";
import { useMediasoup } from "../hooks/useMediasoup"; // <-- Add this import

// --- Types & Zones ---
interface Position {
  x: number;
  z: number;
  rY: number;
}
interface PlayerData {
  socketId: string;
  position: Position;
}

// Helper to render MediaStreams correctly in React
const VideoPlayer = ({
  stream,
  muted = false,
  label,
}: {
  stream: MediaStream | null;
  muted?: boolean;
  label: string;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;

  return (
    <div className="relative w-48 h-32 bg-zinc-900 rounded-xl overflow-hidden border-2 border-zinc-800 shadow-xl">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white font-bold backdrop-blur-sm">
        {label}
      </div>
    </div>
  );
};

const ZONES = {
  tv: { x: 0, z: -12, radius: 4, key: "KeyT", prompt: "Press 'T' for Trailer" },
  comments: {
    x: -12,
    z: 0,
    radius: 4,
    key: "KeyC",
    prompt: "Press 'C' for Comments",
  },
  info: { x: 12, z: 0, radius: 4, key: "KeyI", prompt: "Press 'I' for Info" },
  ai: {
    x: 0,
    z: 12,
    radius: 4,
    key: "KeyA",
    prompt: "Press 'A' to chat with AI",
  },
};

// --- 1. The FPS Player Controller ---
const FPSController = ({
  socket,
  setInteractionPrompt,
  setActiveOverlay,
  activeOverlay,
}: {
  socket: any;
  setInteractionPrompt: (prompt: string | null) => void;
  setActiveOverlay: (overlay: string | null) => void;
  activeOverlay: string | null;
}) => {
  const keys = useRef<{ [key: string]: boolean }>({});
  const currentPromptRef = useRef<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not record keys if a menu is open (like when typing in the AI chat)
      if (activeOverlay) return;
      keys.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [activeOverlay]);

  useFrame((state) => {
    // If a menu is open, freeze movement
    if (activeOverlay) return;

    const speed = 0.12;
    const bounds = 12.5;
    let moved = false;

    // --- FPS Relative Movement Math ---
    // Calculate forward/backward and left/right based on CAMERA direction
    let fwd = 0;
    let right = 0;
    if (keys.current["KeyW"] || keys.current["ArrowUp"]) fwd += 1;
    if (keys.current["KeyS"] || keys.current["ArrowDown"]) fwd -= 1;
    if (keys.current["KeyA"] || keys.current["ArrowLeft"]) right -= 1;
    if (keys.current["KeyD"] || keys.current["ArrowRight"]) right += 1;

    if (fwd !== 0 || right !== 0) {
      // Normalize vector so diagonal movement isn't twice as fast
      const direction = new THREE.Vector3(right, 0, -fwd)
        .normalize()
        .multiplyScalar(speed);

      // Translate relative to where the camera is currently looking
      state.camera.translateX(direction.x);
      state.camera.translateZ(direction.z);
      moved = true;
    }

    // Lock Y-axis (Eye Level) and enforce invisible walls
    state.camera.position.y = 2;
    state.camera.position.x = Math.max(
      -bounds,
      Math.min(bounds, state.camera.position.x),
    );
    state.camera.position.z = Math.max(
      -bounds,
      Math.min(bounds, state.camera.position.z),
    );

    if (moved && socket?.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "player-move",
          // Send our rotation so other players see which way our head is turned
          data: {
            x: state.camera.position.x,
            z: state.camera.position.z,
            rY: state.camera.rotation.y,
          },
        }),
      );
    }

    // --- Dynamic Prompts ---
    const px = state.camera.position.x;
    const pz = state.camera.position.z;
    let activePrompt: string | null = null;

    if (Math.hypot(px - ZONES.tv.x, pz - ZONES.tv.z) < ZONES.tv.radius)
      activePrompt = ZONES.tv.prompt;
    else if (
      Math.hypot(px - ZONES.comments.x, pz - ZONES.comments.z) <
      ZONES.comments.radius
    )
      activePrompt = ZONES.comments.prompt;
    else if (
      Math.hypot(px - ZONES.info.x, pz - ZONES.info.z) < ZONES.info.radius
    )
      activePrompt = ZONES.info.prompt;
    else if (Math.hypot(px - ZONES.ai.x, pz - ZONES.ai.z) < ZONES.ai.radius)
      activePrompt = ZONES.ai.prompt;

    if (activePrompt !== currentPromptRef.current) {
      currentPromptRef.current = activePrompt;
      setInteractionPrompt(activePrompt);
    }

    // --- Trigger Interactions ---
    if (keys.current[ZONES.tv.key] && activePrompt === ZONES.tv.prompt)
      triggerMenu("tv");
    if (
      keys.current[ZONES.comments.key] &&
      activePrompt === ZONES.comments.prompt
    )
      triggerMenu("comments");
    if (keys.current[ZONES.info.key] && activePrompt === ZONES.info.prompt)
      triggerMenu("info");
    if (keys.current[ZONES.ai.key] && activePrompt === ZONES.ai.prompt)
      triggerMenu("ai");
  });

  const triggerMenu = (menu: string) => {
    setActiveOverlay(menu);
    keys.current = {}; // Clear keys
    document.exitPointerLock(); // FREE THE MOUSE SO THEY CAN CLICK THE UI
  };

  return (
    <>
      {/* PointerLock automatically captures the mouse when you click the canvas */}
      {/* We unmount it when a menu opens so the mouse is freed */}
      {!activeOverlay && <PointerLockControls />}
    </>
  );
};

// --- 2. The Guest Player Component (Now rotates to look at things!) ---
const GuestPlayer = ({ position }: { position: Position }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.lerp(
      new THREE.Vector3(position.x, 1, position.z),
      0.2,
    );

    // Smoothly rotate their avatar to match where they are looking
    const targetRotation = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, position.rY, 0),
    );
    meshRef.current.quaternion.slerp(targetRotation, 0.2);
  });
  return (
    <Box ref={meshRef} position={[position.x, 1, position.z]} args={[1, 2, 1]}>
      <meshStandardMaterial color="#ef4444" />
      {/* Add a little "visor" so we know which way they are facing */}
      <Box position={[0, 0.5, -0.6]} args={[0.8, 0.4, 0.2]}>
        <meshStandardMaterial color="black" />
      </Box>
    </Box>
  );
};

// --- 3. The Main Room Component ---
export default function Space() {
  const { socket, isConnected } = useSocket();
  const [guests, setGuests] = useState<Map<string, PlayerData>>(new Map());
  const hasJoined = useRef(false);

  // NEW: Destructure stopWebcam
  const { startWebcam, stopWebcam, localStream, remoteStreams, initWebRTC } =
    useMediasoup(socket, isConnected);

  useEffect(() => {
    if (
      isConnected &&
      socket &&
      socket.readyState === WebSocket.OPEN &&
      !hasJoined.current
    ) {
      hasJoined.current = true;
      socket.send(
        JSON.stringify({
          type: "join-room",
          data: {
            roomId: "lobby-1",
            position: { x: 0, z: 8, rY: 0 },
            modelUrl: "",
          },
          requestId: crypto.randomUUID(),
        }),
      );

      // We still want to initialize the receiving pipeline so we can see others
      // EVEN if we haven't turned our own camera on yet!
      initWebRTC();
    }
  }, [isConnected, socket]);

  const [interactionPrompt, setInteractionPrompt] = useState<string | null>(
    null,
  );
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);

  useEffect(() => {
    if (
      isConnected &&
      socket &&
      socket.readyState === WebSocket.OPEN &&
      !hasJoined.current
    ) {
      hasJoined.current = true;
      socket.send(
        JSON.stringify({
          type: "join-room",
          data: {
            roomId: "lobby-1",
            position: { x: 0, z: 8, rY: 0 },
            modelUrl: "",
          },
          requestId: crypto.randomUUID(),
        }),
      );
    }
  }, [isConnected, socket]);

  useEffect(() => {
    if (!isConnected || socket?.readyState !== WebSocket.OPEN) {
      hasJoined.current = false;
    }
  }, [isConnected, socket]);

  useEffect(() => {
    if (!socket) return;
    const handleMessage = (event: MessageEvent) => {
      const { type, data } = JSON.parse(event.data);
      if (type === "room-join-request") {
        const newGuests = new Map(guests);
        data.existingPlayers.forEach((p: PlayerData) =>
          newGuests.set(p.socketId, p),
        );
        setGuests(newGuests);
      } else if (type === "player-joined")
        setGuests((prev) => new Map(prev).set(data.socketId, data));
      else if (type === "player-moved") {
        setGuests((prev) => {
          const updated = new Map(prev);
          const guest = updated.get(data.socketId);
          if (guest) {
            guest.position = data.position;
            updated.set(data.socketId, guest);
          }
          return updated;
        });
      } else if (type === "player-left") {
        setGuests((prev) => {
          const updated = new Map(prev);
          updated.delete(data.socketId);
          return updated;
        });
      }
    };
    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket, guests]);

  return (
    <div className="w-full h-screen bg-black relative">
      <div className="absolute top-4 left-4 z-10 text-white font-mono bg-black/50 p-4 rounded pointer-events-none">
        <h1 className="text-xl font-bold">Metaverse Room</h1>
        <p className="text-blue-400">
          Click screen to look around (ESC to release)
        </p>
        <p>Use W, A, S, D to move</p>
        <p>Players in room: {guests.size + 1}</p>
        {/* THE TOGGLE CONTROLS */}
        {!localStream ? (
          <button
            onClick={startWebcam}
            className="mt-4 pointer-events-auto bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-sans font-bold shadow-lg transition-colors"
          >
            Start Watch Party (Camera)
          </button>
        ) : (
          <button
            onClick={stopWebcam}
            className="mt-4 pointer-events-auto bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-sans font-bold shadow-lg transition-colors flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
            Stop Camera & Mic
          </button>
        )}
      </div>

      {/* NEW: The Video Bar (Top Center) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-4 p-2 bg-black/40 backdrop-blur-md rounded-2xl">
        {localStream && (
          <VideoPlayer stream={localStream} muted={true} label="You" />
        )}

        {Array.from(remoteStreams.entries()).map((entry) => {
          const [producerId, stream]: any = entry;
          return (
            <VideoPlayer key={producerId} stream={stream} label={`Guest`} />
          );
        })}
      </div>

      {interactionPrompt && !activeOverlay && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-bounce">
          <div className="bg-white text-black px-6 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(255,255,255,0.5)]">
            {interactionPrompt}
          </div>
        </div>
      )}

      {/* OVERLAYS */}
      {activeOverlay === "tv" && (
        <TrailerOverlay
          onClose={() => setActiveOverlay(null)}
          movieId="157336"
        />
      )}
      {activeOverlay === "comments" && (
        <CommentsOverlay
          onClose={() => setActiveOverlay(null)}
          movieId="157336"
        />
      )}
      {activeOverlay === "info" && (
        <InfoOverlay onClose={() => setActiveOverlay(null)} movieId="157336" />
      )}
      {activeOverlay === "ai" && (
        <AiOverlay onClose={() => setActiveOverlay(null)} movieId="157336" />
      )}

      <Canvas shadows>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 20, 10]} castShadow intensity={1} />
        <Environment preset="city" />

        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[26, 26]} />
          <meshStandardMaterial color="#111" />
        </mesh>

        <Box position={[0, 4.5, -12.5]} args={[16, 9, 1]} castShadow>
          <meshStandardMaterial
            color="black"
            emissive="#1d4ed8"
            emissiveIntensity={0.2}
          />
        </Box>

        <group position={[-12, 0, 0]}>
          <mesh position={[2, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[3, 32]} />
            <meshStandardMaterial color="#3b82f6" transparent opacity={0.2} />
          </mesh>
          <Box position={[0, 1, 0]} args={[2, 2, 6]} castShadow>
            <meshStandardMaterial color="#333" />
          </Box>
        </group>

        <group position={[12, 0, 0]}>
          <mesh position={[-2, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[3, 32]} />
            <meshStandardMaterial color="#10b981" transparent opacity={0.2} />
          </mesh>
          <Box position={[0, 2, 0]} args={[2, 4, 8]} castShadow>
            <meshStandardMaterial color="#333" />
          </Box>
        </group>

        <group position={[0, 0, 12]}>
          <mesh position={[0, 0.01, -2]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[3, 32]} />
            <meshStandardMaterial color="#8b5cf6" transparent opacity={0.2} />
          </mesh>
          <Box position={[0, 1.5, 0]} args={[6, 3, 2]} castShadow>
            <meshStandardMaterial color="#333" />
          </Box>
        </group>

        {/* The New FPS Controller takes over the camera */}
        <FPSController
          socket={socket}
          setInteractionPrompt={setInteractionPrompt}
          setActiveOverlay={setActiveOverlay}
          activeOverlay={activeOverlay}
        />

        {/* Guests now have a little black "Visor" so you can see where they are looking! */}
        {Array.from(guests.values()).map((guest) => (
          <GuestPlayer key={guest.socketId} position={guest.position} />
        ))}
      </Canvas>
    </div>
  );
}

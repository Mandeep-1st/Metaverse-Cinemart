import { Canvas } from "@react-three/fiber";
import { useState, type MutableRefObject } from "react";
import { PLAYER_Y } from "./constants";
import { RoomAvatar } from "./Avatar";
import { MovementControls } from "./Controls";
import { Environment } from "./Environment";
import { InteractiveObjects } from "./InteractiveObjects";
import { Lighting } from "./Lighting";
import type { ControlsApiRef, GuestPresence, PlayerSnapshot, ZoneId } from "./types";

type CinemaSceneProps = {
  movementEnabled: boolean;
  overlayOpen: boolean;
  onZoneKey: (zone: ZoneId) => void;
  onCloseOverlay: () => void;
  controlsApiRef: ControlsApiRef;
  playerRef: MutableRefObject<PlayerSnapshot>;
  nearZoneRef: MutableRefObject<ZoneId | null>;
  onNearZoneChange: (zone: ZoneId | null) => void;
  tvOverlayRef: MutableRefObject<HTMLDivElement | null>;
  guests: GuestPresence[];
};

export function CinemaScene({
  movementEnabled,
  overlayOpen,
  onZoneKey,
  onCloseOverlay,
  controlsApiRef,
  playerRef,
  nearZoneRef,
  onNearZoneChange,
  tvOverlayRef,
  guests,
}: CinemaSceneProps) {
  const [activeZone, setActiveZone] = useState<ZoneId | null>(null);

  return (
    <Canvas
      shadows
      camera={{ position: [0, PLAYER_Y, 5], fov: 70 }}
      style={{ width: "100%", height: "100%" }}
    >
      <MovementControls
        movementEnabled={movementEnabled}
        overlayOpen={overlayOpen}
        onZoneKey={onZoneKey}
        onCloseOverlay={onCloseOverlay}
        controlsApiRef={controlsApiRef}
        playerRef={playerRef}
        nearZoneRef={nearZoneRef}
        onNearZoneChange={(zone) => {
          setActiveZone(zone);
          onNearZoneChange(zone);
        }}
        tvOverlayRef={tvOverlayRef}
      />

      <Lighting activeZone={activeZone} />
      <Environment />
      <InteractiveObjects activeZone={activeZone} />

      {guests.map((guest) => (
        <RoomAvatar
          key={guest.peerId}
          avatarId={guest.avatarId}
          position={[guest.x, Math.max(0, guest.y - PLAYER_Y), guest.z]}
          yaw={guest.yaw}
        />
      ))}
    </Canvas>
  );
}

import type React from "react";

export type ZoneId = "north" | "west" | "east" | "south";

export type PlayerSnapshot = {
  x: number;
  y: number;
  z: number;
  yaw: number;
};

export type GuestPresence = {
  peerId: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  avatarId?: string | null;
};

export type ControlsApiRef = React.MutableRefObject<any | null>;

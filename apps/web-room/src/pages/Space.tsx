/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PointerLockControls } from "@react-three/drei";
import { SocketProvider, useSocket } from "../context/SocketProvider";
import { apiGet } from "../utils/apiClient";
import type {
  Consumer,
  Device,
  Producer,
  Transport,
  RtpCapabilities,
} from "mediasoup-client/types";
import * as mediasoupClient from "mediasoup-client";
import { useSearchParams } from "react-router-dom";

type ApiResponse<T> = {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
};

type MovieDetails = {
  tmdb_id: number;
  title: string;
  overview: string;
  images?: { poster?: string | null; backdrop?: string | null; logo?: string | null };
  video?: { url: string; key: string; site: string };
  genres?: Array<{ id?: number; name?: string }> | Array<any>;
};

type Mode = "solo" | "watchparty" | "create-room";
type ZoneId = "north" | "west" | "east" | "south";
type OverlayId = "trailer" | "comments" | "info" | "ai" | null;

const GRID_HALF = 13; // floor roughly spans -13..13
const PLAYER_Y = 1.6;
const ZONE_DISTANCE = 4.5;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isTypingElement(target: EventTarget | null) {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable
  );
}

function toYouTubeEmbed(urlOrKey: string) {
  // Backend returns `https://www.youtube.com/watch?v=KEY`
  if (urlOrKey.startsWith("http")) {
    const u = new URL(urlOrKey);
    const v = u.searchParams.get("v");
    if (v) return `https://www.youtube.com/embed/${v}`;
    // fallback: return as-is
    return urlOrKey;
  }
  return `https://www.youtube.com/embed/${urlOrKey}`;
}

// ---------------------------------------------------------------------------
// Chrome Audio Autoplay unlock
// Chrome will block audio .play() until the user has interacted with the page
// (e.g. clicked something). This helper resumes a shared AudioContext on the
// first user gesture and then triggers play() on all audio elements that were
// silently blocked.
// ---------------------------------------------------------------------------
let _audioCtx: AudioContext | null = null;
let _audioUnlocked = false;
const _pendingAudioEls = new Set<HTMLAudioElement>();

function unlockAudio(el: HTMLAudioElement) {
  _pendingAudioEls.add(el);
  if (_audioUnlocked) {
    el.play().catch(() => {});
    return;
  }
  const tryUnlock = () => {
    if (_audioUnlocked) return;
    if (!_audioCtx) _audioCtx = new AudioContext();
    _audioCtx.resume().then(() => {
      _audioUnlocked = true;
      _pendingAudioEls.forEach((a) => a.play().catch(() => {}));
      document.removeEventListener('click', tryUnlock, true);
      document.removeEventListener('keydown', tryUnlock, true);
    });
  };
  document.addEventListener('click', tryUnlock, true);
  document.addEventListener('keydown', tryUnlock, true);
}

function useMovieDetails(movieId: number | null) {
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    movieId ? "loading" : "idle",
  );
  const cacheRef = useRef<Map<number, MovieDetails>>(new Map());

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!movieId) return;
      const cached = cacheRef.current.get(movieId);
      if (cached) {
        setMovie(cached);
        setStatus("ready");
        return;
      }
      setStatus("loading");
      try {
        const res = await apiGet<ApiResponse<MovieDetails>>(`/movies/${movieId}`);
        if (cancelled) return;
        cacheRef.current.set(movieId, res.data);
        setMovie(res.data);
        setStatus("ready");
      } catch {
        if (cancelled) return;
        setStatus("error");
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [movieId]);

  return { movie, status } as const;
}

function RemoteVideo({ stream }: { stream: MediaStream }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.srcObject = stream;
    // Must play after setting srcObject; catch autoplay-policy errors silently.
    el.play().catch(() => {});
    return () => {
      // Only clear the srcObject reference — do NOT stop the tracks.
      // Tracks are owned by the mediasoup Consumer; stopping them here
      // permanently kills the remote media pipe.
      el.srcObject = null;
    };
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      // muted is intentional: video-only streams need this flag for
      // Chrome's autoplay policy to allow play() without a user gesture.
      muted
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}

function RemoteAudio({ stream }: { stream: MediaStream }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.srcObject = stream;
    // Use the unlock helper — Chrome will retry play() on the next user gesture
    // if autoplay is currently blocked.
    unlockAudio(el);
    return () => {
      _pendingAudioEls.delete(el);
      el.srcObject = null;
    };
  }, [stream]);
  return (
    <audio
      ref={audioRef}
      autoPlay
      playsInline
      style={{ position: 'fixed', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
    />
  );
}

function OverlayShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-[220] flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-4xl rounded-[var(--radius)] bg-background/90 border border-border/20 p-5 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="font-black uppercase tracking-widest text-primary text-sm">
            {title}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-card border border-border/20 hover:border-primary/40"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function TrailerOverlay({
  movieId,
  onClose,
}: {
  movieId: number;
  onClose: () => void;
}) {
  const { movie, status } = useMovieDetails(movieId);

  return (
    <OverlayShell title="YouTube Trailer" onClose={onClose}>
      {status === "loading" && <div className="text-white/80">Loading...</div>}
      {status === "error" && (
        <div className="text-red-300/90 font-bold">
          Trailer fetch failed. Ensure `http-server` is reachable.
        </div>
      )}
      {status === "ready" && (
        <>
          {movie?.video?.url ? (
            <div className="aspect-video w-full rounded-[var(--radius)] overflow-hidden border border-border/20">
              <iframe
                title="Trailer"
                className="w-full h-full"
                src={toYouTubeEmbed(movie.video.url)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="text-white/80">No trailer found for this title.</div>
          )}
        </>
      )}
    </OverlayShell>
  );
}

function MovieInfoOverlay({
  movieId,
  onClose,
}: {
  movieId: number;
  onClose: () => void;
}) {
  const { movie, status } = useMovieDetails(movieId);

  return (
    <OverlayShell title="Movie Metadata" onClose={onClose}>
      {status === "loading" && <div className="text-white/80">Loading...</div>}
      {status === "error" && (
        <div className="text-red-300/90 font-bold">
          Metadata fetch failed. Ensure `http-server` is reachable.
        </div>
      )}
      {status === "ready" && movie && (
        <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] pr-1">
          <div className="text-3xl sm:text-4xl font-black italic">{movie.title}</div>
          {movie.images?.backdrop && (
            <img
              src={movie.images.backdrop}
              alt={movie.title}
              className="w-full max-h-56 object-cover rounded-[var(--radius)] border border-border/20"
            />
          )}
          <div className="text-muted-foreground leading-relaxed">{movie.overview}</div>
          <div className="text-sm text-foreground/90">
            Genres:{" "}
            {(movie.genres ?? [])
              .slice(0, 10)
              .map((g: any) => g?.name ?? g)
              .join(", ")}
          </div>
        </div>
      )}
    </OverlayShell>
  );
}

function CommentsOverlay({ onClose }: { onClose: () => void }) {
  return (
    <OverlayShell title="Comments / Chairs" onClose={onClose}>
      <div className="text-muted-foreground leading-relaxed">
        This sidebar overlay is scaffolded for Phase 3 wiring to real room
        comments. For now, it’s a placeholder UI.
      </div>
    </OverlayShell>
  );
}

function AIChatOverlay({
  onClose,
  mode,
}: {
  onClose: () => void;
  mode: Mode;
}) {
  return (
    <OverlayShell title="CineBot AI Desk" onClose={onClose}>
      <div className="text-muted-foreground leading-relaxed">
        AI endpoints in `http-server` are currently protected. This UI is ready
        for Phase 3 authenticated networking and streaming chat.
      </div>
      <div className="mt-3 text-xs text-muted-foreground">
        Context: {mode === "watchparty" ? "Multiplayer watch party" : "Solo"}
      </div>
    </OverlayShell>
  );
}

function GuestBox({
  x,
  y,
  z,
  yaw,
}: {
  x: number;
  y: number;
  z: number;
  yaw: number;
}) {
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      <mesh>
        <boxGeometry args={[0.6, 1.2, 0.6]} />
        <meshStandardMaterial color="#ff3b3b" />
      </mesh>
      <mesh position={[0, 0.1, 0.31]}>
        <boxGeometry args={[0.52, 0.28, 0.06]} />
        <meshStandardMaterial color="#070707" />
      </mesh>
      <mesh position={[0, 0.1, 0.33]}>
        <boxGeometry args={[0.52, 0.12, 0.01]} />
        <meshStandardMaterial color="#2a2a2a" emissive="#0a0a0a" />
      </mesh>
    </group>
  );
}

function WatchPartyAvatars({
  roomId,
  playerRef,
  setGuests,
}: {
  roomId: string;
  playerRef: React.MutableRefObject<{ x: number; y: number; z: number; yaw: number }>;
  setGuests: React.Dispatch<
    React.SetStateAction<Array<{ peerId: string; x: number; y: number; z: number; yaw: number }>>
  >;
}) {
  const socket = useSocket();
  const emittingRef = useRef(false);

  // Update or add avatar position for a peer
  useEffect(() => {
    const unsub = socket.onAvatarState((data: any) => {
      const peerId = String(data.peerId ?? data.socketId ?? "guest");
      const x = Number(data.x);
      const z = Number(data.z);
      const y = Number(data.y ?? PLAYER_Y);
      const yaw = Number(data.rY ?? data.yaw ?? 0);
      setGuests((prev) => {
        const filtered = prev.filter((p) => p.peerId !== peerId);
        return [...filtered, { peerId, x, y, z, yaw }];
      });
    });
    return () => unsub();
  }, [setGuests, socket]);

  // Remove avatar when peer disconnects
  useEffect(() => {
    const unsub = socket.onPeerLeft((data: any) => {
      const peerId = String(data.peerId ?? "");
      if (!peerId) return;
      setGuests((prev) => prev.filter((p) => p.peerId !== peerId));
    });
    return () => unsub();
  }, [setGuests, socket]);

  // Broadcast own position every 100 ms
  useEffect(() => {
    if (emittingRef.current) return;
    emittingRef.current = true;

    const interval = window.setInterval(() => {
      const { x, y, z, yaw } = playerRef.current;
      socket.emit("avatar-sync", { roomId, x, y, z, rY: yaw });
    }, 100);

    return () => {
      window.clearInterval(interval);
      emittingRef.current = false;
    };
  }, [roomId, playerRef, socket]);

  return null;
}

function WatchPartyMediaBar({ roomId }: { roomId: string }) {
  const socket = useSocket();

  const [status, setStatus] = useState("Initializing...");
  const [remoteMedia, setRemoteMedia] = useState<
    Array<{ producerId: string; consumerId: string; kind: "video" | "audio"; stream: MediaStream }>
  >([]);

  const pendingProducers = useRef<string[]>([]);
  const deviceRef = useRef<Device | null>(null);
  const producerTransportRef = useRef<Transport | null>(null);
  const consumerTransportRef = useRef<Transport | null>(null);
  const recvTransportInitPromiseRef = useRef<Promise<Transport | null> | null>(null);

  const localVideoStreamRef = useRef<MediaStream | null>(null);
  const localAudioStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  const videoProducerRef = useRef<Producer | null>(null);
  const audioProducerRef = useRef<Producer | null>(null);

  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);

  const createDevice = useCallback(async () => {
    if (deviceRef.current) return deviceRef.current;
    const rtpCaps = await socket.sendRequest<RtpCapabilities>("getRtpCapabilities");
    const device = new mediasoupClient.Device() as Device;
    await device.load({ routerRtpCapabilities: rtpCaps });
    deviceRef.current = device;
    return device;
  }, [socket]);

  const getOrCreateRecvTransport = useCallback(async () => {
    if (consumerTransportRef.current) return consumerTransportRef.current;
    if (!deviceRef.current) return null;
    if (recvTransportInitPromiseRef.current) return recvTransportInitPromiseRef.current;

    recvTransportInitPromiseRef.current = (async () => {
      const transportParams: any = await socket.sendRequest("createWebRtcTransport", {
        sender: false,
      });
      const transport = deviceRef.current!.createRecvTransport(transportParams);
      transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
        try {
          await socket.sendRequest("transport-recv-connect", { dtlsParameters });
          callback();
        } catch (e) {
          errback(e as Error);
        }
      });
      consumerTransportRef.current = transport;
      return transport;
    })();

    return recvTransportInitPromiseRef.current;
  }, [socket]);

  const consumeProducer = useCallback(
    async (producerId: string) => {
      if (!deviceRef.current) await createDevice();
      const transport = await getOrCreateRecvTransport();
      if (!transport || !deviceRef.current) return;

      const data: any = await socket.sendRequest("consume", {
        rtpCapabilities: deviceRef.current.rtpCapabilities,
        producerId,
      });

      const consumer: Consumer = await transport.consume({
        id: data.id,
        producerId: data.producerId,
        kind: data.kind,
        rtpParameters: data.rtpParameters,
      });

      setRemoteMedia((prev) => {
        if (prev.some((m) => m.producerId === producerId)) return prev;
        return [
          ...prev,
          {
            producerId,
            consumerId: consumer.id,
            kind: consumer.kind as "video" | "audio",
            stream: new MediaStream([consumer.track]),
          },
        ];
      });

      await socket.sendRequest("consumer-resume", { consumerId: data.id });
    },
    [createDevice, getOrCreateRecvTransport, socket],
  );

  const flushPending = useCallback(async () => {
    // Buffer producers until recv transport ready.
    if (!deviceRef.current) return;
    if (!consumerTransportRef.current) {
      // Wait for transport init if it's in progress.
      if (recvTransportInitPromiseRef.current) {
        const t = await recvTransportInitPromiseRef.current;
        if (!t) return;
      } else {
        await getOrCreateRecvTransport();
      }
    }
    while (pendingProducers.current.length > 0) {
      const pId = pendingProducers.current.shift()!;
      await consumeProducer(pId);
    }
  }, [consumeProducer, getOrCreateRecvTransport]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await socket.sendRequest("join-room", { roomId });
        await createDevice();
        setStatus(`Joined room ${roomId}`);

        // Pre-create recv transport so "existing-producers" can be consumed.
        await getOrCreateRecvTransport();
        if (!mounted) return;
        await flushPending();
      } catch {
        if (!mounted) return;
        setStatus("Failed to init mediasoup.");
      }
    };

    const unsubExisting = socket.onExistingProducers((producers) => {
      producers.forEach((p: any) => pendingProducers.current.push(p.producerId));
      flushPending();
    });
    const unsubNew = socket.onNewProducerArrives((p) => {
      pendingProducers.current.push(p.producerId);
      flushPending();
    });
    const unsubClosed = socket.onProducerClosed((data: any) => {
      const producerId = String(data.producerId);
      setRemoteMedia((prev) => prev.filter((m) => m.producerId !== producerId));
    });

    init();
    return () => {
      mounted = false;
      unsubExisting();
      unsubNew();
      unsubClosed();
    };
  }, [createDevice, flushPending, getOrCreateRecvTransport, roomId, socket]);

  const getOrCreateSendTransport = useCallback(async () => {
    if (producerTransportRef.current) return producerTransportRef.current;
    if (!deviceRef.current) await createDevice();

    const params: any = await socket.sendRequest("createWebRtcTransport", { sender: true });
    const transport = deviceRef.current!.createSendTransport(params);
    transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
      try {
        await socket.sendRequest("transport-connect", { dtlsParameters });
        callback();
      } catch (e) {
        errback(e as Error);
      }
    });
    transport.on("produce", async (parameters, callback, errback) => {
      try {
        const data: any = await socket.sendRequest("transport-produce", {
          kind: parameters.kind,
          rtpParameters: parameters.rtpParameters,
        });
        callback({ id: data.id });
      } catch (e) {
        errback(e as Error);
      }
    });

    producerTransportRef.current = transport;
    return transport;
  }, [createDevice, socket]);

  const startVideo = useCallback(async () => {
    if (isVideoOn) return;
    const transport = await getOrCreateSendTransport();

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
      audio: false,
    });
    localVideoStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;

    const track = stream.getVideoTracks()[0];
    // Single-layer VP8 — keeps things simple and avoids simulcast negotiation
    // issues that can prevent the remote side from consuming the track.
    videoProducerRef.current = await transport.produce({ track });

    setIsVideoOn(true);
  }, [getOrCreateSendTransport, isVideoOn]);

  const startAudio = useCallback(async () => {
    if (isAudioOn) return;
    const transport = await getOrCreateSendTransport();

    const stream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
    });
    localAudioStreamRef.current = stream;

    const track = stream.getAudioTracks()[0];
    audioProducerRef.current = await transport.produce({
      track,
    });
    setIsAudioOn(true);
  }, [getOrCreateSendTransport, isAudioOn]);

  const stopVideo = useCallback(async () => {
    const producer = videoProducerRef.current;
    if (producer) {
      const id = producer.id;
      try {
        producer.close();
      } catch {
        // ignore
      }
      videoProducerRef.current = null;
      socket.emit("producer-close", { producerId: id });
    }
    const stream = localVideoStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      localVideoStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setIsVideoOn(false);
  }, [socket]);

  const stopAudio = useCallback(async () => {
    const producer = audioProducerRef.current;
    if (producer) {
      const id = producer.id;
      try {
        producer.close();
      } catch {
        // ignore
      }
      audioProducerRef.current = null;
      socket.emit("producer-close", { producerId: id });
    }
    const stream = localAudioStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      localAudioStreamRef.current = null;
    }
    setIsAudioOn(false);
  }, [socket]);

  return (
    <div className="absolute top-0 left-0 right-0 z-[200] pointer-events-none">
      <div className="pointer-events-auto bg-neutral-950/70 border-b border-border/20 backdrop-blur-xl p-3">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="text-sm font-black uppercase tracking-widest text-primary">
            Watch Party
          </div>
          <div className="text-xs text-white/70 truncate">{status}</div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1">
          {/* Local feed */}
          <div className="min-w-[220px] w-[220px] rounded-xl border border-border/20 bg-neutral-900 p-2">
            <div className="text-xs font-bold text-white/80 mb-2">You</div>
            <div className="w-full aspect-video rounded-lg overflow-hidden bg-black border border-border/10 relative">
              <video
                ref={localVideoRef}
                muted
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${!isVideoOn ? "hidden" : ""}`}
              />
              {!isVideoOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <span className="text-white/80 text-sm">Camera Off</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                className={`flex-1 px-3 py-2 rounded-full text-xs font-black uppercase tracking-widest ${
                  isVideoOn ? "bg-neutral-700/80 hover:bg-neutral-600" : "bg-red-600 hover:bg-red-500"
                }`}
                onClick={() => (isVideoOn ? stopVideo() : startVideo())}
              >
                {isVideoOn ? "Stop Camera" : "Start Camera"}
              </button>
              <button
                className={`flex-1 px-3 py-2 rounded-full text-xs font-black uppercase tracking-widest ${
                  isAudioOn ? "bg-neutral-700/80 hover:bg-neutral-600" : "bg-red-600 hover:bg-red-500"
                }`}
                onClick={() => (isAudioOn ? stopAudio() : startAudio())}
              >
                {isAudioOn ? "Stop Mic" : "Start Mic"}
              </button>
            </div>
          </div>

          {/* Remote video feeds */}
          {remoteMedia
            .filter((m) => m.kind === "video")
            .map((m) => (
              <div
                key={m.consumerId}
                className="min-w-[220px] w-[220px] rounded-xl border border-border/20 bg-neutral-900 p-2"
              >
                <div className="text-xs font-bold text-white/80 mb-2">Guest</div>
                <div className="w-full aspect-video rounded-lg overflow-hidden bg-black border border-border/10">
                  <RemoteVideo stream={m.stream} />
                </div>
              </div>
            ))}

        </div>
      </div>

      {/* Audio players live outside the pointer-events container so Chrome
          doesn't suppress them. Position fixed, zero size — visually invisible. */}
      {remoteMedia
        .filter((m) => m.kind === "audio")
        .map((m) => (
          <RemoteAudio key={m.consumerId} stream={m.stream} />
        ))}
    </div>
  );
}

function WorldFPS({
  movementEnabled,
  overlayOpen,
  onZoneKey,
  onCloseOverlay,
  controlsApiRef,
  playerRef,
  nearZoneRef,
  onNearZoneChange,
}: {
  movementEnabled: boolean;
  overlayOpen: boolean;
  onZoneKey: (zone: ZoneId) => void;
  onCloseOverlay: () => void;
  controlsApiRef: React.MutableRefObject<any | null>;
  playerRef: React.MutableRefObject<{ x: number; y: number; z: number; yaw: number }>;
  nearZoneRef: React.MutableRefObject<ZoneId | null>;
  onNearZoneChange: (zone: ZoneId | null) => void;
}) {
  const controlsRef = useRef<any>(null);
  const keysRef = useRef({ w: false, a: false, s: false, d: false });
  const [nearZone, setNearZone] = useState<ZoneId | null>(null);

  useEffect(() => {
    controlsApiRef.current = controlsRef.current;
  }, [controlsApiRef]);

  // Keyboard handling (WASD + zone triggers)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingElement(e.target)) return;

      const k = e.key.toLowerCase();
      if (k === "escape") {
        e.preventDefault();
        onCloseOverlay();
        return;
      }

      if (!movementEnabled || overlayOpen) return;

      // Zone triggers
      const near = nearZoneRef.current;
      if (near) {
        if (k === "t" && near === "north") {
          onZoneKey("north");
          return;
        }
        if (k === "c" && near === "west") {
          onZoneKey("west");
          return;
        }
        if (k === "i" && near === "east") {
          onZoneKey("east");
          return;
        }
        if (k === "a" && near === "south") {
          onZoneKey("south");
          return;
        }
      }

      // Movement WASD (only when not consuming a zone trigger)
      if (k === "w") keysRef.current.w = true;
      if (k === "a") keysRef.current.a = true;
      if (k === "s") keysRef.current.s = true;
      if (k === "d") keysRef.current.d = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (isTypingElement(e.target)) return;
      const k = e.key.toLowerCase();
      if (k === "w") keysRef.current.w = false;
      if (k === "a") keysRef.current.a = false;
      if (k === "s") keysRef.current.s = false;
      if (k === "d") keysRef.current.d = false;
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown as any);
      window.removeEventListener("keyup", onKeyUp as any);
    };
  }, [movementEnabled, overlayOpen, onCloseOverlay, onZoneKey, nearZoneRef]);

  // Frame loop: movement + proximity
  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useFrame((state, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    // Ensure camera/player position is mirrored.
    const obj = controls.getObject?.();
    if (!obj) return;

    // Init position if still default.
    if (obj.position.x === 0 && obj.position.z === 0) {
      // Clamp into the center of the room on first load.
      obj.position.set(0, PLAYER_Y, 0);
    }

    // Update proximity
    const px = obj.position.x;
    const pz = obj.position.z;
    const zoneCandidates: Array<{ id: ZoneId; x: number; z: number }> = [
      { id: "north", x: 0, z: -12 },
      { id: "south", x: 0, z: 12 },
      { id: "west", x: -12, z: 0 },
      { id: "east", x: 12, z: 0 },
    ];
    let nextNear: ZoneId | null = null;
    for (const z of zoneCandidates) {
      const dist = Math.hypot(px - z.x, pz - z.z);
      if (dist < ZONE_DISTANCE) {
        nextNear = z.id;
        break;
      }
    }
    if (nearZoneRef.current !== nextNear) {
      nearZoneRef.current = nextNear;
      setNearZone(nextNear);
      onNearZoneChange(nextNear);
    } else {
      nearZoneRef.current = nextNear;
    }

    // Movement only when locked + enabled.
    if (!movementEnabled) return;
    if (overlayOpen) return;
    if (!controls.isLocked) return;

    // FPS motion based on camera yaw
    state.camera.getWorldDirection(forward);
    // Lint/immutability safe: don't mutate the memoized vector in-place.
    const dir = forward.clone();
    dir.y = 0;
    dir.normalize();
    right.crossVectors(dir, up).normalize();

    let vx = 0;
    let vz = 0;
    if (keysRef.current.w) {
      vx += dir.x;
      vz += dir.z;
    }
    if (keysRef.current.s) {
      vx -= dir.x;
      vz -= dir.z;
    }
    if (keysRef.current.a) {
      vx -= right.x;
      vz -= right.z;
    }
    if (keysRef.current.d) {
      vx += right.x;
      vz += right.z;
    }

    const len = Math.hypot(vx, vz);
    if (len > 0) {
      vx /= len;
      vz /= len;
    }

    const speed = 8.0;
    const nextX = clamp(obj.position.x + vx * speed * delta, -GRID_HALF, GRID_HALF);
    const nextZ = clamp(obj.position.z + vz * speed * delta, -GRID_HALF, GRID_HALF);
    obj.position.x = nextX;
    obj.position.z = nextZ;
    obj.position.y = PLAYER_Y;

    // Mirror into shared playerRef (for avatar sync).
    playerRef.current = { x: nextX, y: PLAYER_Y, z: nextZ, yaw: obj.rotation.y };
  });

  const zoneMarkers = useMemo(
    () => [
      { id: "north" as const, pos: [0, 0.9, -12] as const, label: "TV (T)" },
      { id: "west" as const, pos: [-12, 0.9, 0] as const, label: "Comments (C)" },
      { id: "east" as const, pos: [12, 0.9, 0] as const, label: "Info (I)" },
      { id: "south" as const, pos: [0, 0.9, 12] as const, label: "CineBot (A)" },
    ],
    [],
  );

  return (
    <>
      <PointerLockControls ref={controlsRef} />

      {/* Floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <planeGeometry args={[26, 26, 26, 26]} />
        <meshStandardMaterial color={"#0b1020"} wireframe />
      </mesh>

      {/* Lighting */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 8, 4]} intensity={0.9} />

      {/* Zone markers – no floating HTML labels; proximity toast handles the hint */}
      {zoneMarkers.map((z) => {
        const isActive = nearZone === z.id;
        return (
          <mesh key={z.id} position={z.pos as any}>
            <boxGeometry args={[2, 1.2, 2]} />
            <meshStandardMaterial
              color={isActive ? "#ff4a4a" : "#22304f"}
              emissive={isActive ? "#ff4a4a" : "#000000"}
              emissiveIntensity={isActive ? 0.6 : 0}
            />
          </mesh>
        );
      })}
    </>
  );
}

function CreateRoomOverlay({
  onCreate,
}: {
  onCreate: (roomId: string, movieId: number) => void;
}) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "ready">("idle");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [results, setResults] = useState<Array<any>>([]);

  const doSearch = useCallback(async (q: string) => {
    setStatus("loading");
    setErrorText(null);
    try {
      const res = await apiGet<ApiResponse<any[]>>(`/movies/search`, { query: q } as any);
      setResults(res.data ?? []);
      setStatus("ready");
    } catch (e: unknown) {
      setStatus("error");
      const base = import.meta.env.VITE_HTTP_SERVER_URL || "http://localhost:8001";
      const attempted = `${base.replace(/\/$/, "")}/api/v1/movies/search?query=${encodeURIComponent(q)}`;
      const msg = e instanceof Error ? e.message : String(e);
      setErrorText(`${msg}\nAttempted: ${attempted}`);
    }
  }, []);

  return (
    <div className="absolute inset-0 z-[210] flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-2xl rounded-[var(--radius)] bg-background/90 border border-border/20 p-6 shadow-2xl">
        <div className="text-2xl font-black italic text-foreground mb-2">
          Create a Watch Party
        </div>
        <div className="text-muted-foreground leading-relaxed">
          Search and pick a movie by name. We’ll generate a shareable URL with{" "}
          <code>roomId</code> and <code>movieId</code>.
        </div>

        {!showSearch && (
          <button
            className="mt-4 w-full bg-primary text-primary-foreground py-3 rounded-full font-black uppercase tracking-widest"
            onClick={() => setShowSearch(true)}
          >
            Create Room
          </button>
        )}

        {showSearch && (
          <>
            <div className="mt-4 flex gap-3 items-center">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search movie name (e.g., Interstellar)"
                className="flex-1 bg-background/40 border border-border/20 rounded-full px-5 py-3 text-foreground placeholder:text-muted-foreground outline-none"
              />
              <button
                className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-black uppercase tracking-widest disabled:opacity-50"
                disabled={!searchTerm.trim() || status === "loading"}
                onClick={() => doSearch(searchTerm.trim())}
              >
                Search
              </button>
            </div>

            <div className="mt-4">
              {status === "loading" && (
                <div className="text-white/70">Searching...</div>
              )}
              {status === "error" && (
                <div className="text-red-300/90 font-bold">
                  Search failed.
                  {errorText && (
                    <pre className="mt-3 whitespace-pre-wrap text-[11px] text-red-200/90 font-mono">
                      {errorText}
                    </pre>
                  )}
                </div>
              )}
              {status === "ready" && results.length === 0 && (
                <div className="text-white/70">No results.</div>
              )}

              {status === "ready" && results.length > 0 && (
                <div className="grid gap-3">
                  {results.slice(0, 10).map((r) => (
                    <button
                      key={r.tmdb_id}
                      className="text-left rounded-[var(--radius)] bg-card/50 border border-border/10 p-3 hover:border-primary/40 transition-colors"
                      onClick={() => {
                        const newRoomId = String(Date.now());
                        onCreate(newRoomId, Number(r.tmdb_id));
                      }}
                    >
                      <div className="flex gap-3 items-center">
                        {r.images?.poster && (
                          <img
                            src={r.images.poster}
                            alt={r.title}
                            className="w-12 h-16 object-cover rounded-md"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-black">{r.title}</div>
                          <div className="text-xs text-muted-foreground">
                            Score: {r.metrics?.vote_average ?? "N/A"}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Slim red toast at the top when mouse is NOT locked. No blocking overlay. */
function EnterOverlay({
  controlsApiRef,
}: {
  controlsApiRef: React.MutableRefObject<any | null>;
}) {
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    const t = window.setInterval(() => {
      setLocked(Boolean(controlsApiRef.current?.isLocked));
    }, 200);
    return () => window.clearInterval(t);
  }, [controlsApiRef]);

  return (
    <div
      style={{
        pointerEvents: locked ? "none" : "auto",
        opacity: locked ? 0 : 1,
        transition: "opacity 0.3s ease",
      }}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-[250] flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-600/90 border border-red-400/60 backdrop-blur-sm shadow-lg cursor-pointer select-none"
      onClick={() => !locked && controlsApiRef.current?.lock?.()}
    >
      <span className="text-white text-sm font-bold tracking-wide">🖱 Click to walk — WASD to move</span>
    </div>
  );
}

/** Bottom-centre toast that shows a key hint when near a zone. */
function ProximityToast({ nearZone }: { nearZone: ZoneId | null }) {
  const hints: Record<ZoneId, string> = {
    north: 'Press T to play trailer',
    west:  'Press C for comments',
    east:  'Press I for movie info',
    south: 'Press A for CineBot AI',
  };

  const visible = nearZone !== null;
  const text = nearZone ? hints[nearZone] : '';

  return (
    <div
      style={{
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
      }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[240] px-6 py-3 rounded-full bg-black/80 border border-white/20 backdrop-blur-sm shadow-xl"
    >
      <span className="text-white text-sm font-semibold tracking-wide">{text}</span>
    </div>
  );
}

export const Space = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const movieId = useMemo(() => {
    const v = searchParams.get("movieId");
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }, [searchParams]);

  const roomId = useMemo(() => {
    const v = searchParams.get("roomId");
    return v ? String(v) : null;
  }, [searchParams]);

  const mode: Mode = useMemo(() => {
    if (roomId && movieId) return "watchparty";
    if (movieId && !roomId) return "solo";
    return "create-room";
  }, [movieId, roomId]);

  const [activeOverlay, setActiveOverlay] = useState<OverlayId>(null);
  const controlsApiRef = useRef<any | null>(null);
  const playerRef = useRef({ x: 0, y: PLAYER_Y, z: 0, yaw: 0 });
  const nearZoneRef = useRef<ZoneId | null>(null);

  const [guests, setGuests] = useState<
    Array<{ peerId: string; x: number; y: number; z: number; yaw: number }>
  >([]);

  const [nearZone, setNearZone] = useState<ZoneId | null>(null);

  const movementEnabled = mode !== "create-room" && !activeOverlay;
  const overlayOpen = Boolean(activeOverlay);

  const onCloseOverlay = useCallback(() => setActiveOverlay(null), []);
  const onZoneKey = useCallback(
    (zone: ZoneId) => {
      if (zone === "north") setActiveOverlay("trailer");
      if (zone === "west") setActiveOverlay("comments");
      if (zone === "east") setActiveOverlay("info");
      if (zone === "south") setActiveOverlay("ai");
    },
    [],
  );

  const createRoom = useCallback(
    (newRoomId: string, newMovieId: number) => {
      setSearchParams({
        roomId: newRoomId,
        movieId: String(newMovieId),
      });
      setActiveOverlay(null);
      setGuests([]);
    },
    [setSearchParams],
  );

  const world = (
    <Canvas
      shadows
      camera={{ position: [0, PLAYER_Y, 5], fov: 70 }}
      style={{ width: "100%", height: "100%" }}
    >
      <WorldFPS
        movementEnabled={movementEnabled}
        overlayOpen={overlayOpen}
        onZoneKey={onZoneKey}
        onCloseOverlay={onCloseOverlay}
        controlsApiRef={controlsApiRef}
        playerRef={playerRef}
        nearZoneRef={nearZoneRef}
        onNearZoneChange={setNearZone}
      />

      {/* Guests (multiplayer only) */}
      {mode === "watchparty" &&
        guests.map((g) => (
          <GuestBox key={g.peerId} x={g.x} y={g.y} z={g.z} yaw={g.yaw} />
        ))}

      {/* (placeholder) Broadcast + receive avatar state */}
      {mode === "watchparty" && roomId && (
        <WatchPartyAvatars
          roomId={roomId}
          playerRef={playerRef}
          setGuests={setGuests}
        />
      )}
    </Canvas>
  );

  const watchpartyShell =
    mode === "watchparty" && roomId && movieId ? (
      <SocketProvider enabled>
        {world}
        <WatchPartyMediaBar roomId={roomId} />
      </SocketProvider>
    ) : (
      world
    );

  // Create-room UX: show dialog before entering the room (no Canvas/pointer lock yet).
  if (mode === "create-room") {
    return (
      <div className="relative w-screen h-screen bg-neutral-900 overflow-hidden flex items-center justify-center">
        <CreateRoomOverlay onCreate={createRoom} />
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-neutral-900 overflow-hidden">
      {watchpartyShell}

      <EnterOverlay controlsApiRef={controlsApiRef} />
      <ProximityToast nearZone={nearZone} />

      {movieId && activeOverlay === "trailer" && (
        <TrailerOverlay movieId={movieId} onClose={onCloseOverlay} />
      )}
      {movieId && activeOverlay === "info" && (
        <MovieInfoOverlay movieId={movieId} onClose={onCloseOverlay} />
      )}
      {activeOverlay === "comments" && (
        <CommentsOverlay onClose={onCloseOverlay} />
      )}
      {activeOverlay === "ai" && (
        <AIChatOverlay mode={mode} onClose={onCloseOverlay} />
      )}
    </div>
  );
};


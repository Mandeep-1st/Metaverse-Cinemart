/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PointerLockControls } from "@react-three/drei";
import { TheatreRoom } from "../components/TheatreRoom";
import {
  BigTV,
  ChairsAndPeople,
  Cupboards,
  AIDoor,
} from "../components/TheatreProps";
import { AiModePanel, type AiModeId } from "@repo/ui/components/ai-mode-panel";
import { LoadingSpinner } from "@repo/ui/components/loading-spinner";
import { MovieRichDetails } from "@repo/ui/components/movie-rich-details";
import { PersistentCommentsPanel } from "@repo/ui/components/persistent-comments-panel";
import { SocketProvider, useSocket } from "../context/SocketProvider";
import { apiGet, apiPost } from "../utils/apiClient";
import type {
  Consumer,
  Device,
  Producer,
  Transport,
  RtpCapabilities,
} from "mediasoup-client/types";
import * as mediasoupClient from "mediasoup-client";
import { useSearchParams } from "react-router-dom";
import { CinemaScene } from "../space/Scene";
import {
  GRID_HALF,
  PLAYER_Y,
  ZONE_DISTANCE,
  clamp,
  isInsideAnyCollider,
  isTypingElement,
} from "../space/constants";
import type { GuestPresence } from "../space/types";

type ApiResponse<T> = {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
};

// ─── Add this constant OUTSIDE the component (top of file) ───
// Each zone is a rectangle the player cannot enter.
// Values are XZ bounds in world space. Tune the inset (10.5) if needed.
type MovieDetails = {
  tmdb_id: number;
  title: string;
  overview: string;
  images?: {
    poster?: string | null;
    backdrop?: string | null;
    logo?: string | null;
  };
  video?: {
    url: string;
    key: string;
    site: string;
    embedUrl?: string;
    name?: string;
    type?: string;
    official?: boolean;
    published_at?: string;
  };
  videos?: Array<{
    url: string;
    key: string;
    site: string;
    embedUrl?: string;
    name?: string;
    type?: string;
    official?: boolean;
    published_at?: string;
  }>;
  genres?: Array<{ id?: number; name?: string }> | Array<any>;
  credits?: {
    cast?: Array<{
      id?: number;
      name?: string;
      character?: string;
      profile_path?: string | null;
      order?: number;
    }>;
    crew?: Array<{
      id?: number;
      name?: string;
      job?: string;
      profile_path?: string | null;
    }>;
  };
  details?: {
    release_date?: string;
    runtime?: number;
  };
  metrics?: {
    vote_average?: number;
  };
};

type MovieVideo = NonNullable<MovieDetails["videos"]>[number];

type Mode = "solo" | "watchparty" | "create-room";
type ZoneId = "north" | "west" | "east" | "south";
type OverlayId = "trailer" | "comments" | "info" | "ai" | null;
type ViewerUser = {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  avatar?: string;
  profilePhoto?: string;
};

type MovieComment = {
  _id: string;
  username: string;
  fullName: string;
  avatar?: string;
  profilePhoto?: string;
  text: string;
  createdAt: string;
};

type RoomCreationPayload = {
  room: {
    roomId: string;
    movieTmdbId: number;
    aiMode: boolean;
  };
  shareLink: string;
};

type SearchMovieResult = {
  tmdb_id: number;
  title: string;
  overview?: string;
  images?: {
    poster?: string | null;
  };
  metrics?: {
    vote_average?: number;
  };
};

type RoomLookup = {
  roomId: string;
  movieTmdbId: number;
  aiMode: boolean;
};

type ViewerStatus = "loading" | "ready" | "guest";

const DEFAULT_WEB_MAIN_URL = "http://localhost:5173";

function toYouTubeEmbed(urlOrKey: string) {
  if (urlOrKey.startsWith("http")) {
    const u = new URL(urlOrKey);

    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.includes("/embed/")) {
        return urlOrKey;
      }

      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }

    if (u.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${u.pathname.replace("/", "")}`;
    }

    if (u.hostname.includes("player.vimeo.com")) {
      return urlOrKey;
    }

    if (u.hostname.includes("vimeo.com")) {
      return `https://player.vimeo.com/video/${u.pathname.replace("/", "")}`;
    }

    return urlOrKey;
  }

  return `https://www.youtube.com/embed/${urlOrKey}`;
}

function toEmbeddableVideoUrl(
  video?: {
    url?: string;
    key?: string;
    embedUrl?: string;
  } | null,
) {
  if (!video) return "";
  if (video.embedUrl) return video.embedUrl;
  if (video.url) return toYouTubeEmbed(video.url);
  if (video.key) return toYouTubeEmbed(video.key);
  return "";
}

function RoomStatusScreen({
  eyebrow,
  title,
  description,
  loading = false,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  loading?: boolean;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 py-10 text-white">
      <div className="w-full max-w-2xl rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(244,182,61,0.12),rgba(255,255,255,0.03))] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-10">
        <div className="text-[10px] font-black uppercase tracking-[0.38em] text-primary">
          {eyebrow}
        </div>
        <h1 className="mt-5 text-3xl font-black uppercase tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-white/65">
          {description}
        </p>

        {loading && (
          <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
            <LoadingSpinner className="h-4 w-4" />
            Working on it...
          </div>
        )}

        {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
      </div>
    </div>
  );
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
      document.removeEventListener("click", tryUnlock, true);
      document.removeEventListener("keydown", tryUnlock, true);
    });
  };
  document.addEventListener("click", tryUnlock, true);
  document.addEventListener("keydown", tryUnlock, true);
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
        const res = await apiGet<ApiResponse<MovieDetails>>(
          `/movies/${movieId}`,
        );
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

function mapMovieToRichDetails(movie: MovieDetails) {
  const actors = (movie.credits?.cast || [])
    .slice()
    .sort((left, right) => (left.order || 0) - (right.order || 0))
    .slice(0, 5)
    .map((actor) => ({
      id: actor.id,
      name: actor.name || "Unknown Actor",
      subtitle: actor.character || "Cast",
      image: actor.profile_path,
    }));

  const directorEntry = (movie.credits?.crew || []).find(
    (crewMember) => crewMember.job === "Director",
  );

  return {
    actors,
    director: directorEntry
      ? {
          id: directorEntry.id,
          name: directorEntry.name || "Unknown Director",
          subtitle: "Director",
          image: directorEntry.profile_path,
        }
      : null,
    genres: (movie.genres || [])
      .map((genre: any) => genre?.name)
      .filter(Boolean),
    releaseDate: movie.details?.release_date,
    runtime: movie.details?.runtime,
    rating: movie.metrics?.vote_average,
  };
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
      style={{
        position: "fixed",
        width: 0,
        height: 0,
        opacity: 0,
        pointerEvents: "none",
      }}
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
      <div className="w-full max-w-4xl max-h-[90vh] rounded-[var(--radius)] bg-card-foreground border border-border/20 p-5 shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2">
          {children}
        </div>
      </div>
    </div>
  );
}

function TrailerModal({
  videoUrl,
  onClose,
  playing,
  syncedTime,
  watchparty,
}: {
  videoUrl: string;
  onClose: () => void;
  playing: boolean;
  syncedTime: number;
  watchparty: boolean;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [localPlaying, setLocalPlaying] = useState(playing);
  const [localTime, setLocalTime] = useState(syncedTime);
  const paused = !localPlaying;

  useEffect(() => {
    setLocalPlaying(playing);
  }, [playing]);

  useEffect(() => {
    setLocalTime(syncedTime);
  }, [syncedTime]);

  useEffect(() => {
    const cw = iframeRef.current?.contentWindow;
    if (!cw) return;

    cw.postMessage(
      JSON.stringify({
        event: "command",
        func: "seekTo",
        args: [Math.max(0, syncedTime), true],
      }),
      "*",
    );

    cw.postMessage(
      JSON.stringify({
        event: "command",
        func: playing ? "playVideo" : "pauseVideo",
        args: [],
      }),
      "*",
    );
  }, [playing, syncedTime]);

  useEffect(() => {
    if (!localPlaying) return;

    const interval = window.setInterval(() => {
      setLocalTime((previous) => previous + 0.5);
    }, 500);

    return () => window.clearInterval(interval);
  }, [localPlaying]);

  const emitSyncUpdate = (nextState: { isPlaying: boolean; time: number }) => {
    if (!watchparty) return;

    window.dispatchEvent(
      new CustomEvent("trailer-state-update", {
        detail: nextState,
      }),
    );
  };

  const togglePause = () => {
    const cw = iframeRef.current?.contentWindow;
    if (!cw) return;

    const nextPlaying = !localPlaying;

    cw.postMessage(
      JSON.stringify({
        event: "command",
        func: nextPlaying ? "playVideo" : "pauseVideo",
        args: [],
      }),
      "*",
    );
    setLocalPlaying(nextPlaying);
    emitSyncUpdate({
      isPlaying: nextPlaying,
      time: localTime,
    });
  };

  const rewindTenSeconds = () => {
    const cw = iframeRef.current?.contentWindow;
    if (!cw) return;

    const nextTime = Math.max(0, localTime - 10);
    cw.postMessage(
      JSON.stringify({
        event: "command",
        func: "seekTo",
        args: [nextTime, true],
      }),
      "*",
    );
    setLocalTime(nextTime);
    emitSyncUpdate({
      isPlaying: localPlaying,
      time: nextTime,
    });
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 300,
        background: "rgba(0,0,0,0.95)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "min(98vw, 1920px)",
        }}
      >
        <span
          style={{
            color: "#fff",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            opacity: 0.6,
          }}
        >
          Now Playing — Trailer
        </span>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={rewindTenSeconds}
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              borderRadius: "999px",
              padding: "6px 20px",
              fontSize: "12px",
              cursor: "pointer",
              letterSpacing: "0.1em",
            }}
          >
            -10s
          </button>
          {/* Pause / Play */}
          <button
            onClick={togglePause}
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              borderRadius: "999px",
              padding: "6px 20px",
              fontSize: "12px",
              cursor: "pointer",
              letterSpacing: "0.1em",
              minWidth: "90px",
            }}
          >
            {paused ? "▶  Play" : "⏸  Pause"}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              borderRadius: "999px",
              padding: "6px 20px",
              fontSize: "12px",
              cursor: "pointer",
              letterSpacing: "0.1em",
            }}
          >
            ESC — Close
          </button>
        </div>
      </div>

      {/* Video — bigger: 98vw wide, 16:9 */}
      <iframe
        ref={iframeRef}
        title="Trailer"
        width="1200px"
        height="600px"
        src={`${videoUrl}?autoplay=1&controls=1&enablejsapi=1`}
        allow="autoplay; encrypted-media; fullscreen"
        allowFullScreen
        style={{
          border: "none",
          borderRadius: "8px",
          display: "block",
          boxShadow: "0 0 80px rgba(60,60,255,0.3)",
        }}
      />
      <div
        style={{
          color: "#fff",
          opacity: 0.7,
          fontSize: "12px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        Sync Time {localTime.toFixed(1)}s{" "}
        {watchparty ? "- Watch Party Sync" : "- Solo"}
      </div>
    </div>
  );
}

function SyncedTrailerModal({
  movieTitle,
  videos,
  selectedVideoKey,
  onSelectVideo,
  onClose,
  playing,
  syncedTime,
  watchparty,
}: {
  movieTitle?: string;
  videos: MovieVideo[];
  selectedVideoKey: string | null;
  onSelectVideo: (key: string) => void;
  onClose: () => void;
  playing: boolean;
  syncedTime: number;
  watchparty: boolean;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [localPlaying, setLocalPlaying] = useState(playing);
  const [localTime, setLocalTime] = useState(syncedTime);
  const selectedVideo = useMemo(
    () => videos.find((video) => video.key === selectedVideoKey) || null,
    [selectedVideoKey, videos],
  );
  const videoUrl = selectedVideo ? toEmbeddableVideoUrl(selectedVideo) : "";
  const canRemoteControl = selectedVideo?.site === "YouTube";

  useEffect(() => {
    setLocalPlaying(playing);
  }, [playing, selectedVideoKey]);

  useEffect(() => {
    setLocalTime(syncedTime);
  }, [syncedTime, selectedVideoKey]);

  useEffect(() => {
    if (!videoUrl || !canRemoteControl) return;

    const cw = iframeRef.current?.contentWindow;
    if (!cw) return;

    cw.postMessage(
      JSON.stringify({
        event: "command",
        func: "seekTo",
        args: [Math.max(0, syncedTime), true],
      }),
      "*",
    );

    cw.postMessage(
      JSON.stringify({
        event: "command",
        func: playing ? "playVideo" : "pauseVideo",
        args: [],
      }),
      "*",
    );
  }, [canRemoteControl, playing, syncedTime, videoUrl]);

  useEffect(() => {
    if (!localPlaying || !selectedVideo) return;

    const interval = window.setInterval(() => {
      setLocalTime((previous) => previous + 0.5);
    }, 500);

    return () => window.clearInterval(interval);
  }, [localPlaying, selectedVideo]);

  const emitSyncUpdate = (nextState: { isPlaying: boolean; time: number }) => {
    if (!watchparty) return;

    window.dispatchEvent(
      new CustomEvent("trailer-state-update", {
        detail: nextState,
      }),
    );
  };

  const togglePause = () => {
    if (!canRemoteControl) return;

    const cw = iframeRef.current?.contentWindow;
    if (!cw) return;

    const nextPlaying = !localPlaying;

    cw.postMessage(
      JSON.stringify({
        event: "command",
        func: nextPlaying ? "playVideo" : "pauseVideo",
        args: [],
      }),
      "*",
    );
    setLocalPlaying(nextPlaying);
    emitSyncUpdate({
      isPlaying: nextPlaying,
      time: localTime,
    });
  };

  const rewindTenSeconds = () => {
    if (!canRemoteControl) return;

    const cw = iframeRef.current?.contentWindow;
    if (!cw) return;

    const nextTime = Math.max(0, localTime - 10);
    cw.postMessage(
      JSON.stringify({
        event: "command",
        func: "seekTo",
        args: [nextTime, true],
      }),
      "*",
    );
    setLocalTime(nextTime);
    emitSyncUpdate({
      isPlaying: localPlaying,
      time: nextTime,
    });
  };

  return (
    <div className="absolute inset-0 z-[300] bg-black/95">
      <div className="mx-auto flex h-full w-full max-w-[1920px] flex-col gap-4 px-4 py-4 lg:px-6">
        <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-black/45 px-5 py-4 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.35em] text-white/50">
              Theatre Video Deck
            </div>
            <div className="mt-2 text-2xl font-black italic text-white">
              {selectedVideo?.name ||
                selectedVideo?.type ||
                movieTitle ||
                "Movie videos"}
            </div>
            <div className="mt-2 text-sm leading-6 text-white/55">
              {selectedVideo
                ? `${selectedVideo.site}${selectedVideo.type ? ` • ${selectedVideo.type}` : ""}`
                : videos.length > 0
                  ? "No explicit trailer was auto-selected. Choose a video from the list."
                  : "No playable videos are available for this title yet."}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={rewindTenSeconds}
              disabled={!canRemoteControl}
              className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              -10s
            </button>
            <button
              onClick={togglePause}
              disabled={!canRemoteControl}
              className="min-w-[100px] rounded-full border border-white/20 bg-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {localPlaying ? "Pause" : "Play"}
            </button>
            <button
              onClick={onClose}
              className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white"
            >
              ESC - Close
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-h-0 flex-col gap-4 rounded-[32px] border border-white/10 bg-black/45 p-4 backdrop-blur-xl">
            <div className="rounded-[28px] border border-white/10 bg-black/70 p-3">
              {selectedVideo && videoUrl ? (
                <iframe
                  key={selectedVideo.key}
                  ref={iframeRef}
                  title={selectedVideo.name || selectedVideo.type || "Trailer"}
                  src={`${videoUrl}${videoUrl.includes("?") ? "&" : "?"}autoplay=1&controls=1&enablejsapi=1`}
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                  className="h-[58vh] w-full rounded-[20px] border-0 xl:h-[68vh]"
                />
              ) : (
                <div className="flex h-[58vh] items-center justify-center rounded-[20px] bg-black/80 px-6 text-center xl:h-[68vh]">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.35em] text-[#f4b63d]">
                      Video selection
                    </div>
                    <div className="mt-4 text-3xl font-black italic text-white">
                      Choose what to play
                    </div>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-white/60">
                      This room keeps the existing playback controls, but it no
                      longer guesses the wrong trailer. Pick one of the
                      available clips from the panel on the right.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white/60">
              Sync time {localTime.toFixed(1)}s{" "}
              {watchparty ? "• Watch party sync enabled" : "• Solo mode"}
              {!canRemoteControl && selectedVideo && (
                <span className="block text-white/45">
                  Playback controls are optimized for YouTube embeds. This
                  selection can still be viewed here.
                </span>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-col rounded-[32px] border border-white/10 bg-black/45 p-4 backdrop-blur-xl">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.35em] text-[#f4b63d]">
                  Available Videos
                </div>
                <div className="mt-2 text-xl font-black text-white">
                  Select a clip
                </div>
              </div>
              <div className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-white/45">
                {videos.length}
              </div>
            </div>

            <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
              {videos.length > 0 ? (
                videos.map((video, index) => {
                  const isSelected = video.key === selectedVideoKey;
                  return (
                    <button
                      key={video.key}
                      type="button"
                      onClick={() => {
                        onSelectVideo(video.key);
                        setLocalTime(0);
                        setLocalPlaying(true);
                      }}
                      className={`w-full rounded-[24px] border p-4 text-left transition-all ${
                        isSelected
                          ? "border-[#f4b63d]/60 bg-[#f4b63d]/10 shadow-[0_18px_40px_rgba(244,182,61,0.12)]"
                          : "border-white/10 bg-white/[0.04] hover:border-white/20"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-[#f4b63d]">
                          {video.type || "Video"}
                        </span>
                        {video.official && (
                          <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-white/45">
                            Official
                          </span>
                        )}
                      </div>
                      <div className="mt-3 text-base font-black leading-6 text-white">
                        {video.name ||
                          `${movieTitle || "Movie"} clip ${index + 1}`}
                      </div>
                      <div className="mt-2 text-sm leading-6 text-white/50">
                        {video.site}
                        {video.published_at
                          ? ` • ${new Date(video.published_at).getFullYear()}`
                          : ""}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-[24px] border border-dashed border-white/10 p-5 text-sm leading-7 text-white/55">
                  No playable videos were returned for this movie.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
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
          <div className="text-3xl sm:text-4xl font-black italic">
            {movie.title}
          </div>
          {movie.images?.backdrop && (
            <img
              src={movie.images.backdrop}
              alt={movie.title}
              className="w-full max-h-56 object-cover rounded-[var(--radius)] border border-border/20"
            />
          )}
          <div className="text-muted-foreground leading-relaxed">
            {movie.overview}
          </div>
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

function ContextualCommentsOverlay({ onClose }: { onClose: () => void }) {
  return (
    <OverlayShell title="Comments / Chairs" onClose={onClose}>
      <div className="text-muted-foreground leading-relaxed">
        Live chat is available inside shared watch party rooms. Create or join a
        synced room to comment with the rest of the audience.
      </div>
    </OverlayShell>
  );
}

function RoomCommentsOverlay({
  onClose,
  currentUser,
}: {
  onClose: () => void;
  currentUser: ViewerUser | null;
}) {
  const socket = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!socket) return;

    const unsubscribeBootstrap = socket.onRoomBootstrap((data) => {
      setMessages(data?.chatMessages ?? []);
    });
    const unsubscribeMessage = socket.onChatMessage((message) => {
      setMessages((previous) => [...previous, message]);
    });
    const unsubscribeLike = socket.onChatMessageLiked((payload) => {
      setMessages((previous) =>
        previous.map((message) =>
          message.id === payload.messageId
            ? { ...message, likes: payload.likes }
            : message,
        ),
      );
    });

    return () => {
      unsubscribeBootstrap();
      unsubscribeMessage();
      unsubscribeLike();
    };
  }, [socket]);

  return (
    <OverlayShell title="Comments / Chairs" onClose={onClose}>
      <div className="grid gap-4">
        <div className="max-h-[50vh] overflow-y-auto pr-2 grid gap-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className="rounded-3xl border border-border/20 bg-card/30 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-black text-foreground">
                  {message.senderName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </div>
              </div>
              <div className="mt-3 text-muted-foreground leading-relaxed">
                {message.text}
              </div>
              <button
                onClick={() =>
                  socket.emit("chat-like", {
                    messageId: message.id,
                    senderId: currentUser?._id ?? "guest",
                  })
                }
                className="mt-4 text-sm text-primary"
              >
                Like {message.likes || 0}
              </button>
            </div>
          ))}

          {messages.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border/30 p-6 text-sm text-muted-foreground">
              No messages yet. Break the silence with the first comment.
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Send a room message"
            className="flex-1 rounded-full border border-border/20 bg-card/20 px-4 py-3 outline-none"
          />
          <button
            onClick={() => {
              if (!input.trim()) return;
              socket.emit("chat-send", {
                text: input.trim(),
                senderId: currentUser?._id ?? "guest",
                senderName:
                  currentUser?.fullName || currentUser?.username || "Guest",
              });
              setInput("");
            }}
            className="rounded-full bg-primary px-5 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary-foreground"
          >
            Send
          </button>
        </div>
      </div>
    </OverlayShell>
  );
}

function RoomAIChatOverlay({
  onClose,
  mode,
  movieId,
}: {
  onClose: () => void;
  mode: Mode;
  movieId: number | null;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "ai"; content: string }>
  >([
    {
      role: "ai",
      content:
        mode === "watchparty"
          ? "Ask me what this room should watch next, or ask about the current movie."
          : "Ask me about the movie, the cast, or what to watch next.",
    },
  ]);
  const [status, setStatus] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const nextInput = input.trim();
    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: nextInput,
      },
    ]);
    setInput("");
    setStatus("Thinking...");

    try {
      const response = movieId
        ? await apiPost<ApiResponse<{ role?: string; content?: string }>>(
            "/ai/context-chat",
            {
              movieId,
              question: nextInput,
            },
          )
        : await apiPost<ApiResponse<{ role?: string; content?: string }>>(
            "/ai/chat",
            {
              message: nextInput,
            },
          );

      setMessages((previous) => [
        ...previous,
        {
          role: "ai",
          content:
            response.data.content ||
            response.message ||
            "The AI room did not return a response.",
        },
      ]);
      setStatus("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "AI request failed.");
    }
  };

  return (
    <OverlayShell title="CineBot AI Desk" onClose={onClose}>
      <div className="grid gap-4">
        <div className="max-h-[50vh] overflow-y-auto pr-2 grid gap-3">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded-3xl border p-4 ${
                message.role === "ai"
                  ? "border-primary/20 bg-primary/5"
                  : "border-border/20 bg-card/20"
              }`}
            >
              <div className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">
                {message.role === "ai" ? "CineBot" : "You"}
              </div>
              <div className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {message.content}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about the movie or request a suggestion"
            className="flex-1 rounded-full border border-border/20 bg-card/20 px-4 py-3 outline-none"
          />
          <button
            onClick={sendMessage}
            className="rounded-full bg-primary px-5 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary-foreground"
          >
            Ask
          </button>
        </div>

        {status && (
          <div className="text-sm text-muted-foreground">{status}</div>
        )}
      </div>
    </OverlayShell>
  );
}

function VoteDock({
  roomId,
  movieId,
  visible,
}: {
  roomId: string;
  movieId: number | null;
  visible: boolean;
}) {
  const socket = useSocket();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const response = await apiGet<ApiResponse<any[]>>(
          `/rooms/${roomId}/recommendations`,
        );
        setRecommendations(response.data);
      } catch {
        if (!movieId) return;
        try {
          const fallback = await apiGet<ApiResponse<any[]>>(
            `/movies/${movieId}/related`,
          );
          setRecommendations(fallback.data);
        } catch {
          setRecommendations([]);
        }
      }
    };

    loadRecommendations();
  }, [movieId, roomId]);

  useEffect(() => {
    const unsubscribeBootstrap = socket.onRoomBootstrap((data) => {
      setVotes(data?.voteState ?? []);
    });
    const unsubscribeVotes = socket.onVoteState((data) => {
      setVotes(data ?? []);
    });

    return () => {
      unsubscribeBootstrap();
      unsubscribeVotes();
    };
  }, [socket]);

  if (!visible) return null;

  const winningVote = votes[0];

  return (
    <div className="absolute bottom-6 right-6 z-[245] pointer-events-auto group">
      <div className="w-[340px] rounded-[var(--radius)] border border-border/20 bg-background/80 p-4 backdrop-blur-2xl opacity-55 transition-opacity duration-300 group-hover:opacity-100">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-primary text-[10px] font-black uppercase tracking-[0.35em]">
              Vote Shelf
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Hover to vote on the next shared recommendation.
            </div>
          </div>
          {winningVote && (
            <div className="rounded-full border border-primary/20 px-3 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
              Leading {winningVote.count}
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-3">
          {recommendations.slice(0, 3).map((recommendation) => {
            const voteCount =
              votes.find(
                (vote) => vote.optionId === String(recommendation.tmdb_id),
              )?.count || 0;

            return (
              <div
                key={recommendation.tmdb_id}
                className="rounded-2xl border border-border/20 bg-card/20 p-3"
              >
                <div className="font-black text-sm text-foreground">
                  {recommendation.title}
                </div>
                <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
                  {recommendation.overview}
                </div>
                <button
                  onClick={() =>
                    socket.emit("vote-submit", {
                      optionId: String(recommendation.tmdb_id),
                      label: recommendation.title,
                    })
                  }
                  className="mt-3 rounded-full bg-primary px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary-foreground"
                >
                  Vote {voteCount > 0 ? `(${voteCount})` : ""}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PersistentMovieCommentsOverlay({
  movieId,
  onClose,
  currentUser,
}: {
  movieId: number;
  onClose: () => void;
  currentUser: ViewerUser | null;
}) {
  const [comments, setComments] = useState<MovieComment[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadComments = async () => {
      setLoading(true);
      try {
        const response = await apiGet<ApiResponse<MovieComment[]>>(
          `/movies/${movieId}/comments`,
        );
        if (!mounted) return;
        setComments(response.data);
      } catch {
        if (!mounted) return;
        setComments([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadComments();
    return () => {
      mounted = false;
    };
  }, [movieId]);

  const submitComment = async () => {
    if (!currentUser || !input.trim()) return;

    setSubmitting(true);
    setStatus("");
    try {
      const response = await apiPost<ApiResponse<MovieComment>>(
        `/movies/${movieId}/comments`,
        {
          text: input.trim(),
        },
      );
      setComments((previous) => [response.data, ...previous]);
      setInput("");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Unable to save comment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OverlayShell title="Movie Comments" onClose={onClose}>
      <PersistentCommentsPanel
        comments={comments}
        input={input}
        onInputChange={setInput}
        onSubmit={submitComment}
        submitting={submitting}
        composerDisabled={!currentUser}
        currentUser={
          currentUser
            ? {
                username: currentUser.username,
                fullName: currentUser.fullName,
                avatar: currentUser.avatar,
                profilePhoto: currentUser.profilePhoto,
              }
            : null
        }
        title="Persistent movie discussion"
        subtitle="These comments are stored with the movie and visible from both the movie page and the room."
        emptyMessage={
          loading
            ? "Loading comments..."
            : "No comments yet. Start the movie discussion."
        }
      />
      {!currentUser && (
        <div className="mt-4 text-sm text-amber-200">
          Sign in through the main app to post movie comments.
        </div>
      )}
      {status && <div className="mt-4 text-sm text-amber-200">{status}</div>}
    </OverlayShell>
  );
}

function RoomAiExperienceOverlay({
  onClose,
  movieId,
  movieTitle,
  currentUser,
}: {
  onClose: () => void;
  movieId: number | null;
  movieTitle?: string;
  currentUser: ViewerUser | null;
}) {
  const [selectedMode, setSelectedMode] = useState<AiModeId | null>(null);
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "ai"; content: string }>
  >([
    {
      role: "ai",
      content:
        "Choose how you want the AI to help before starting the conversation.",
    },
  ]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const introByMode: Record<AiModeId, string> = {
    suggest:
      "Tell me what you liked or disliked and I will suggest one movie that matches that feeling.",
    context:
      "Ask a contextual question about the current movie, its cast, plot, or direction.",
    chat: "Use simple chat for broader movie conversation and lightweight recommendations.",
  };

  const handleModeSelect = (mode: AiModeId) => {
    setSelectedMode(mode);
    setInput("");
    setStatus("");
    setMessages([
      {
        role: "ai",
        content: introByMode[mode],
      },
    ]);
  };

  const submitPrompt = async () => {
    if (!selectedMode || !input.trim()) return;
    if (!currentUser) {
      setStatus("Sign in through the main app to use AI features.");
      return;
    }

    const prompt = input.trim();
    setLoading(true);
    setStatus("");
    setInput("");
    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: prompt,
      },
    ]);

    try {
      let nextContent = "The AI room did not return a response.";

      if (selectedMode === "suggest") {
        if (!movieId) {
          nextContent = "This mode needs a movie context first.";
        } else {
          const response = await apiPost<
            ApiResponse<{ movieTitle?: string; reason?: string }>
          >("/ai/suggest", {
            movieId,
            feedback: prompt,
          });
          nextContent = response.data.movieTitle
            ? `${response.data.movieTitle}\n\n${response.data.reason || ""}`.trim()
            : response.message;
        }
      } else if (selectedMode === "context") {
        if (!movieId) {
          nextContent = "This mode needs a movie context first.";
        } else {
          const response = await apiPost<ApiResponse<{ content?: string }>>(
            "/ai/context-chat",
            {
              movieId,
              question: prompt,
            },
          );
          nextContent = response.data.content || response.message;
        }
      } else {
        const response = await apiPost<ApiResponse<{ content?: string }>>(
          "/ai/chat",
          {
            message: prompt,
          },
        );
        nextContent = response.data.content || response.message;
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "ai",
          content: nextContent,
        },
      ]);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "AI request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[240] flex items-center justify-center bg-black/80 p-5">
      <div className="h-[86vh] w-[90vw] max-w-[1500px] overflow-hidden rounded-[36px] border border-white/10 bg-accent-foreground shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
              Room AI
            </div>
            <div className="mt-2 text-xl font-black italic text-white">
              {movieTitle ? `${movieTitle} AI Desk` : "AI Desk"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/75"
          >
            Close
          </button>
        </div>

        <div className="h-[calc(86vh-81px)] overflow-y-auto p-6">
          <AiModePanel
            title="Choose how the AI should help"
            subtitle="The same three-mode AI flow is embedded directly inside the room, so nobody has to leave the theatre."
            selectedMode={selectedMode}
            onSelectMode={handleModeSelect}
            messages={messages}
            input={input}
            onInputChange={setInput}
            onSubmit={submitPrompt}
            loading={loading}
            status={status}
          />
        </div>
      </div>
    </div>
  );
}

function RichMovieInfoOverlay({
  movieId,
  onClose,
}: {
  movieId: number;
  onClose: () => void;
}) {
  const { movie, status } = useMovieDetails(movieId);

  if (status === "loading") {
    return (
      <OverlayShell title="Movie Info" onClose={onClose}>
        <div className="text-white/80">Loading rich movie details...</div>
      </OverlayShell>
    );
  }

  if (status === "error" || !movie) {
    return (
      <OverlayShell title="Movie Info" onClose={onClose}>
        <div className="text-red-300/90 font-bold">
          Movie metadata could not be loaded.
        </div>
      </OverlayShell>
    );
  }

  const details = mapMovieToRichDetails(movie);

  return (
    <div className="absolute inset-0 z-[220] flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-[var(--radius)] bg-accent-foreground border border-border/20 p-5 shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="font-black uppercase tracking-widest text-primary text-sm">
            Movie Info
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-card border border-border/20 hover:border-primary/40"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <MovieRichDetails
            title={movie.title}
            overview={movie.overview}
            genres={details.genres}
            releaseDate={details.releaseDate}
            runtime={details.runtime}
            rating={details.rating}
            director={details.director}
            actors={details.actors}
            poster={movie.images?.poster}
            compact
          />
        </div>
      </div>
    </div>
  );
}

function RoomChatDrawer({
  visible,
  currentUser,
  viewerStatus,
}: {
  visible: boolean;
  currentUser: ViewerUser | null;
  viewerStatus: ViewerStatus;
}) {
  const socket = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsubscribeBootstrap = socket.onRoomBootstrap((data) => {
      setMessages(data?.chatMessages ?? []);
    });
    const unsubscribeMessage = socket.onChatMessage((message) => {
      setMessages((previous) => [...previous, message]);
    });

    return () => {
      unsubscribeBootstrap();
      unsubscribeMessage();
    };
  }, [socket]);

  if (!visible) return null;

  return (
    <div className="absolute bottom-6 right-6 z-[245] pointer-events-auto">
      <div
        className={`flex transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-[372px]"
        }`}
      >
        <button
          onClick={() => setOpen((previous) => !previous)}
          className="mr-3 self-end rounded-full border border-border/20 bg-primary/80 px-4 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-white backdrop-blur-xl"
        >
          {open ? "Hide Chat" : "User Chat"}
        </button>

        <div className="w-[340px] rounded-[32px] border border-white/10 bg-card-foreground p-4 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-primary text-[10px] font-black uppercase tracking-[0.35em]">
                User Chat
              </div>
              <div className="mt-2 text-sm text-white/60">
                Real-time room conversation for people inside this watch party.
              </div>
            </div>
            <div className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-white/45">
              Live
            </div>
          </div>

          <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto pr-1">
            {messages.map((message) => (
              <div
                key={message.id}
                className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-black text-white">
                    {message.senderName}
                  </div>
                  <div className="text-xs text-white/35">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </div>
                </div>
                <div className="mt-2 text-sm leading-6 text-white/65">
                  {message.text}
                </div>
              </div>
            ))}

            {messages.length === 0 && (
              <div className="rounded-[24px] border border-dashed border-white/10 p-5 text-sm text-white/50">
                Nobody has said anything in the room yet.
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                viewerStatus === "loading"
                  ? "Checking your main-app session..."
                  : currentUser
                  ? "Send a live room message"
                  : "Sign in through the main app to chat"
              }
              disabled={viewerStatus === "loading" || !currentUser}
              className="flex-1 rounded-full border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 disabled:opacity-50"
            />
            <button
              onClick={() => {
                if (!input.trim()) return;
                socket.emit("chat-send", {
                  text: input.trim(),
                  senderId: currentUser?._id ?? "guest",
                  senderName:
                    currentUser?.fullName || currentUser?.username || "Guest",
                });
                setInput("");
              }}
              disabled={viewerStatus === "loading" || !currentUser || !input.trim()}
              className="rounded-full bg-primary px-4 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary-foreground disabled:opacity-50"
            >
              Send
            </button>
          </div>

          {viewerStatus === "loading" && (
            <div className="mt-3 flex items-center gap-2 text-xs text-white/45">
              <LoadingSpinner className="h-3.5 w-3.5" />
              Restoring your signed-in session before chat unlocks.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WatchPartyAvatars({
  roomId,
  playerRef,
  setGuests,
  avatarId,
}: {
  roomId: string;
  playerRef: React.MutableRefObject<{
    x: number;
    y: number;
    z: number;
    yaw: number;
  }>;
  setGuests: React.Dispatch<React.SetStateAction<GuestPresence[]>>;
  avatarId?: string | null;
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
      const nextAvatarId =
        typeof data.avatarId === "string" ? data.avatarId : null;
      setGuests((prev) => {
        const filtered = prev.filter((p) => p.peerId !== peerId);
        return [...filtered, { peerId, x, y, z, yaw, avatarId: nextAvatarId }];
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
      socket.emit("avatar-sync", { roomId, x, y, z, rY: yaw, avatarId });
    }, 100);

    return () => {
      window.clearInterval(interval);
      emittingRef.current = false;
    };
  }, [avatarId, roomId, playerRef, socket]);

  return null;
}

function WatchPartyMediaBar({
  roomId,
  onSyncTrailer,
  onSyncModal,
}: {
  roomId: string;
  onSyncTrailer: (playing: boolean, time: number) => void;
  onSyncModal: (open: boolean) => void;
}) {
  const socket = useSocket();

  const [status, setStatus] = useState("Initializing...");
  const [remoteMedia, setRemoteMedia] = useState<
    Array<{
      producerId: string;
      consumerId: string;
      kind: "video" | "audio";
      stream: MediaStream;
    }>
  >([]);

  // ── NEW ──
  const [hidden, setHidden] = useState(false);

  const pendingProducers = useRef<string[]>([]);
  const deviceRef = useRef<Device | null>(null);
  const producerTransportRef = useRef<Transport | null>(null);
  const consumerTransportRef = useRef<Transport | null>(null);
  const recvTransportInitPromiseRef = useRef<Promise<Transport | null> | null>(
    null,
  );

  const localVideoStreamRef = useRef<MediaStream | null>(null);
  const localAudioStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  const videoProducerRef = useRef<Producer | null>(null);
  const audioProducerRef = useRef<Producer | null>(null);

  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);

  const createDevice = useCallback(async () => {
    if (deviceRef.current) return deviceRef.current;
    const rtpCaps =
      await socket.sendRequest<RtpCapabilities>("getRtpCapabilities");
    const device = new mediasoupClient.Device() as Device;
    await device.load({ routerRtpCapabilities: rtpCaps });
    deviceRef.current = device;
    return device;
  }, [socket]);

  const getOrCreateRecvTransport = useCallback(async () => {
    if (consumerTransportRef.current) return consumerTransportRef.current;
    if (!deviceRef.current) return null;
    if (recvTransportInitPromiseRef.current)
      return recvTransportInitPromiseRef.current;

    recvTransportInitPromiseRef.current = (async () => {
      const transportParams: any = await socket.sendRequest(
        "createWebRtcTransport",
        {
          sender: false,
        },
      );
      const transport = deviceRef.current!.createRecvTransport(transportParams);
      transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
        try {
          await socket.sendRequest("transport-recv-connect", {
            dtlsParameters,
          });
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
    if (!deviceRef.current) return;
    if (!consumerTransportRef.current) {
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
        await getOrCreateRecvTransport();
        if (!mounted) return;
        await flushPending();
      } catch {
        if (!mounted) return;
        setStatus("Failed to init mediasoup.");
      }
    };

    const unsubExisting = socket.onExistingProducers((producers) => {
      producers.forEach((p: any) =>
        pendingProducers.current.push(p.producerId),
      );
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

  useEffect(() => {
    const unsubTrailer = socket.onTrailerState((data: any) => {
      if (!data) return;
      const passedTime = data.isPlaying
        ? (Date.now() - data.updatedAt) / 1000
        : 0;
      onSyncTrailer(data.isPlaying, data.time + passedTime);

      // ── NEW: sync modal open/close from server state ──
      if (typeof data.modalOpen === "boolean") {
        onSyncModal(data.modalOpen);
      }
    });

    // Trailer play/pause toggle (already existed)
    const handleStateUpdate = (e: any) =>
      socket.emit("trailer-update", e.detail ?? {});

    // ── NEW: listen for modal open/close dispatched locally ──
    const handleModal = (e: any) =>
      socket.emit("trailer-update", { modalOpen: e.detail });

    window.addEventListener("trailer-state-update", handleStateUpdate);
    window.addEventListener("trailer-modal", handleModal);

    return () => {
      unsubTrailer();
      window.removeEventListener("trailer-state-update", handleStateUpdate);
      window.removeEventListener("trailer-modal", handleModal);
    };
  }, [socket, onSyncTrailer, onSyncModal]);

  const getOrCreateSendTransport = useCallback(async () => {
    if (producerTransportRef.current) return producerTransportRef.current;
    if (!deviceRef.current) await createDevice();

    const params: any = await socket.sendRequest("createWebRtcTransport", {
      sender: true,
    });
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
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      },
      audio: false,
    });
    localVideoStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    const track = stream.getVideoTracks()[0];
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
    audioProducerRef.current = await transport.produce({ track });
    setIsAudioOn(true);
  }, [getOrCreateSendTransport, isAudioOn]);

  const stopVideo = useCallback(async () => {
    const producer = videoProducerRef.current;
    if (producer) {
      const id = producer.id;
      try {
        producer.close();
      } catch {}
      videoProducerRef.current = null;
      socket.emit("producer-close", { producerId: id });
    }
    const stream = localVideoStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      localVideoStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    setIsVideoOn(false);
  }, [socket]);

  const stopAudio = useCallback(async () => {
    const producer = audioProducerRef.current;
    if (producer) {
      const id = producer.id;
      try {
        producer.close();
      } catch {}
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
      {/* ── Toggle button — always visible ── */}
      <div
        className={`pointer-events-auto flex justify-between items-center px-6 py-3 bg-neutral-950/70 backdrop-blur-xl ${
          hidden ? "border-b border-border/20" : ""
        }`}
      >
        <div className="text-sm font-black uppercase tracking-widest text-primary">
          Watch Party
        </div>
        <button
          onClick={() => setHidden((h) => !h)}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-neutral-900/80 border border-border/20 hover:border-primary/40 transition-all text-white/70 hover:text-white"
        >
          {hidden ? "👁 Show" : "✕ Hide"}
        </button>
      </div>

      {/* ── Collapsible panel ── */}
      {!hidden && (
        <div className="pointer-events-auto bg-neutral-950/70 border-b border-border/20 backdrop-blur-xl p-3">
          <div className="flex items-center justify-end mb-2">
            <div className="text-xs text-white/70 truncate">{status}</div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1">
            {/* Local feed */}
            <div className="min-w-55 w-55 rounded-xl border border-border/20 bg-neutral-900 p-2">
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
                    isVideoOn
                      ? "bg-neutral-700/80 hover:bg-neutral-600"
                      : "bg-red-600 hover:bg-red-500"
                  }`}
                  onClick={() => (isVideoOn ? stopVideo() : startVideo())}
                >
                  {isVideoOn ? "Stop Camera" : "Start Camera"}
                </button>
                <button
                  className={`flex-1 px-3 py-2 rounded-full text-xs font-black uppercase tracking-widest ${
                    isAudioOn
                      ? "bg-neutral-700/80 hover:bg-neutral-600"
                      : "bg-red-600 hover:bg-red-500"
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
                  className="min-w-55 w-55 rounded-xl border border-border/20 bg-neutral-900 p-2"
                >
                  <div className="text-xs font-bold text-white/80 mb-2">
                    Guest
                  </div>
                  <div className="w-full aspect-video rounded-lg overflow-hidden bg-black border border-border/10">
                    <RemoteVideo stream={m.stream} />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Audio always runs regardless of hidden state */}
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
  videoUrl,
  isPlaying,
  trailerTime,
  tvOverlayRef,
}: {
  movementEnabled: boolean;
  overlayOpen: boolean;
  onZoneKey: (zone: ZoneId) => void;
  onCloseOverlay: () => void;
  controlsApiRef: React.MutableRefObject<any | null>;
  playerRef: React.MutableRefObject<{
    x: number;
    y: number;
    z: number;
    yaw: number;
  }>;
  nearZoneRef: React.MutableRefObject<ZoneId | null>;
  onNearZoneChange: (zone: ZoneId | null) => void;
  videoUrl?: string;
  isPlaying?: boolean;
  trailerTime?: number;
  tvOverlayRef: React.MutableRefObject<HTMLDivElement | null>;
}) {
  const controlsRef = useRef<any>(null);
  const keysRef = useRef({ w: false, a: false, s: false, d: false });
  const [nearZone, setNearZone] = useState<ZoneId | null>(null);

  useEffect(() => {
    controlsApiRef.current = controlsRef.current;
  }, [controlsApiRef]);

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

  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  const tvCorners = useMemo(
    () => [
      new THREE.Vector3(-12, 11.4, -12.2), // top-left
      new THREE.Vector3(12, 11.4, -12.2), // top-right
      new THREE.Vector3(12, -1.6, -12.2), // bottom-right
      new THREE.Vector3(-12, -1.6, -12.2), // bottom-left
    ],
    [],
  );

  // Reusable projected vectors — no allocations per frame
  const tvProj = useMemo(
    () => tvCorners.map(() => new THREE.Vector3()),
    [tvCorners],
  );

  useFrame((state, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const obj = controls.getObject?.();
    if (!obj) return;

    if (obj.position.x === 0 && obj.position.z === 0) {
      obj.position.set(0, PLAYER_Y, 0);
    }

    // ── Proximity detection ──
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

    // ── Movement ──
    if (!movementEnabled) return;
    if (overlayOpen) return;
    if (!controls.isLocked) return;

    state.camera.getWorldDirection(forward);
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
    const rawX = clamp(
      obj.position.x + vx * speed * delta,
      -GRID_HALF,
      GRID_HALF,
    );
    const rawZ = clamp(
      obj.position.z + vz * speed * delta,
      -GRID_HALF,
      GRID_HALF,
    );

    // ── Sliding collision ──
    // Try full move → try X only → try Z only → fully blocked
    if (!isInsideAnyCollider(rawX, rawZ)) {
      obj.position.x = rawX;
      obj.position.z = rawZ;
    } else if (!isInsideAnyCollider(rawX, obj.position.z)) {
      obj.position.x = rawX; // slide along X wall
    } else if (!isInsideAnyCollider(obj.position.x, rawZ)) {
      obj.position.z = rawZ; // slide along Z wall
    }
    // else: corner blocked, stay put

    obj.position.y = PLAYER_Y;

    // ── Mirror into playerRef for avatar sync ──
    playerRef.current = {
      x: obj.position.x,
      y: PLAYER_Y,
      z: obj.position.z,
      yaw: obj.rotation.y,
    };

    // ── Project TV corners → update overlay div directly (no re-render) ──
    if (tvOverlayRef.current) {
      const el = tvOverlayRef.current;

      // Project each corner from world → NDC → CSS pixels
      const xs: number[] = [];
      const ys: number[] = [];
      tvCorners.forEach((c, i) => {
        tvProj[i].copy(c).project(state.camera);
        xs.push(((tvProj[i].x + 1) / 2) * state.size.width);
        ys.push(((-tvProj[i].y + 1) / 2) * state.size.height);
      });

      const left = Math.min(...xs);
      const top = Math.min(...ys);
      const width = Math.max(...xs) - left;
      const height = Math.max(...ys) - top;

      // Is the TV behind the camera? (any z > 1 in NDC = behind)
      const behind = tvProj.some((v) => v.z > 1);

      if (behind) {
        el.style.opacity = "0";
      } else {
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
        el.style.width = `${width}px`;
        el.style.height = `${height}px`;
        el.style.opacity = "1";
      }
    }
  });

  return (
    <>
      <PointerLockControls ref={controlsRef} />
      <TheatreRoom />

      {/* ── Lighting ── */}
      {/* Warm ambient base */}
      <ambientLight intensity={0.6} color="#ffe8cc" />
      {/* Cool fill from above */}
      <hemisphereLight color="#334466" groundColor="#110800" intensity={0.8} />
      {/* Main ceiling spotlight — warm white */}
      <pointLight
        position={[0, 12, 0]}
        intensity={6}
        color="#fff5e0"
        castShadow
        distance={40}
        decay={2}
      />
      {/* Four corner uplights for depth */}
      <pointLight
        position={[-10, 2, -10]}
        intensity={2}
        color="#ff6644"
        distance={18}
        decay={2}
      />
      <pointLight
        position={[10, 2, -10]}
        intensity={2}
        color="#ff6644"
        distance={18}
        decay={2}
      />
      <pointLight
        position={[-10, 2, 10]}
        intensity={1.5}
        color="#4466ff"
        distance={18}
        decay={2}
      />
      <pointLight
        position={[10, 2, 10]}
        intensity={1.5}
        color="#4466ff"
        distance={18}
        decay={2}
      />
      {/* Soft directional for shadows */}
      <directionalLight position={[4, 10, 4]} intensity={1.2} castShadow />

      {/* ── Decorative wall sconces — north wall (either side of TV) ── */}
      {[-10, 10].map((x, i) => (
        <group key={i} position={[x, 5, -11.5]}>
          <mesh>
            <boxGeometry args={[0.3, 1.2, 0.3]} />
            <meshStandardMaterial
              color="#1a1a1a"
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <coneGeometry args={[0.3, 0.5, 12, 1, true]} />
            <meshStandardMaterial
              color="#c9a84c"
              metalness={1}
              roughness={0.2}
              side={2}
            />
          </mesh>
          <pointLight
            position={[0, 1.0, 0]}
            color="#ffddaa"
            intensity={2}
            distance={8}
            decay={2}
          />
        </group>
      ))}

      {/* ── Ceiling cove lights strip — runs around perimeter ── */}
      {[
        [0, 11.5, -11], // north
        [0, 11.5, 11], // south
        [-11, 11.5, 0], // west
        [11, 11.5, 0], // east
      ].map(([cx, cy, cz], i) => (
        <pointLight
          key={i}
          position={[cx, cy, cz]}
          color="#ff4422"
          intensity={1.2}
          distance={14}
          decay={2}
        />
      ))}

      {/* ── Floor accent lights ── */}
      {[
        [-11, -0.5, -11],
        [11, -0.5, -11],
        [-11, -0.5, 11],
        [11, -0.5, 11],
      ].map(([fx, fy, fz], i) => (
        <pointLight
          key={i}
          position={[fx, fy, fz]}
          color="#221133"
          intensity={1.5}
          distance={10}
          decay={2}
        />
      ))}

      {/* ── Props ── */}
      <BigTV
        position={[0, 0.9, -12]}
        isActive={nearZone === "north"}
        videoUrl={videoUrl}
        isPlaying={isPlaying}
        trailerTime={trailerTime}
      />
      <ChairsAndPeople
        position={[-12, 0.9, 0]}
        rotation={[0, Math.PI / 2, 0]}
        isActive={nearZone === "west"}
      />
      <Cupboards
        position={[12, 0.9, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        isActive={nearZone === "east"}
      />
      <AIDoor
        position={[0, 0.9, 12]}
        rotation={[0, Math.PI, 0]}
        isActive={nearZone === "south"}
      />
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
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "ready">(
    "idle",
  );
  const [errorText, setErrorText] = useState<string | null>(null);
  const [results, setResults] = useState<Array<any>>([]);

  const doSearch = useCallback(async (q: string) => {
    setStatus("loading");
    setErrorText(null);
    try {
      const res = await apiGet<ApiResponse<any[]>>(`/movies/search`, {
        query: q,
      } as any);
      setResults(res.data ?? []);
      setStatus("ready");
    } catch (e: unknown) {
      setStatus("error");
      const base =
        import.meta.env.VITE_HTTP_SERVER_URL || "http://localhost:8001";
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

function PersistentCreateRoomOverlay({
  currentUser,
  viewerStatus,
  onCreate,
}: {
  currentUser: ViewerUser | null;
  viewerStatus: ViewerStatus;
  onCreate: (roomId: string, movieId: number, aiMode: boolean) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "ready">(
    "idle",
  );
  const [errorText, setErrorText] = useState<string | null>(null);
  const [results, setResults] = useState<SearchMovieResult[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<SearchMovieResult | null>(
    null,
  );
  const [roomLabel, setRoomLabel] = useState("");
  const [aiMode, setAiMode] = useState(false);
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [maxParticipants, setMaxParticipants] = useState(8);
  const [createdRoom, setCreatedRoom] = useState<RoomCreationPayload | null>(
    null,
  );
  const [creating, setCreating] = useState(false);

  const doSearch = useCallback(async (query: string) => {
    setStatus("loading");
    setErrorText(null);
    try {
      const res = await apiGet<ApiResponse<SearchMovieResult[]>>(
        "/movies/search",
        {
          query,
        } as any,
      );
      setResults(res.data ?? []);
      setStatus("ready");
    } catch (error) {
      setStatus("error");
      setErrorText(
        error instanceof Error ? error.message : "Movie search failed.",
      );
    }
  }, []);

  const createRoom = useCallback(async () => {
    if (!selectedMovie) return;

    setCreating(true);
    setErrorText(null);
    try {
      const response = await apiPost<ApiResponse<RoomCreationPayload>>(
        "/rooms",
        {
          movieId: selectedMovie.tmdb_id,
          label: roomLabel.trim() || `${selectedMovie.title} Watch Party`,
          aiMode,
          visibility,
          maxParticipants,
          allowChat: true,
          allowVoice: true,
          allowVoting: true,
        },
      );

      setCreatedRoom(response.data);
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Room creation failed.",
      );
    } finally {
      setCreating(false);
    }
  }, [aiMode, maxParticipants, roomLabel, selectedMovie, visibility]);

  const webMainUrl = import.meta.env.VITE_WEB_MAIN_URL || DEFAULT_WEB_MAIN_URL;

  return (
    <div className="absolute inset-0 z-[210] flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-4xl rounded-[var(--radius)] bg-background/90 border border-border/20 p-6 shadow-2xl">
        <div className="text-2xl font-black italic text-foreground mb-2">
          Create a Watch Party
        </div>
        <div className="text-muted-foreground leading-relaxed">
          Search, configure, and generate a persistent share link for the room.
        </div>

        {viewerStatus === "loading" && (
          <div className="mt-6 rounded-3xl border border-white/10 bg-card/20 p-6">
            <div className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.35em] text-primary">
              <LoadingSpinner className="h-4 w-4" />
              Restoring Session
            </div>
            <div className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Checking your saved account before we decide whether this page needs
              a sign-in prompt.
            </div>
          </div>
        )}

        {viewerStatus === "guest" && !currentUser && (
          <div className="mt-6 rounded-3xl border border-dashed border-border/30 bg-card/20 p-6">
            <div className="text-sm font-black uppercase tracking-[0.35em] text-primary">
              Sign In Required
            </div>
            <div className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Room creation uses your saved account so the owner, avatar, and
              share link stay consistent across the main app and theatre.
            </div>
            <button
              onClick={() => window.location.assign(`${webMainUrl}/login`)}
              className="mt-5 rounded-full bg-primary px-5 py-3 text-[10px] font-black uppercase tracking-[0.35em] text-primary-foreground"
            >
              Open Login
            </button>
          </div>
        )}

        {viewerStatus === "ready" && currentUser && !createdRoom && (
          <>
            <div className="mt-4 flex gap-3 items-center">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
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

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                {status === "loading" && (
                  <div className="text-white/70">Searching...</div>
                )}
                {status === "error" && errorText && (
                  <div className="text-red-300/90 font-bold">{errorText}</div>
                )}
                {status === "ready" && results.length === 0 && (
                  <div className="text-white/70">No results.</div>
                )}

                {status === "ready" && results.length > 0 && (
                  <div className="grid gap-3">
                    {results.slice(0, 10).map((result) => (
                      <button
                        key={result.tmdb_id}
                        className={`text-left rounded-[var(--radius)] border p-3 transition-colors ${
                          selectedMovie?.tmdb_id === result.tmdb_id
                            ? "border-primary/60 bg-card/70"
                            : "bg-card/50 border-border/10 hover:border-primary/40"
                        }`}
                        onClick={() => {
                          setSelectedMovie(result);
                          setRoomLabel(`${result.title} Watch Party`);
                          setCreatedRoom(null);
                        }}
                      >
                        <div className="flex gap-3 items-center">
                          {result.images?.poster && (
                            <img
                              src={result.images.poster}
                              alt={result.title}
                              className="w-12 h-16 object-cover rounded-md"
                            />
                          )}
                          <div className="flex-1">
                            <div className="font-black">{result.title}</div>
                            <div className="text-xs text-muted-foreground">
                              Score: {result.metrics?.vote_average ?? "N/A"}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-[var(--radius)] border border-border/20 bg-card/20 p-5">
                <div className="text-sm font-black uppercase tracking-[0.35em] text-primary">
                  Configure
                </div>

                {selectedMovie ? (
                  <div className="mt-5 space-y-4">
                    <div>
                      <div className="font-black text-lg">
                        {selectedMovie.title}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        TMDB score{" "}
                        {selectedMovie.metrics?.vote_average ?? "N/A"}
                      </div>
                    </div>
                    <input
                      value={roomLabel}
                      onChange={(event) => setRoomLabel(event.target.value)}
                      placeholder="Room label"
                      className="w-full rounded-xl border border-border/20 bg-background/30 px-4 py-3 outline-none"
                    />
                    <select
                      value={visibility}
                      onChange={(event) =>
                        setVisibility(
                          event.target.value as "private" | "public",
                        )
                      }
                      className="w-full rounded-xl border border-border/20 bg-background/30 px-4 py-3 outline-none"
                    >
                      <option value="private">Private</option>
                      <option value="public">Public</option>
                    </select>
                    <input
                      type="number"
                      min={2}
                      max={50}
                      value={maxParticipants}
                      onChange={(event) =>
                        setMaxParticipants(Number(event.target.value))
                      }
                      className="w-full rounded-xl border border-border/20 bg-background/30 px-4 py-3 outline-none"
                    />
                    <label className="flex items-center gap-3 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={aiMode}
                        onChange={(event) => setAiMode(event.target.checked)}
                      />
                      Launch as AI room
                    </label>
                    <button
                      onClick={createRoom}
                      disabled={creating}
                      className="w-full rounded-full bg-primary px-5 py-3 text-[10px] font-black uppercase tracking-[0.35em] text-primary-foreground disabled:opacity-60"
                    >
                      {creating ? "Creating..." : "Create Share Link"}
                    </button>
                    {errorText && (
                      <div className="text-sm text-red-300/90">{errorText}</div>
                    )}
                  </div>
                ) : (
                  <div className="mt-5 text-sm text-muted-foreground leading-relaxed">
                    Pick a movie from the search results to configure the room.
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {viewerStatus === "ready" && currentUser && createdRoom && (
          <div className="mt-8 rounded-[var(--radius)] border border-primary/20 bg-primary/5 p-6">
            <div className="text-primary text-[10px] font-black uppercase tracking-[0.35em]">
              Share Link Ready
            </div>
            <div className="mt-4 break-all text-lg text-foreground">
              {createdRoom.shareLink}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() =>
                  navigator.clipboard.writeText(createdRoom.shareLink)
                }
                className="rounded-full border border-border/20 px-5 py-3 text-[10px] font-black uppercase tracking-[0.3em]"
              >
                Copy Link
              </button>
              <button
                onClick={() =>
                  onCreate(
                    createdRoom.room.roomId,
                    createdRoom.room.movieTmdbId,
                    createdRoom.room.aiMode,
                  )
                }
                className="rounded-full bg-primary px-5 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary-foreground"
              >
                Enter Room
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Slim red toast at the top when mouse is NOT locked. No blocking overlay. */
function GuidedEnterOverlay({
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
      className="absolute top-4 left-1/2 -translate-x-1/2 z-[250] flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-600/40 border border-amber-400/30 backdrop-blur-sm shadow-lg cursor-pointer select-none"
      onClick={() => !locked && controlsApiRef.current?.lock?.()}
    >
      <span className="text-amber-50 text-sm font-bold tracking-wide">
        🖱 Click to walk — WASD to move
      </span>
    </div>
  );
}

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
      <span className="text-white text-sm font-bold tracking-wide">
        🖱 Click to walk — WASD to move
      </span>
    </div>
  );
}

const legacySpaceComponents = [
  TrailerModal,
  MovieInfoOverlay,
  CommentsOverlay,
  ContextualCommentsOverlay,
  RoomCommentsOverlay,
  RoomAIChatOverlay,
  VoteDock,
  WorldFPS,
  CreateRoomOverlay,
  EnterOverlay,
];
void legacySpaceComponents;

/** Bottom-centre toast that shows a key hint when near a zone. */
function ProximityToast({ nearZone }: { nearZone: ZoneId | null }) {
  const hints: Record<ZoneId, string> = {
    north: "Trailer is playing on the Big TV!",
    west: "Press C for comments",
    east: "Press I for movie info",
    south: "Press A for CineBot AI",
  };

  const visible = nearZone !== null;
  const text = nearZone ? hints[nearZone] : "";

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
      <span className="text-white text-sm font-semibold tracking-wide">
        {text}
      </span>
    </div>
  );
}

export const Space = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  // Add this ref in Space component body
  const tvOverlayRef = useRef<HTMLDivElement>(null);
  const searchMovieId = useMemo(() => {
    const v = searchParams.get("movieId");
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }, [searchParams]);

  const roomId = useMemo(() => {
    const v = searchParams.get("roomId");
    return v ? String(v) : null;
  }, [searchParams]);

  const [resolvedRoom, setResolvedRoom] = useState<RoomLookup | null>(null);
  const [roomResolutionStatus, setRoomResolutionStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [roomResolutionError, setRoomResolutionError] = useState("");

  const movieId = searchMovieId ?? resolvedRoom?.movieTmdbId ?? null;
  const aiRoomMode =
    searchParams.get("ai") === "1" || Boolean(resolvedRoom?.aiMode);
  const { movie, status: movieStatus } = useMovieDetails(movieId);
  const availableVideos = useMemo(() => {
    const rawVideos =
      movie?.videos && movie.videos.length > 0
        ? movie.videos
        : movie?.video
          ? [movie.video]
          : [];

    const deduped = new Map<string, MovieVideo>();

    rawVideos.forEach((video) => {
      if (!video?.key || deduped.has(video.key)) return;
      deduped.set(video.key, video);
    });

    return Array.from(deduped.values());
  }, [movie]);

  const mode: Mode = useMemo(() => {
    if (roomId && movieId) return "watchparty";
    if (movieId && !roomId) return "solo";
    return "create-room";
  }, [movieId, roomId]);

  const [activeOverlay, setActiveOverlay] = useState<OverlayId>(null);
  const [trailerPlaying, setTrailerPlaying] = useState(true);
  const [trailerTime, setTrailerTime] = useState(0);
  const [selectedVideoKey, setSelectedVideoKey] = useState<string | null>(null);
  const [cachedAvatarId, setCachedAvatarId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedVideoKey(movie?.video?.key ?? null);
  }, [movie?.tmdb_id, movie?.video?.key]);

  const handleSyncTrailer = useCallback((playing: boolean, time: number) => {
    setTrailerPlaying(playing);
    setTrailerTime(time);
  }, []);

  const handleSyncModal = useCallback((open: boolean) => {
    if (open) {
      setActiveOverlay("trailer");
    } else {
      setActiveOverlay((prev) => (prev === "trailer" ? null : prev));
    }
  }, []);

  const controlsApiRef = useRef<any | null>(null);
  const playerRef = useRef({ x: 0, y: PLAYER_Y, z: 0, yaw: 0 });
  const nearZoneRef = useRef<ZoneId | null>(null);

  const [guests, setGuests] = useState<GuestPresence[]>([]);

  const [nearZone, setNearZone] = useState<ZoneId | null>(null);
  const [viewer, setViewer] = useState<ViewerUser | null>(null);
  const [viewerStatus, setViewerStatus] = useState<ViewerStatus>("loading");
  const initializedAiOverlayRef = useRef(false);
  const webMainUrl = import.meta.env.VITE_WEB_MAIN_URL || DEFAULT_WEB_MAIN_URL;

  const movementEnabled = mode !== "create-room" && !activeOverlay;
  const overlayOpen = Boolean(activeOverlay);

  useEffect(() => {
    if (!roomId || searchMovieId) {
      setResolvedRoom(null);
      setRoomResolutionStatus("idle");
      setRoomResolutionError("");
      return;
    }

    let cancelled = false;
    setRoomResolutionStatus("loading");
    setRoomResolutionError("");

    apiGet<ApiResponse<RoomLookup>>(`/rooms/${roomId}`)
      .then((response) => {
        if (cancelled) {
          return;
        }

        setResolvedRoom(response.data);
        setRoomResolutionStatus("ready");

        const nextParams = new URLSearchParams({
          roomId: response.data.roomId,
          movieId: String(response.data.movieTmdbId),
        });

        if (response.data.aiMode) {
          nextParams.set("ai", "1");
        }

        setSearchParams(nextParams);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setResolvedRoom(null);
        setRoomResolutionStatus("error");
        setRoomResolutionError(
          error instanceof Error
            ? error.message
            : "We couldn't restore that room link.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [roomId, searchMovieId, setSearchParams]);

  useEffect(() => {
    const storedAvatar = window.localStorage.getItem("metaverse-room-avatar");
    if (storedAvatar) {
      setCachedAvatarId(storedAvatar);
    }

    setViewerStatus("loading");

    apiGet<ApiResponse<{ user: ViewerUser }>>("/users/me")
      .then((response) => {
        setViewer(response.data.user);
        setViewerStatus("ready");
        if (response.data.user.avatar) {
          window.localStorage.setItem(
            "metaverse-room-avatar",
            response.data.user.avatar,
          );
          setCachedAvatarId(response.data.user.avatar);
        }
      })
      .catch(() => {
        setViewer(null);
        setViewerStatus("guest");
      });
  }, []);

  useEffect(() => {
    if (
      !aiRoomMode ||
      mode !== "watchparty" ||
      initializedAiOverlayRef.current
    ) {
      return;
    }

    initializedAiOverlayRef.current = true;
    setActiveOverlay("ai");
  }, [aiRoomMode, mode]);

  const onZoneKey = useCallback(
    (zone: ZoneId) => {
      if (zone === "north") {
        if (mode === "watchparty") {
          // Broadcast to all peers via socket
          window.dispatchEvent(
            new CustomEvent("trailer-modal", { detail: true }),
          );
        } else {
          // Solo mode — no socket, just open locally
          setActiveOverlay("trailer");
        }
        return;
      }
      if (zone === "west") setActiveOverlay("comments");
      if (zone === "east") setActiveOverlay("info");
      if (zone === "south") setActiveOverlay("ai");
    },
    [mode],
  );

  const onCloseOverlay = useCallback(() => {
    if (activeOverlay === "trailer") {
      if (mode === "watchparty") {
        // Broadcast close to all peers
        window.dispatchEvent(
          new CustomEvent("trailer-modal", { detail: false }),
        );
      }
      // Solo mode just falls through to setActiveOverlay(null) below
    }
    setActiveOverlay(null);
  }, [activeOverlay, mode]);

  const createRoom = useCallback(
    (newRoomId: string, newMovieId: number, newAiMode: boolean) => {
      const nextParams = new URLSearchParams({
        roomId: newRoomId,
        movieId: String(newMovieId),
      });

      if (newAiMode) {
        nextParams.set("ai", "1");
      }

      setSearchParams(nextParams);
      setActiveOverlay(null);
      setGuests([]);
    },
    [setSearchParams],
  );

  const isResolvingRoomLink =
    Boolean(roomId) && !searchMovieId && roomResolutionStatus === "loading";
  const roomLinkResolutionFailed =
    Boolean(roomId) && !searchMovieId && roomResolutionStatus === "error";
  const theatreLoading =
    (mode === "watchparty" || mode === "solo") &&
    movieId !== null &&
    (movieStatus === "loading" || (movieStatus === "idle" && !movie));

  if (isResolvingRoomLink) {
    return (
      <RoomStatusScreen
        eyebrow="Opening Room"
        title="Restoring your theatre link"
        description="Fetching the saved movie and room settings so you land in the room instead of the creation flow."
        loading
      />
    );
  }

  if (roomLinkResolutionFailed) {
    return (
      <RoomStatusScreen
        eyebrow="Room Unavailable"
        title="We couldn't open this room yet"
        description={
          roomResolutionError ||
          "This link is missing the movie details we need, and the room lookup did not recover them."
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-white"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => window.location.assign(`${webMainUrl}/rooms`)}
              className="rounded-full bg-primary px-5 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary-foreground"
            >
              Open Main App
            </button>
          </>
        }
      />
    );
  }

  if (theatreLoading) {
    return (
      <RoomStatusScreen
        eyebrow="Loading Theatre"
        title="Bringing the cinema online"
        description="Pulling the movie details, theatre overlays, and room data before we drop you into the scene."
        loading
      />
    );
  }

  if ((mode === "watchparty" || mode === "solo") && movieStatus === "error") {
    return (
      <RoomStatusScreen
        eyebrow="Movie Missing"
        title="We couldn't load this room's movie"
        description="The room opened, but the movie details request failed. Retry once or jump back to the main app."
        actions={
          <>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-white"
            >
              Reload Room
            </button>
            <button
              type="button"
              onClick={() => window.location.assign(`${webMainUrl}/rooms`)}
              className="rounded-full bg-primary px-5 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary-foreground"
            >
              Open Rooms
            </button>
          </>
        }
      />
    );
  }

  const world = (
    <>
      <CinemaScene
        movementEnabled={movementEnabled}
        overlayOpen={overlayOpen}
        onZoneKey={onZoneKey}
        onCloseOverlay={onCloseOverlay}
        controlsApiRef={controlsApiRef}
        playerRef={playerRef}
        nearZoneRef={nearZoneRef}
        onNearZoneChange={setNearZone}
        tvOverlayRef={tvOverlayRef}
        guests={mode === "watchparty" ? guests : []}
      />

      {mode === "watchparty" && roomId && (
        <WatchPartyAvatars
          roomId={roomId}
          playerRef={playerRef}
          setGuests={setGuests}
          avatarId={viewer?.avatar || cachedAvatarId}
        />
      )}
    </>
  );

  // Create-room UX: show dialog before entering the room (no Canvas/pointer lock yet).
  if (mode === "create-room") {
    return (
      <div className="relative w-screen h-screen bg-neutral-900 overflow-hidden flex items-center justify-center">
        <PersistentCreateRoomOverlay
          currentUser={viewer}
          viewerStatus={viewerStatus}
          onCreate={createRoom}
        />
      </div>
    );
  }

  const pageContent = (
    <div className="relative w-screen h-screen bg-neutral-900 overflow-hidden">
      {world}
      {mode === "watchparty" && roomId && (
        <>
          <WatchPartyMediaBar
            roomId={roomId}
            onSyncTrailer={handleSyncTrailer}
            onSyncModal={handleSyncModal}
          />
          <RoomChatDrawer
            visible={activeOverlay === null}
            currentUser={viewer}
            viewerStatus={viewerStatus}
          />
        </>
      )}
      {activeOverlay === "trailer" && (
        <SyncedTrailerModal
          movieTitle={movie?.title}
          videos={availableVideos}
          selectedVideoKey={selectedVideoKey}
          onSelectVideo={setSelectedVideoKey}
          onClose={onCloseOverlay}
          playing={trailerPlaying}
          syncedTime={trailerTime}
          watchparty={mode === "watchparty"}
        />
      )}
      <GuidedEnterOverlay controlsApiRef={controlsApiRef} />
      <ProximityToast nearZone={nearZone} />

      {movieId && activeOverlay === "info" && (
        <RichMovieInfoOverlay movieId={movieId} onClose={onCloseOverlay} />
      )}
      {movieId && activeOverlay === "comments" && (
        <PersistentMovieCommentsOverlay
          movieId={movieId}
          onClose={onCloseOverlay}
          currentUser={viewer}
        />
      )}
      {activeOverlay === "ai" && (
        <RoomAiExperienceOverlay
          movieId={movieId}
          movieTitle={movie?.title}
          currentUser={viewer}
          onClose={onCloseOverlay}
        />
      )}
    </div>
  );

  if (mode === "watchparty" && roomId) {
    return <SocketProvider enabled>{pageContent}</SocketProvider>;
  }

  return pageContent;
};

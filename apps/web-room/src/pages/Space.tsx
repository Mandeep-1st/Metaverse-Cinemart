import * as mediasoupClient from "mediasoup-client";
import { Device } from "mediasoup-client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";
import {
  type Transport,
  type RtpCapabilities,
  type Producer,
} from "mediasoup-client/types";

interface RemoteMedia {
  producerId: string;
  consumerId: string;
  kind: "video" | "audio";
  stream: MediaStream;
  paused?: boolean;
}

const RemoteVideo = ({ stream }: { stream: MediaStream }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;

      // Wait a tiny bit for the browser to attach the stream before forcing play
      setTimeout(() => {
        videoRef.current
          ?.play()
          .catch((e) => console.error("Remote video play error:", e));
      }, 100);
    }
  }, [stream]);

  // Added 'muted' here. Browsers block video auto-play without it!
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="h-full w-full object-cover"
    />
  );
};

const RemoteAudio = ({ stream }: { stream: MediaStream }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch((e) => {
        console.error("Audio play error", e);
        // If the browser blocks autoplay, show the unmute button
        if (e.name === "NotAllowedError") {
          setAutoplayBlocked(true);
        }
      });
    }
  }, [stream]);

  return (
    <>
      <audio ref={audioRef} autoPlay className="hidden" />
      {autoplayBlocked && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <button
            onClick={() => {
              audioRef.current?.play();
              setAutoplayBlocked(false);
            }}
            className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold animate-pulse"
          >
            <span>🔇</span> Click to Allow Audio
          </button>
        </div>
      )}
    </>
  );
};

export const Space = () => {
  const { roomName } = useParams();
  const socket = useSocket();

  const [remoteMedia, setRemoteMedia] = useState<RemoteMedia[]>([]);
  const [status, setStatus] = useState("Initializing...");
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);

  const pendingProducers = useRef<string[]>([]);
  const deviceRef = useRef<Device | null>(null);
  const consumerTransportRef = useRef<Transport | null>(null);
  const producerTransportRef = useRef<Transport | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const videoProducerRef = useRef<Producer | null>(null);
  const audioProducerRef = useRef<Producer | null>(null);
  const startedRef = useRef<boolean>(false);

  const createDevice = async () => {
    if (deviceRef.current) return deviceRef.current;
    try {
      const rtpCaps =
        await socket.sendRequest<RtpCapabilities>("getRtpCapabilities");
      const device = new mediasoupClient.Device();
      await device.load({ routerRtpCapabilities: rtpCaps });
      deviceRef.current = device;
      tryConsumePending();
      return device;
    } catch (error) {
      console.error("Device load failed", error);
      return null;
    }
  };

  const getOrCreateRecvTransport = async () => {
    if (consumerTransportRef.current) return consumerTransportRef.current;
    if (!deviceRef.current) return null;

    try {
      const transportParams: any = await socket.sendRequest(
        "createWebRtcTransport",
        { sender: false },
      );
      const consumerTransport =
        deviceRef.current.createRecvTransport(transportParams);

      consumerTransport.on(
        "connect",
        async ({ dtlsParameters }, callback, errback) => {
          try {
            await socket.sendRequest("transport-recv-connect", {
              dtlsParameters,
            });
            callback();
          } catch (error: any) {
            errback(error);
          }
        },
      );

      consumerTransportRef.current = consumerTransport;
      return consumerTransport;
    } catch (error) {
      console.error("Error creating recv transport", error);
      return null;
    }
  };

  const consumeProducer = async (producerId: string) => {
    if (!deviceRef.current) await createDevice();
    const transport = await getOrCreateRecvTransport();
    if (!transport || !deviceRef.current) return;

    try {
      const data: any = await socket.sendRequest("consume", {
        rtpCapabilities: deviceRef.current.rtpCapabilities,
        producerId,
      });

      const consumer = await transport.consume({
        id: data.id,
        producerId: data.producerId,
        kind: data.kind,
        rtpParameters: data.rtpParameters,
      });

      setRemoteMedia((prev) => [
        ...prev,
        {
          producerId,
          consumerId: consumer.id,
          kind: consumer.kind as "video" | "audio",
          stream: new MediaStream([consumer.track]),
        },
      ]);

      await socket.sendRequest("consumer-resume", { consumerId: data.id });
    } catch (error) {
      console.error("Consumption failed:", error);
    }
  };

  const tryConsumePending = async () => {
    if (!deviceRef.current) return;
    while (pendingProducers.current.length > 0) {
      const pId = pendingProducers.current.shift()!;
      if (!remoteMedia.some((m) => m.producerId === pId)) {
        await consumeProducer(pId);
      }
    }
  };

  const initializeProducers = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      if (!producerTransportRef.current && deviceRef.current) {
        const params: any = await socket.sendRequest("createWebRtcTransport", {
          sender: true,
        });
        const transport = deviceRef.current.createSendTransport(params);

        transport.on(
          "connect",
          async ({ dtlsParameters }, callback, errback) => {
            try {
              await socket.sendRequest("transport-connect", { dtlsParameters });
              callback();
            } catch (err: any) {
              errback(err);
            }
          },
        );

        transport.on("produce", async (parameters, callback, errback) => {
          try {
            const data: any = await socket.sendRequest("transport-produce", {
              kind: parameters.kind,
              rtpParameters: parameters.rtpParameters,
            });
            callback({ id: data.id });
          } catch (err: any) {
            errback(err);
          }
        });

        producerTransportRef.current = transport;
      }

      const videoTrack = stream.getVideoTracks()[0];
      videoProducerRef.current = await producerTransportRef.current!.produce({
        track: videoTrack,
        encodings: [
          { maxBitrate: 100000 },
          { maxBitrate: 300000 },
          { maxBitrate: 900000 },
        ],
        codecOptions: { videoGoogleStartBitrate: 1000 },
      });

      const audioTrack = stream.getAudioTracks()[0];
      audioProducerRef.current = await producerTransportRef.current!.produce({
        track: audioTrack,
      });

      // Start visually "ON"
      setIsVideoOn(true);
      setIsAudioOn(true);
    } catch (error) {
      console.error("Initialize producers error: ", error);
    }
  };

  const toggleVideo = async () => {
    if (!videoProducerRef.current) {
      await initializeProducers();
      return;
    }
    if (isVideoOn) {
      await socket.sendRequest("producer-pause", {
        producerId: videoProducerRef.current.id,
      });
      setIsVideoOn(false);
    } else {
      await socket.sendRequest("producer-resume", {
        producerId: videoProducerRef.current.id,
      });
      setIsVideoOn(true);
    }
  };

  const toggleAudio = async () => {
    if (!audioProducerRef.current) {
      await initializeProducers();
      return;
    }
    if (isAudioOn) {
      await socket.sendRequest("producer-pause", {
        producerId: audioProducerRef.current.id,
      });
      setIsAudioOn(false);
    } else {
      await socket.sendRequest("producer-resume", {
        producerId: audioProducerRef.current.id,
      });
      setIsAudioOn(true);
    }
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    socket.onExistingProducers((producers) => {
      producers.forEach((p: any) =>
        pendingProducers.current.push(p.producerId),
      );
      tryConsumePending();
    });

    socket.onNewProducerArrives((p) => {
      pendingProducers.current.push(p.producerId);
      tryConsumePending();
    });

    socket.onProducerClosed((data) => {
      setRemoteMedia((prev) =>
        prev.filter((m) => m.producerId !== data.producerId),
      );
    });

    socket.onProducerPaused((data) => {
      setRemoteMedia((prev) =>
        prev.map((m) =>
          m.producerId === data.producerId ? { ...m, paused: true } : m,
        ),
      );
    });

    socket.onProducerResumed((data) => {
      setRemoteMedia((prev) =>
        prev.map((m) =>
          m.producerId === data.producerId ? { ...m, paused: false } : m,
        ),
      );
    });

    const init = async () => {
      await socket.sendRequest("join-room", { roomId: roomName });
      await createDevice();
      setStatus(`Connected to Room: ${roomName}`);
    };
    init();
  }, [roomName]);

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Metaverse Cinemart</h1>
        <p className="text-green-400 font-mono text-sm">{status}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[80vh]">
        {/* Local Feed */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          <div className="bg-neutral-800 rounded-xl overflow-hidden shadow-lg relative aspect-video">
            <video
              ref={localVideoRef}
              muted
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${!isVideoOn && "hidden"}`}
            />
            {!isVideoOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
                <span className="text-4xl">📸</span>
              </div>
            )}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full ${isVideoOn ? "bg-neutral-700/80 hover:bg-neutral-600" : "bg-red-500 hover:bg-red-600"}`}
              >
                {isVideoOn ? "📹 On" : "📹 Off"}
              </button>
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-full ${isAudioOn ? "bg-neutral-700/80 hover:bg-neutral-600" : "bg-red-500 hover:bg-red-600"}`}
              >
                {isAudioOn ? "🎤 On" : "🎤 Off"}
              </button>
            </div>
          </div>
        </div>

        {/* Remote Feeds */}
        <div className="w-full lg:w-2/3 bg-neutral-800 rounded-xl p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 border-b border-neutral-700 pb-2">
            Friends in Room
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {remoteMedia
              .filter((m) => m.kind === "video")
              .map((m) => (
                <div
                  key={m.consumerId}
                  className="bg-black rounded-lg overflow-hidden aspect-video relative border border-neutral-700"
                >
                  {!m.paused ? (
                    <RemoteVideo stream={m.stream} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                      <span>Camera Paused</span>
                    </div>
                  )}
                </div>
              ))}
            {/* Hidden Audio Elements */}
            {remoteMedia
              .filter((m) => m.kind === "audio")
              .map((m) => (
                <RemoteAudio key={m.consumerId} stream={m.stream} />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

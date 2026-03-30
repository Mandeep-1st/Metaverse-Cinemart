import express from 'express';
import http from 'http';
import * as ws from 'ws';
import { randomUUID } from 'crypto';
import * as mediasoup from 'mediasoup';
import {
    type Consumer,
    type DtlsParameters,
    type Producer,
    type Router,
    type RouterRtpCodecCapability,
    type RtpCapabilities,
    type WebRtcTransport,
    type Worker
} from 'mediasoup/types';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.SERVER_VAR_PORT || 8000;
const server = http.createServer(app);
const wss = new ws.WebSocketServer({ server });

// Mediasoup setup
let worker: Worker;

const mediaCodecs: RouterRtpCodecCapability[] = [
    {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
    },
    {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {
            'x-google-start-bitrate': 1000
        },
    },
];

// Types
interface roomMapType {
    router: Router;
    peers: Map<string, peersMapType>;
    producers: Map<string, producerRoomObject>;
    chatMessages: RoomChatMessage[];
    voteState: Map<string, RoomVoteOption>;
    voteByPeer: Map<string, string>;
    trailerState: { isPlaying: boolean; time: number; updatedAt: number; modalOpen: boolean }; // ← add modalOpen

}

interface peersMapType {
    socket: ws.WebSocket | null;
    producers: Map<string, Producer>;
    consumers: Map<string, Consumer>;
    transports: {
        senderTransport: WebRtcTransport | null;
        receiverTransport: WebRtcTransport | null;
    };
}

interface producerRoomObject {
    producer: Producer;
    ownerPeerId: string;
}

interface RoomChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    likes: number;
    likedBy: string[];
    createdAt: number;
}

interface RoomVoteOption {
    optionId: string;
    label: string;
    count: number;
}

// Global State (In production, consider Redis for room state if scaling to multiple workers/servers)
const rooms = new Map<string, roomMapType>();
const socketRoomMap = new Map<string, string>();

const broadcastToRoom = (roomId: string, payload: Record<string, unknown>) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.peers.forEach((peer) => {
        if (peer.socket?.readyState === ws.OPEN) {
            peer.socket.send(JSON.stringify(payload));
        }
    });
};

const initWorker = async () => {
    worker = await mediasoup.createWorker({
        logLevel: 'warn',
        logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
        rtcMinPort: process.env.SERVER_VAR_MEDIASOUP_MIN_PORT ? Number(process.env.SERVER_VAR_MEDIASOUP_MIN_PORT) : 2000,
        rtcMaxPort: process.env.SERVER_VAR_MEDIASOUP_MAX_PORT ? Number(process.env.SERVER_VAR_MEDIASOUP_MAX_PORT) : 2020,
    });

    worker.on('died', () => {
        console.error('Mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
        setTimeout(() => process.exit(1), 2000);
    });

    console.log(`Mediasoup worker created [pid:${worker.pid}]`);
};

// Initialize worker before starting signaling server
initWorker().catch(console.error);

wss.on('connection', async (socket: ws.WebSocket) => {
    const socketId = randomUUID();
    console.log(`New connection: ${socketId}`);

    socket.on('error', (err) => {
        console.error(`Socket Error (${socketId}):`, err);
    });

    socket.on('close', () => {
        console.log(`Connection closed: ${socketId}`);
        handleDisconnect(socketId);
    });

    socket.send(JSON.stringify({
        type: "connection-success",
        data: {
            message: "Server connection successful",
            socketId
        }
    }));

    socket.on('message', async (data: ws.RawData) => {
        try {
            const DATA = JSON.parse(data.toString());

            // Route messages based on type
            switch (DATA.type) {
                case "join-room":
                    await handleJoinRoom(DATA, socketId, socket);
                    break;
                case "avatar-sync":
                    handleAvatarSync(DATA, socketId);
                    break;
                case "getRtpCapabilities":
                    handleGetRtpCapabilities(socketId, socket, DATA.requestId);
                    break;
                case "createWebRtcTransport":
                    await handleCreateWebRtcTransportWrapper(DATA, socketId, socket);
                    break;
                case "transport-connect":
                    await handleTransportConnect(true, socketId, DATA.requestId, DATA.data.dtlsParameters, socket);
                    break;
                case "transport-recv-connect":
                    await handleTransportConnect(false, socketId, DATA.requestId, DATA.data.dtlsParameters, socket);
                    break;
                case "transport-produce":
                    await handleProduceTransport(DATA.data, socket, socketId, DATA.requestId);
                    break;
                case "consume":
                    await handleConsume(DATA.data.rtpCapabilities, DATA.data.producerId, socketId, socket, DATA.requestId);
                    break;
                case "consumer-resume":
                    await handleConsumerResume(socket, DATA.data.consumerId, socketId, DATA.requestId);
                    break;
                case "producer-pause":
                case "producer-resume":
                    await handleProducerToggle(DATA, socketId, socket);
                    break;
                case "producer-close":
                    await handleProducerClose(DATA, socketId);
                    break;
                case "trailer-update":
                    handleTrailerUpdate(DATA, socketId);
                    break;
                case "chat-send":
                    handleChatSend(DATA, socketId);
                    break;
                case "chat-like":
                    handleChatLike(DATA, socketId);
                    break;
                case "vote-submit":
                    handleVoteSubmit(DATA, socketId);
                    break;
                default:
                    console.warn(`Unknown message type: ${DATA.type}`);
            }
        } catch (error) {
            console.error("Error handling message:", error);
        }
    });
});

// --- Handlers ---

const handleDisconnect = (socketId: string) => {
    const peerRoomId = socketRoomMap.get(socketId);
    if (!peerRoomId) return;

    const peerRoom = rooms.get(peerRoomId);
    const peer = peerRoom?.peers.get(socketId);

    // Notify others that producer left
    peer?.producers.forEach((eachProducer) => {
        peerRoom?.peers.forEach((eachPeer, eachPeerId) => {
            if (eachPeerId !== socketId && eachPeer.socket?.readyState === ws.OPEN) {
                eachPeer.socket.send(JSON.stringify({
                    type: "producer-closed",
                    data: { producerId: eachProducer.id }
                }));
            }
        });
    });

    // Cleanup resources
    peer?.consumers.forEach((c) => c.close());
    peer?.producers.forEach((p) => {
        p.close();
        peerRoom?.producers.delete(p.id);
    });
    peer?.transports.senderTransport?.close();
    peer?.transports.receiverTransport?.close();

    const previousVote = peerRoom?.voteByPeer.get(socketId);
    if (peerRoom && previousVote) {
        const previousOption = peerRoom.voteState.get(previousVote);
        if (previousOption) {
            previousOption.count = Math.max(0, previousOption.count - 1);
        }
        peerRoom.voteByPeer.delete(socketId);
        broadcastToRoom(peerRoomId, {
            type: "vote-state",
            data: Array.from(peerRoom.voteState.values()).filter((option) => option.count > 0),
        });
    }

    peerRoom?.peers.delete(socketId);
    socketRoomMap.delete(socketId);

    // Notify remaining peers so they can remove the stale avatar
    peerRoom?.peers.forEach((eachPeer) => {
        if (eachPeer.socket?.readyState === ws.OPEN) {
            eachPeer.socket.send(JSON.stringify({
                type: "peer-left",
                data: { peerId: socketId }
            }));
        }
    });

    if (peerRoom?.peers.size === 0) {
        console.log(`Room empty, closing router: ${peerRoomId}`);
        peerRoom.router.close();
        rooms.delete(peerRoomId);
    }
};

const handleJoinRoom = async (DATA: any, socketId: string, socket: ws.WebSocket) => {
    const roomId = DATA.data.roomId;

    if (!rooms.has(roomId)) {
        if (!worker) return;
        console.log(`Creating new room: ${roomId}`);
        rooms.set(roomId, {
            router: await worker.createRouter({ mediaCodecs }),
            peers: new Map(),
            producers: new Map(),
            chatMessages: [],
            voteState: new Map(),
            voteByPeer: new Map(),
            trailerState: { isPlaying: true, time: 0, updatedAt: Date.now(), modalOpen: false } // ← initialize modalOpen
        });
    }

    const room = rooms.get(roomId)!;
    room.peers.set(socketId, {
        socket: socket,
        producers: new Map(),
        consumers: new Map(),
        transports: { senderTransport: null, receiverTransport: null }
    });

    socketRoomMap.set(socketId, roomId);

    // Send back existing producers in the room
    const producersList = Array.from(room.producers.entries()).map(([producerId, producerObj]) => ({
        producerId,
        kind: producerObj.producer.kind
    }));

    socket.send(JSON.stringify({
        type: 'room-join-request',
        data: {
            message: "Successfully joined room",
            UsersInRoom: room.peers.size,
        },
        requestId: DATA.requestId
    }));

    socket.send(JSON.stringify({
        type: "existing-producers",
        data: producersList,
        roomId: roomId,
        trailerState: room.trailerState
    }));

    socket.send(JSON.stringify({
        type: "room-bootstrap",
        data: {
            chatMessages: room.chatMessages,
            voteState: Array.from(room.voteState.values()),
        }
    }));
};

const handleGetRtpCapabilities = (socketId: string, socket: ws.WebSocket, requestId: string) => {
    const roomId = socketRoomMap.get(socketId);
    const rtpCapabilities = rooms.get(roomId!)?.router.rtpCapabilities;

    socket.send(JSON.stringify({
        data: rtpCapabilities,
        requestId: requestId
    }));
};

const handleCreateWebRtcTransportWrapper = async (DATA: any, socketId: string, socket: ws.WebSocket) => {
    const peer = rooms.get(socketRoomMap.get(socketId)!)?.peers.get(socketId);
    const transport = await createWebRtcTransport(socketId, socket, DATA.requestId);

    if (!transport) return;

    if (DATA.data.sender) {
        peer!.transports.senderTransport = transport;
    } else {
        peer!.transports.receiverTransport = transport;
    }
};

const createWebRtcTransport = async (socketId: string, socket: ws.WebSocket, requestId: string) => {
    try {

        const webRtcTransport_options = {
            listenIps: [
                {
                    ip: process.env.SERVER_VAR_MEDIASOUP_LISTEN_IP || "0.0.0.0",
                    announcedIp: process.env.SERVER_VAR_MEDIASOUP_ANNOUNCED_IP || "127.0.0.1",
                },
            ],
            enableUdp: true,
            enableTcp: true,
            preferUdp: true
        };

        const roomId = socketRoomMap.get(socketId);
        const router = rooms.get(roomId!)?.router;

        if (!router) throw new Error("Router not found");

        const transport = await router.createWebRtcTransport(webRtcTransport_options);

        transport.on('dtlsstatechange', dtlsState => {
            if (dtlsState === 'closed') transport.close();
        });

        socket.send(JSON.stringify({
            data: {
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters
            },
            requestId: requestId
        }));

        return transport;
    } catch (error: any) {
        console.error("Create transport error:", error);
        socket.send(JSON.stringify({ data: { error: error.message }, requestId }));
    }
};

const handleTransportConnect = async (isSender: boolean, socketId: string, requestId: string, dtlsParameters: DtlsParameters, socket: ws.WebSocket) => {
    const peer = rooms.get(socketRoomMap.get(socketId)!)?.peers.get(socketId);

    try {
        if (isSender) {
            await peer?.transports.senderTransport?.connect({ dtlsParameters });
        } else {
            await peer?.transports.receiverTransport?.connect({ dtlsParameters });
        }
        socket.send(JSON.stringify({ requestId, data: { success: true } }));
    } catch (error) {
        socket.send(JSON.stringify({ requestId, data: { error: "Failed to connect transport" } }));
    }
};

const handleProduceTransport = async (data: any, socket: ws.WebSocket, socketId: string, requestId: string) => {
    try {
        const peerRoom = rooms.get(socketRoomMap.get(socketId)!);
        const peer = peerRoom?.peers.get(socketId);

        const producer = await peer?.transports.senderTransport?.produce({
            kind: data.kind,
            rtpParameters: data.rtpParameters
        });

        if (!producer) throw new Error("Producer creation failed");

        peer?.producers.set(producer.id, producer);
        peerRoom?.producers.set(producer.id, { producer, ownerPeerId: socketId });

        // Notify others
        peerRoom?.peers.forEach((eachPeer, eachPeerId) => {
            if (eachPeerId !== socketId && eachPeer.socket?.readyState === ws.OPEN) {
                eachPeer.socket.send(JSON.stringify({
                    type: 'new-producer',
                    data: { producerId: producer.id, kind: producer.kind }
                }));
            }
        });

        producer.on('transportclose', () => {
            producer.close();
        });

        socket.send(JSON.stringify({ requestId, data: { id: producer.id } }));
    } catch (error: any) {
        socket.send(JSON.stringify({ requestId, data: { error: error.message } }));
    }
};

const handleConsume = async (rtpCapabilities: RtpCapabilities, producerId: string, socketId: string, socket: ws.WebSocket, requestId: string) => {
    try {
        const peerRoom = rooms.get(socketRoomMap.get(socketId)!);
        const peer = peerRoom?.peers.get(socketId);

        if (!peer || !peer.transports.receiverTransport) throw new Error("Receiver transport not found");
        if (!peerRoom?.router.canConsume({ producerId, rtpCapabilities })) throw new Error("Cannot consume");

        const consumer = await peer.transports.receiverTransport.consume({
            producerId,
            rtpCapabilities,
            paused: true, // Start paused as per Mediasoup guidelines
        });

        peer.consumers.set(consumer.id, consumer);

        socket.send(JSON.stringify({
            requestId,
            data: {
                id: consumer.id,
                producerId: producerId,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters
            }
        }));
    } catch (error: any) {
        socket.send(JSON.stringify({ requestId, error: error.message }));
    }
};

const handleConsumerResume = async (socket: ws.WebSocket, consumerId: string, socketId: string, requestId: string) => {
    const peer = rooms.get(socketRoomMap.get(socketId)!)?.peers.get(socketId);
    const consumer = peer?.consumers.get(consumerId);

    if (consumer) {
        await consumer.resume();

        // THE FIX: Wait 500ms for the client's WebRTC secure handshake to fully finish, 
        // then explicitly demand a fresh keyframe from the producer.
        if (consumer.kind === 'video') {
            setTimeout(async () => {
                try {
                    await consumer.requestKeyFrame();
                    console.log(`Forced keyframe for video consumer ${consumer.id}`);
                } catch (e) {
                    console.error("Failed to request keyframe:", e);
                }
            }, 500);
        }
    }

    socket.send(JSON.stringify({ requestId, data: { success: true } }));
};

const handleProducerToggle = async (DATA: any, socketId: string, socket: ws.WebSocket) => {
    const peerRoom = rooms.get(socketRoomMap.get(socketId)!);
    const peer = peerRoom?.peers.get(socketId);
    const producer = peer?.producers.get(DATA.data.producerId);

    if (producer) {
        if (DATA.type === "producer-pause") await producer.pause();
        if (DATA.type === "producer-resume") await producer.resume();

        // Notify others
        peerRoom?.peers.forEach((eachPeer, eachPeerId) => {
            if (eachPeerId !== socketId && eachPeer.socket?.readyState === ws.OPEN) {
                eachPeer.socket.send(JSON.stringify({
                    type: DATA.type === "producer-pause" ? "producer-pause" : "producer-resumed",
                    data: { producerId: DATA.data.producerId }
                }));
            }
        });
    }

    socket.send(JSON.stringify({ requestId: DATA.requestId, data: {} }));
};

const handleAvatarSync = (DATA: any, socketId: string) => {
    const roomId = socketRoomMap.get(socketId);
    if (!roomId) return;

    const peerRoom = rooms.get(roomId);
    if (!peerRoom) return;

    const { x, y, z, rY } = DATA?.data ?? {};

    // Broadcast to all other peers; sender already knows their own position.
    peerRoom.peers.forEach((eachPeer, eachPeerId) => {
        if (eachPeerId === socketId) return;
        if (eachPeer.socket?.readyState === ws.OPEN) {
            eachPeer.socket.send(JSON.stringify({
                type: "avatar-state",
                data: {
                    peerId: socketId,
                    x,
                    y,
                    z,
                    rY,
                }
            }));
        }
    });
};

const handleProducerClose = async (DATA: any, socketId: string) => {
    const roomId = socketRoomMap.get(socketId);
    if (!roomId) return;

    const peerRoom = rooms.get(roomId);
    if (!peerRoom) return;

    const producerId = String(DATA?.data?.producerId ?? "");
    if (!producerId) return;

    const producerEntry = peerRoom.producers.get(producerId);
    if (!producerEntry) return;

    // Only allow the owner to close their own producer.
    // (If you want admin override, adjust this check.)
    if (producerEntry.ownerPeerId !== socketId) return;

    // Close producer first, so mediasoup stops producing.
    try {
        producerEntry.producer.close();
    } catch {
        // ignore
    }

    peerRoom.producers.delete(producerId);

    // Close any consumers tracking this producer across all peers.
    peerRoom.peers.forEach((peer) => {
        peer.consumers.forEach((consumer) => {
            // mediasoup Consumer has producerId property
            if ((consumer as any).producerId === producerId) {
                try {
                    consumer.close();
                } catch {
                    // ignore
                }
                peer.consumers.delete(consumer.id);
            }
        });
    });

    // Notify peers so clients unmount frozen/zombie video components.
    peerRoom.peers.forEach((eachPeer, eachPeerId) => {
        if (eachPeer.socket?.readyState === ws.OPEN) {
            eachPeer.socket.send(JSON.stringify({
                type: "producer-closed",
                data: { producerId },
            }));
        }
    });
};

const handleTrailerUpdate = (DATA: any, socketId: string) => {
    const roomId = socketRoomMap.get(socketId);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    // Advance time if currently playing before applying update
    let newTime = room.trailerState.time;
    if (room.trailerState.isPlaying) {
        newTime += (Date.now() - room.trailerState.updatedAt) / 1000;
    }

    // Merge only what was sent — don't clobber fields that weren't included
    room.trailerState = {
        isPlaying: DATA.data.isPlaying ?? room.trailerState.isPlaying,
        modalOpen: DATA.data.modalOpen ?? room.trailerState.modalOpen, // ← NEW
        time: DATA.data.modalOpen !== undefined ? newTime : (DATA.data.time ?? newTime),
        updatedAt: Date.now(),
    };

    // Broadcast to everyone including sender so their own state stays in sync
    room.peers.forEach((peer) => {
        if (peer.socket?.readyState === ws.OPEN) {
            peer.socket.send(JSON.stringify({
                type: "trailer-state",
                data: room.trailerState
            }));
        }
    });
};

const handleChatSend = (DATA: any, socketId: string) => {
    const roomId = socketRoomMap.get(socketId);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const text = String(DATA?.data?.text ?? "").trim();
    if (!text) return;

    const message: RoomChatMessage = {
        id: randomUUID(),
        senderId: String(DATA?.data?.senderId ?? socketId),
        senderName: String(DATA?.data?.senderName ?? "Guest"),
        text,
        likes: 0,
        likedBy: [],
        createdAt: Date.now(),
    };

    room.chatMessages = [...room.chatMessages.slice(-59), message];

    broadcastToRoom(roomId, {
        type: "chat-message",
        data: message,
    });
};

const handleChatLike = (DATA: any, socketId: string) => {
    const roomId = socketRoomMap.get(socketId);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const messageId = String(DATA?.data?.messageId ?? "");
    if (!messageId) return;

    const likerId = String(DATA?.data?.senderId ?? socketId);
    const targetMessage = room.chatMessages.find((message) => message.id === messageId);

    if (!targetMessage) return;

    if (targetMessage.likedBy.includes(likerId)) {
        targetMessage.likedBy = targetMessage.likedBy.filter((id) => id !== likerId);
    } else {
        targetMessage.likedBy.push(likerId);
    }

    targetMessage.likes = targetMessage.likedBy.length;

    broadcastToRoom(roomId, {
        type: "chat-message-liked",
        data: {
            messageId: targetMessage.id,
            likes: targetMessage.likes,
        },
    });
};

const handleVoteSubmit = (DATA: any, socketId: string) => {
    const roomId = socketRoomMap.get(socketId);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const optionId = String(DATA?.data?.optionId ?? "");
    const label = String(DATA?.data?.label ?? "Untitled option");

    if (!optionId) return;

    const previousVote = room.voteByPeer.get(socketId);
    if (previousVote && room.voteState.has(previousVote)) {
        const previousOption = room.voteState.get(previousVote)!;
        previousOption.count = Math.max(0, previousOption.count - 1);
    }

    const currentOption = room.voteState.get(optionId) || {
        optionId,
        label,
        count: 0,
    };

    currentOption.label = label;
    currentOption.count += 1;

    room.voteState.set(optionId, currentOption);
    room.voteByPeer.set(socketId, optionId);

    broadcastToRoom(roomId, {
        type: "vote-state",
        data: Array.from(room.voteState.values())
            .filter((option) => option.count > 0)
            .sort((a, b) => b.count - a.count),
    });
};

server.listen(PORT, () => {
    console.log(`Socket Server is listening on port ${PORT}`);
});

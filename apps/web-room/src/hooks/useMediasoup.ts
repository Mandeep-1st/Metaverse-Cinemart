import { useState, useEffect, useRef, useCallback } from 'react';
import { Device } from 'mediasoup-client';
import type { Transport } from 'mediasoup-client/types';

export function useMediasoup(socket: WebSocket | null, isConnected: boolean) {
    const [device, setDevice] = useState<Device | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

    const sendTransportRef = useRef<Transport | null>(null);
    const recvTransportRef = useRef<Transport | null>(null);
    const localProducers = useRef<Map<string, any>>(new Map()); // Track our own producers to close them

    // THE FIX: Buffer to hold producers if WebRTC is still initializing
    const pendingProducers = useRef<any[]>([]);
    const pendingRequests = useRef<Map<string, { resolve: (val: any) => void, reject: (err: any) => void }>>(new Map());

    const request = useCallback((type: string, data: any = {}) => {
        return new Promise((resolve, reject) => {
            if (!socket || socket.readyState !== WebSocket.OPEN) return reject('Socket not open');
            const requestId = crypto.randomUUID();
            pendingRequests.current.set(requestId, { resolve, reject });
            socket.send(JSON.stringify({ type, data, requestId }));
        });
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        const handleMessage = async (event: MessageEvent) => {
            const parsed = JSON.parse(event.data);
            const { type, data, requestId } = parsed;

            // 1. Resolve pending Promises
            if (requestId && pendingRequests.current.has(requestId)) {
                const promise = pendingRequests.current.get(requestId)!;
                if (data && data.error) promise.reject(data.error);
                else promise.resolve(data);
                pendingRequests.current.delete(requestId);
                return;
            }

            // 2. Handle incoming video streams (with Buffer logic)
            if (type === 'existing-producers') {
                if (!recvTransportRef.current) pendingProducers.current.push(...data);
                else for (const p of data) await consumeTrack(p.producerId);
            }
            else if (type === 'new-producer') {
                if (!recvTransportRef.current) pendingProducers.current.push(data);
                else await consumeTrack(data.producerId);
            }
            else if (type === 'producer-closed' || type === 'player-left') {
                setRemoteStreams(prev => {
                    const updated = new Map(prev);
                    updated.delete(data.producerId || data.socketId); // Cleanup dead streams
                    return updated;
                });
            }
        };

        socket.addEventListener('message', handleMessage);
        return () => socket.removeEventListener('message', handleMessage);
    }, [socket]);

    const initWebRTC = async () => {
        if (device || !socket || socket.readyState !== WebSocket.OPEN) return;

        try {
            const rtpCapabilities: any = await request('getRtpCapabilities');
            const newDevice = new Device();
            await newDevice.load({ routerRtpCapabilities: rtpCapabilities });
            setDevice(newDevice);

            // Create Send Transport
            const sendParams: any = await request('createWebRtcTransport', { sender: true });
            const sendTransport = newDevice.createSendTransport(sendParams);
            sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
                try { await request('transport-connect', { dtlsParameters }); callback(); }
                catch (err) { errback(err as Error); }
            });
            sendTransport.on('produce', async (parameters, callback, errback) => {
                try {
                    const { id }: any = await request('transport-produce', {
                        kind: parameters.kind, rtpParameters: parameters.rtpParameters, appData: parameters.appData
                    });
                    callback({ id });
                } catch (err) { errback(err as Error); }
            });
            sendTransportRef.current = sendTransport;

            // Create Receive Transport
            const recvParams: any = await request('createWebRtcTransport', { sender: false });
            const recvTransport = newDevice.createRecvTransport(recvParams);
            recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
                try { await request('transport-recv-connect', { dtlsParameters }); callback(); }
                catch (err) { errback(err as Error); }
            });
            recvTransportRef.current = recvTransport;

            // Flush the buffer! Consume any streams that arrived while we were initializing
            for (const p of pendingProducers.current) {
                await consumeTrack(p.producerId);
            }
            pendingProducers.current = [];

        } catch (error) {
            console.error("Failed to initialize Mediasoup:", error);
        }
    };

    const consumeTrack = async (producerId: string) => {
        if (!recvTransportRef.current) return;
        try {
            // Must use a functional state update here to avoid stale closures on 'device'
            setDevice((currentDevice) => {
                if (!currentDevice) return currentDevice;

                request('consume', { producerId, rtpCapabilities: currentDevice.rtpCapabilities })
                    .then(async (params: any) => {
                        const consumer = await recvTransportRef.current!.consume({
                            id: params.id, producerId: params.producerId, kind: params.kind, rtpParameters: params.rtpParameters
                        });
                        await request('consumer-resume', { consumerId: consumer.id });

                        const newStream = new MediaStream([consumer.track]);
                        setRemoteStreams(prev => new Map(prev).set(producerId, newStream));
                    });
                return currentDevice;
            });
        } catch (error) { console.error("Error consuming track:", error); }
    };

    const startWebcam = async () => {
        if (!sendTransportRef.current) await initWebRTC();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);

            const videoTrack = stream.getVideoTracks()[0];
            const audioTrack = stream.getAudioTracks()[0];

            if (videoTrack) {
                const vp = await sendTransportRef.current?.produce({ track: videoTrack });
                if (vp) localProducers.current.set(vp.id, vp);
            }
            if (audioTrack) {
                const ap = await sendTransportRef.current?.produce({ track: audioTrack });
                if (ap) localProducers.current.set(ap.id, ap);
            }
        } catch (error) { console.error("Failed to access webcam:", error); }
    };

    const stopWebcam = () => {
        // 1. Turn off local camera/mic hardware light
        if (localStream) {
            localStream.getTracks().forEach(track => {
                track.stop(); // Kills the hardware
            });
            setLocalStream(null); // Removes local video box
        }

        // 2. Completely close producers and tell backend to notify peers
        localProducers.current.forEach((producer, id) => {
            producer.close(); // Close client-side Mediasoup pipeline
            request('producer-close', { producerId: id }).catch(console.error); // Send kill signal to server
        });

        // 3. IMPORTANT: Clear the memory so we don't spawn duplicates if we turn it back on!
        localProducers.current.clear();
    };

    return { startWebcam, stopWebcam, localStream, remoteStreams, initWebRTC };
}
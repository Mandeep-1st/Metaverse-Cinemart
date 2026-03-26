/* eslint-disable @typescript-eslint/no-explicit-any */
interface SocketRequest {
    requestId: string;
    type: string;
    data?: any;
}

interface SocketResponse {
    type: string,
    requestId: string;
    data?: any;
    error?: string;
}

interface PendingRequest {
    resolve: (data: any) => void;
    reject: (reason: any) => void;
}

class SocketService {
    private socket: WebSocket | null = null;
    private pendingRequests = new Map<string, PendingRequest>();

    // Event listeners
    private existingProducersHelper: ((data: any[]) => void)[] = [];
    private newProducerArrivesHelper: ((data: any) => void)[] = [];
    private producerClosedHelper: ((data: any) => void)[] = [];
    private producerPausedHelper: ((data: any) => void)[] = [];
    private producerResumedHelper: ((data: any) => void)[] = [];
    private avatarStateHelper: ((data: any) => void)[] = [];
    private peerLeftHelper: ((data: any) => void)[] = [];

    public connect(url: string): void {
        if (this.socket) return;

        this.socket = new WebSocket(url);

        this.socket.onopen = () => console.log('WebSocket Connected');

        this.socket.onmessage = (event: MessageEvent) => {
            try {
                const msg: SocketResponse = JSON.parse(event.data);

                if (msg.requestId && this.pendingRequests.has(msg.requestId)) {
                    const { resolve, reject } = this.pendingRequests.get(msg.requestId)!;
                    if (msg.error) reject(new Error(msg.error));
                    else resolve(msg.data);
                    this.pendingRequests.delete(msg.requestId);
                } else {
                    // Push Notifications
                    if (msg.type === "existing-producers") {
                        this.existingProducersHelper.forEach(cb => cb(msg.data));
                    } else if (msg.type === "new-producer") {
                        this.newProducerArrivesHelper.forEach(cb => cb(msg.data));
                    } else if (msg.type === "producer-closed") {
                        this.producerClosedHelper.forEach(cb => cb(msg.data));
                    } else if (msg.type === "producer-paused" || msg.type === "producer-pause") {
                        this.producerPausedHelper.forEach(cb => cb(msg.data));
                    } else if (msg.type === "producer-resumed") {
                        this.producerResumedHelper.forEach(cb => cb(msg.data));
                    } else if (msg.type === "avatar-state" || msg.type === "avatar-sync") {
                        this.avatarStateHelper.forEach(cb => cb(msg.data));
                    } else if (msg.type === "peer-left") {
                        this.peerLeftHelper.forEach(cb => cb(msg.data));
                    }
                }
            } catch (err) {
                console.error("Error parsing WebSocket message", err);
            }
        };

        this.socket.onclose = () => {
            console.log("WebSocket Disconnected");
            this.socket = null;
        };
    }

    public getReadyState(): number | null {
        return this.socket?.readyState ?? null;
    }

    public disconnect(): void {
        if (this.socket) {
            try {
                this.socket.close();
            } catch {
                // Ignore
            }
        }
        this.socket = null;
    }

    // Subscriptions
    public onExistingProducers(cb: (data: any[]) => void) {
        this.existingProducersHelper.push(cb);
        return () => this.existingProducersHelper = this.existingProducersHelper.filter(fn => fn !== cb);
    }
    public onNewProducerArrives(cb: (data: any) => void) {
        this.newProducerArrivesHelper.push(cb);
        return () => this.newProducerArrivesHelper = this.newProducerArrivesHelper.filter(fn => fn !== cb);
    }
    public onProducerClosed(cb: (data: any) => void) {
        this.producerClosedHelper.push(cb);
        return () => this.producerClosedHelper = this.producerClosedHelper.filter(fn => fn !== cb);
    }
    public onProducerPaused(cb: (data: any) => void) {
        this.producerPausedHelper.push(cb);
        return () => this.producerPausedHelper = this.producerPausedHelper.filter(fn => fn !== cb);
    }
    public onProducerResumed(cb: (data: any) => void) {
        this.producerResumedHelper.push(cb);
        return () => this.producerResumedHelper = this.producerResumedHelper.filter(fn => fn !== cb);
    }

    public onAvatarState(cb: (data: any) => void) {
        this.avatarStateHelper.push(cb);
        return () => {
            this.avatarStateHelper = this.avatarStateHelper.filter((fn) => fn !== cb);
        };
    }

    public onPeerLeft(cb: (data: any) => void) {
        this.peerLeftHelper.push(cb);
        return () => {
            this.peerLeftHelper = this.peerLeftHelper.filter((fn) => fn !== cb);
        };
    }

    public sendRequest<T>(type: string, data: any = {}): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            if (!this.socket) return reject(new Error("Socket not initialized."));

            const send = () => {
                const id = crypto.randomUUID();
                this.pendingRequests.set(id, { resolve, reject });

                const requestPayload: SocketRequest = { type, data, requestId: id };

                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.socket.send(JSON.stringify(requestPayload));
                } else {
                    reject(new Error("Socket closed before sending"));
                }

                setTimeout(() => {
                    if (this.pendingRequests.has(id)) {
                        this.pendingRequests.delete(id);
                        reject(new Error(`Request ${type} timed out`));
                    }
                }, 5000);
            };

            if (this.socket.readyState === WebSocket.OPEN) {
                send();
            } else if (this.socket.readyState === WebSocket.CONNECTING) {
                const onOpen = () => {
                    this.socket?.removeEventListener('open', onOpen);
                    send();
                };
                this.socket.addEventListener('open', onOpen);
            } else {
                reject(new Error("Socket is closed."));
            }
        });
    }

    // Fire-and-forget signaling (no requestId). Used for presence/avatar sync.
    public emit(type: string, data: any = {}): void {
        if (!this.socket) return;
        if (this.socket.readyState !== WebSocket.OPEN) return; // CRITICAL: only send when OPEN
        this.socket.send(JSON.stringify({ type, data }));
    }
}

const socketService = new SocketService();
export default socketService;
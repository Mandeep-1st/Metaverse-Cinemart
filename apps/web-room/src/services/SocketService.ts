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
}

const socketService = new SocketService();
export default socketService;
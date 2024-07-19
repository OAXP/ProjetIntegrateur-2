import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SocketClientService {
    private clientSocket: Socket;
    private gameRoomId: string;

    get socket(): Socket {
        return this.clientSocket;
    }

    get currentGameRoomId(): string {
        return this.gameRoomId;
    }

    set socket(value: Socket) {
        this.clientSocket = value;
    }

    set currentGameRoomId(value: string) {
        this.gameRoomId = value;
    }

    async connect() {
        if (!this.isSocketAlive()) {
            this.socket = io(environment.serverBaseUrl, { transports: ['websocket'] });
        }
    }

    isSocketAlive() {
        return this.clientSocket && this.clientSocket.connected;
    }

    disconnect() {
        this.clientSocket.disconnect();
    }

    send(event: string, ...args: unknown[]): void {
        if (args.length !== 0) {
            this.clientSocket.emit(event, ...args);
        } else {
            this.clientSocket.emit(event);
        }
    }

    on(event: string, action: (...args: unknown[]) => void): void {
        this.clientSocket.on(event, action);
    }
}

import { TestBed } from '@angular/core/testing';
import { Socket } from 'socket.io-client';
import { SocketClientService } from './socket-client.service';

// eslint-disable-next-line @typescript-eslint/ban-types
type CallbackSignature = (params: unknown) => {};

class SocketTestHelper {
    on(event: string, callback: CallbackSignature): void {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }

        this.callbacks.get(event)?.push(callback);
    }

    // eslint-disable-next-line no-unused-vars
    emit(event: string): void {
        return;
    }

    disconnect(): void {
        return;
    }

    // eslint-disable-next-line @typescript-eslint/member-ordering
    private callbacks = new Map<string, CallbackSignature[]>();
}

// Some tests are from the course's gitlab
// Original author is Nikolay Radoev.
describe('SocketClientService', () => {
    let service: SocketClientService;
    let defaultSocket: Socket;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SocketClientService);
        // eslint-disable-next-line no-undef
        service.socket = new SocketTestHelper() as unknown as Socket;
        defaultSocket = service.socket;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should connect if not connected', (done) => {
        spyOn(service, 'isSocketAlive').and.returnValue(false);
        service.connect().then(() => {
            expect(service.socket).not.toEqual(defaultSocket);
            done();
        });
    });

    it('should not connect if already connected', (done) => {
        spyOn(service, 'isSocketAlive').and.returnValue(true);
        service.connect().then(() => {
            expect(service.socket).toEqual(defaultSocket);
            done();
        });
    });

    it('should disconnect', () => {
        const spy = spyOn(service.socket, 'disconnect');
        service.disconnect();
        expect(spy).toHaveBeenCalled();
    });

    it('isSocketAlive should return true if the socket is still connected', () => {
        service.socket.connected = true;
        const isAlive = service.isSocketAlive();
        expect(isAlive).toBeTruthy();
    });

    it('isSocketAlive should return false if the socket is no longer connected', () => {
        service.socket.connected = false;
        const isAlive = service.isSocketAlive();
        expect(isAlive).toBeFalsy();
    });

    it('isSocketAlive should return false if the socket is not defined', () => {
        (service.socket as unknown) = undefined;
        const isAlive = service.isSocketAlive();
        expect(isAlive).toBeFalsy();
    });

    it('should call socket.on with an event', () => {
        const event = 'helloWorld';
        const action = () => {
            /* action */
        };
        const spy = spyOn(service.socket, 'on');
        service.on(event, action);
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(event, action);
    });

    it('should call emit with data when using send', () => {
        const event = 'helloWorld';
        const data = 42;
        const spy = spyOn(service.socket, 'emit');
        service.send(event, data);
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(event, data);
    });

    it('should call emit without data when using send if data is undefined', () => {
        const event = 'helloWorld';
        const spy = spyOn(service.socket, 'emit');
        service.send(event);
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(event);
    });
});

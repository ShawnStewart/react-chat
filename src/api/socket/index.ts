import { useCallback, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
export type { Socket } from 'socket.io-client';

const SOCKET_SERVER = process.env.NODE_ENV === 'production' ? 'https://api.shawnstewart.me' : 'localhost:8001';

interface UseSocketProps {
    onConnect?: (s: Socket) => void;
    onDisconnect?: (s: Socket) => void;
}

export const useSocket = (props?: UseSocketProps): [Socket | undefined, () => void] => {
    const { onConnect, onDisconnect } = props || {};
    const [socketState, setSocketState] = useState<Socket>();

    const connect = useCallback(() => {
        if (!socketState) {
            const socket = io(SOCKET_SERVER);

            socket.on('connect', () => {
                console.log('%cConnected with socket id:', 'color: green', socket.id);
                setSocketState(socket);

                if (onConnect) {
                    onConnect(socket);
                }
            });
            socket.on('disconnect', () => {
                console.log('%cDisconnected', 'color: red');

                if (onDisconnect) {
                    onDisconnect(socket);
                }
            });
        } else {
            socketState.connect();
        }
    }, [onConnect, onDisconnect, socketState]);

    useEffect(() => {
        connect();

        return () => {
            if (socketState) {
                console.log('%cCleaning up socket id:', 'font-size: 20px;color: red', socketState.id);
                socketState.disconnect();
                setSocketState(undefined);
            }
        };
    }, [connect, onConnect, socketState]);

    return [socketState, connect];
};

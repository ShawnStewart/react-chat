import { FC, FormEventHandler, useEffect, useState } from 'react';
import cx from 'classnames';

import { Socket, useSocket } from 'api/socket';

import styles from './chat.module.scss';
import { useCallback } from 'react';
import { useRef } from 'react';

const WHISPER_REGEX = /^\/whisper\s+([\w\d]{5})\s+(.+)/;

interface Message {
    date: Date;
    message: string;
    from: string;
    to?: string;
}

const Chat: FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [chatLog, setChatLog] = useState<Message[]>([]);
    const [chattingCount, setChattingCount] = useState(0);

    const chatLogRef = useRef<HTMLDivElement>(null);
    const messageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const query = document.querySelectorAll(`.${styles.text}`);
        query[query.length - 1]?.scrollIntoView({ behavior: 'smooth' });
    }, [chatLog]);

    const onSocketConnect = useCallback((socket: Socket) => {
        socket.emit('chat:join', () => setIsLoading(false));
        socket.on('chat:update-log', (chat: Message[]) =>
            setChatLog(chat.map((c) => ({ ...c, date: new Date(c.date) }))),
        );
        socket.on('chat:update-count', (count) => {
            setChattingCount(count - 1);
        });
    }, []);
    const onSocketDisconnect = useCallback(() => {
        setChatLog([]);
        setChattingCount(0);
    }, []);

    const [socket, connect] = useSocket({ onConnect: onSocketConnect, onDisconnect: onSocketDisconnect });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!message) {
            return;
        }

        const whisperParts = message.match(WHISPER_REGEX);
        if (whisperParts) {
            const [_, to, message] = whisperParts;
            socket?.emit('chat:send-whisper', to, message, () => {
                setMessage('');
            });
        } else {
            socket?.emit('chat:send-message', message, () => {
                setMessage('');
            });
        }
    };

    const formatChatHeader = ({ date, from, to }: Message) => {
        let message = from === socket?.id ? `You (${from.slice(0, 5)})` : from.slice(0, 5);

        if (to) {
            message += ` whispered to ${to.slice(0, 5)}`;
        }

        message += ' ' + date.toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit' });

        return message;
    };

    const formatChatMessage = ({ date, to, from, message }: Message) => {
        const canViewMessage = !to || socket?.id.startsWith(to) || socket?.id.startsWith(from);
        const formattedMessage = canViewMessage ? (
            message
        ) : (
            <>
                <i>whispered to</i> <b>{to}</b>
            </>
        );

        return (
            <p key={`${from}-${date.valueOf()}`} className={cx(styles.text, { [styles.whisper]: !!to })}>
                {formattedMessage}
            </p>
        );
    };

    const formatChatLog = () => {
        const messages: JSX.Element[] = [];

        for (let i = 0; i < chatLog.length; i++) {
            const { date, from } = chatLog[i];
            const isYourMessage = from === socket?.id;

            const subsequentMessages: JSX.Element[] = [formatChatMessage(chatLog[i])];

            while (
                from === chatLog[i + 1]?.from &&
                chatLog[i + 1].date.valueOf() - chatLog[i].date.valueOf() < 1000 * 60 * 1
            ) {
                subsequentMessages.push(formatChatMessage(chatLog[i + 1]));
                i++;
            }

            messages.push(
                <div
                    key={`${from}-${date.valueOf()}`}
                    className={cx(styles.message, { [styles.yourMessage]: isYourMessage })}
                >
                    <button
                        className={styles.from}
                        onClick={() => {
                            if (!isYourMessage && !message) {
                                setMessage(`/whisper ${from.slice(0, 5)} `);
                                messageInputRef.current?.focus();
                            }
                        }}
                    >
                        {formatChatHeader(chatLog[i])}
                    </button>
                    {subsequentMessages}
                </div>,
            );
        }

        return messages;
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={cx(styles.title, { [styles.connected]: socket?.connected })}>
                    {isLoading ? 'Loading...' : socket?.connected ? 'Welcome to chat!' : 'Disconnected'}
                </h2>
                <button
                    onClick={() => {
                        if (socket?.connected) {
                            socket.disconnect();
                        } else {
                            connect();
                        }
                    }}
                >
                    {socket?.connected ? 'Disconnect' : 'Connect'}
                </button>
            </div>
            {socket?.connected && (
                <>
                    <h2>
                        {chattingCount} other {chattingCount === 1 ? 'person' : 'people'} connected
                    </h2>
                    <div className={styles.chatLog} ref={chatLogRef}>
                        {formatChatLog()}
                    </div>
                    <form className={styles.newMessageForm} onSubmit={handleSubmit}>
                        <input
                            type="text"
                            value={message}
                            onChange={({ target: { value } }) => {
                                setMessage(value);
                            }}
                            ref={messageInputRef}
                        />
                        <button type="submit">Send</button>
                    </form>
                </>
            )}
        </div>
    );
};

export default Chat;

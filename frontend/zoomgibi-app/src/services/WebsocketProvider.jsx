import { createContext, useEffect, useRef, useState } from "react"
import { v4 as uuidv4 } from 'uuid';

export const WebsocketContext = createContext(false, null, () => { })
export const WebsocketProvider = ({ children }) => {
    const [webSocketUri, setWebSocketUri] = useState("wss:localhost:9443/signal");
    const [isReady, setIsReady] = useState(false)
    const [val, setVal] = useState(null)
    const ws = useRef(null)

    useEffect(() => {
        console.log("websocket initialized...");
        var socket = new WebSocket(webSocketUri);
        const onOpen = () => {
            console.log("connected..");
            setIsReady(true);
        }
        const onClose = () => {
            setIsReady(false);
        }

        socket.onopen = onOpen;
        socket.onclose = onClose;
        socket.onmessage = (event) => {
            console.log("onmessage", event.data);
            if (event.data) {
                try {
                    let msg = JSON.parse(event.data);
                    msg.msgid = uuidv4();
                    setVal(JSON.stringify(msg));
                } catch (error) {

                }
            }
        };
        ws.current = socket;

        setInterval(() => {
            if (socket.readyState == WebSocket.CLOSED) {
                socket = new WebSocket(webSocketUri);
                socket.onopen = onOpen;
                socket.onclose = onClose;
                socket.onmessage = (event) => setVal(event.data);
                ws.current = socket;
            }
        }, 30000);

        return () => {
            socket.close();
        }
    }, [])

    const send = (data) => {
        console.log("send", data);
        if (ws.current && isReady) {
            ws.current.send(JSON.stringify(data));
        }
    }
    // ws.current?.send.bind(ws.current)
    const ret = [isReady, val, send]

    return (
        <WebsocketContext.Provider value={ret}>
            {children}
        </WebsocketContext.Provider>
    )
}
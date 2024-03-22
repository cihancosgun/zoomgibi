import { Button, Col } from 'react-bootstrap';
import './Client.css';
import { useContext, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { WebsocketContext } from './services/WebsocketProvider';


function Client({ me, meetingInfo, userName, clientStream, stream, setStream, clientId }) {
    const [ready, val, send] = useContext(WebsocketContext);
    const [initiated, setInitiated] = useState(false);
    const [videoStream, setVideoStream] = useState(null);
    const [audioStream, setAudioStream] = useState(null);
    const videoRef = useRef();

    useEffect(() => {
        if (!initiated && videoRef.current) {
            setInitiated(true);
            console.log("video current", videoRef.current);
            if (me) {
                navigator.mediaDevices.getUserMedia({
                    video: { deviceId: { exact: meetingInfo.webcam } },
                    audio: { deviceId: { exact: meetingInfo.microphone } }
                })
                    .then((mediaStream) => {                        
                        setStream(mediaStream);
                        setVideoStream(mediaStream.getVideoTracks()[0]);
                        setAudioStream(mediaStream.getAudioTracks()[0]);
                        videoRef.current.srcObject = mediaStream;

                    })
                    .catch((err) => {
                        console.log(err.name + ": " + err.message);
                    });
            } else {
                videoRef.current.srcObject = stream;
                console.log("client stream", stream);
            }
        }

    }, []);


    return (
        <Col md={6} sm={12} lg={4} xl={4} style={{ padding: 5 }}>
            <div className="client">
                <h3>{me ? meetingInfo.hostName : userName}</h3>
                <video ref={videoRef} srcobject={stream} autoPlay>
                </video>
            </div>
        </Col>
    );
}

export default Client;
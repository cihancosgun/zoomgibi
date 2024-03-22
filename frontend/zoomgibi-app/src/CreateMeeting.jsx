import { useContext, useEffect, useState } from 'react'
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Button, Form } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';
import { WebsocketContext } from './services/WebsocketProvider';

function CreateMeeting({ mode, setMode, meetingInfo, setMeetingInfo, setIsHost }) {
    const [meetingId, setMeetingId] = useState(uuidv4());
    const [meetingName, setMeetingName] = useState("TEST");
    const [userName, setUserName] = useState("TEST");
    const [password, setPassword] = useState("123");
    const [webcam, setWebcam] = useState("");
    const [microphone, setMicrophone] = useState("");
    const [webCams, setWebCams] = useState([]);
    const [microphones, setMicrophones] = useState([]);
    const [initiated, setInitiated] = useState(false);
    const [ready, val, send] = useContext(WebsocketContext);

    function getWebCams() {
        navigator.mediaDevices.enumerateDevices()
            .then(function (devices) {
                devices.forEach(function (device) {
                    if (device.kind === 'videoinput') {
                        if (!webcam) {
                            setWebcam(device.deviceId);
                        }
                        setWebCams(prev => [...prev, device]);
                    }
                });
            })
            .catch(function (err) {
                console.log(err.name + ": " + err.message);
            });
    }

    function getMicrophones() {
        navigator.mediaDevices.enumerateDevices()
            .then(function (devices) {
                devices.forEach(function (device) {
                    if (device.kind === 'audioinput') {
                        if (!microphone) {
                            setMicrophone(device.deviceId);
                        }
                        setMicrophones(prev => [...prev, device]);
                    }
                });
            })
            .catch(function (err) {
                console.log(err.name + ": " + err.message);
            });
    }

    function getUserMedia(constraints) {
        return new Promise((resolve, reject) => {
            navigator.mediaDevices.getUserMedia(constraints)
                .then((mediaStream) => {
                    mediaStream.getVideoTracks()[0].stop();
                    mediaStream.getAudioTracks()[0].stop();
                    resolve(mediaStream);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }


    if (!initiated) {
        setInitiated(true);
        console.log("initiated");
        getUserMedia({ video: true, audio: true }).then(stream => {
            getWebCams();
            getMicrophones();
        });
    }

    useEffect(() => {
        if (val) {
            console.log(val);
        }
    }, [val]);

    return (
        <Container>
            <Row>
                <Col><h1>Toplantı Başlat</h1> </Col>
            </Row>
            <Row>
                <Col>
                    <Form style={{ textAlign: 'left' }}>
                        <Form.Group className="mb-3">
                            <Form.Label>Toplantı Kimliği</Form.Label>
                            <Form.Control type="text" disabled placeholder="Toplantı Kimliği" value={meetingId} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Toplantı Parolası</Form.Label>
                            <Form.Control type="password" placeholder="Toplantı Parolası" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Toplantı Adı</Form.Label>
                            <Form.Control type="text" placeholder="Toplantı Adı" value={meetingName} onChange={(e) => setMeetingName(e.target.value)} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Kullanıcı Adınız</Form.Label>
                            <Form.Control type="text" placeholder="Kullanıcı Adınız" value={userName} onChange={(e) => setUserName(e.target.value)} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Kamera</Form.Label>
                            <Form.Select placeholder="Kamera" value={webcam} onChange={(e) => setWebcam(e.target.value)} >
                                <option value="">Kamera seçiniz</option>
                                {webCams.map((webcam) => (
                                    <option key={webcam.deviceId} value={webcam.deviceId}>{webcam.label}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Mikrofon</Form.Label>
                            <Form.Select placeholder="Mikrofon" value={microphone} onChange={(e) => setMicrophone(e.target.value)} >
                                <option value="">Mikrofon seçiniz</option>
                                {microphones.map((microphone) => (
                                    <option key={microphone.deviceId} value={microphone.deviceId}>{microphone.label}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Form>
                </Col>
            </Row>
            <Row>
                <Col>
                    <Button variant="primary" onClick={() => {
                        if (meetingName === "") {
                            alert("Toplantı adınızı giriniz");
                            return;
                        }
                        if (userName === "") {
                            alert("Kullanıcı adınızı giriniz");
                            return;
                        }
                        if (password === "") {
                            alert("Toplantı parolasını giriniz");
                            return;
                        }
                        if (webcam === "") {
                            alert("Bir kamera seçiniz");
                            return;
                        }
                        if (microphone === "") {
                            alert("Bir mikrofon seçiniz");
                            return;
                        }
                        send({
                            "type": "createMeeting", "meetingId": meetingId,
                            "meetingName": meetingName, "password": password,
                            "userName": userName, "webcam": webcam, "microphone": microphone
                        });
                        setMeetingInfo({
                            "meetingId": meetingId, "meetingName": meetingName,
                            "password": password, "hostName": userName,
                            "webcam": webcam, "microphone": microphone
                        });
                        setIsHost(true);
                        setMode(3);                        
                    }}>Toplantıyı Başlat</Button> &nbsp;
                    <Button variant="secondary" onClick={() => {
                        setMode(0);
                    }}>Vazgeç</Button>
                </Col>
            </Row>
        </Container>
    )
}

export default CreateMeeting

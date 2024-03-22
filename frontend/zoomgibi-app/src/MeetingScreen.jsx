import { useContext, useEffect, useState } from 'react'
import './MeetingScreen.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Button, Form, Stack } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';
import { WebsocketContext } from './services/WebsocketProvider';
import Client from './Client';

let initiatedMeetingScreen = false
function MeetingScreen({ meetingInfo, setMeetingInfo, isHost }) {

    const [ready, val, send] = useContext(WebsocketContext);
    const [clientId, setClientId] = useState(uuidv4());
    const [clients, setClients] = useState([]);
    const [stream, setStream] = useState(null);

    const iceconfiguration = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
        iceServers: [{ 'url': 'stun:stun.l.google.com:19302' }]
    };
    const [peerConnections, setPeerConnections] = useState({ [clientId]: new RTCPeerConnection(iceconfiguration) });

    function setClipboardText(text) {
        navigator.clipboard.writeText(text);
    }

    function joinToMeeting(strm) {
        if (!initiatedMeetingScreen) {
            initiatedMeetingScreen = true;
        } else {
            return;
        }
        setStream(strm);
        if (isHost) {
            return;
        }
        console.log("joinTomeeting", isHost);
        peerConnections[clientId].createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true }).then((offer) => {
            peerConnections[clientId].setLocalDescription(offer);
            send({ "meetingId": meetingInfo.meetingId, "type": "offer", "clientId": clientId, "userName": meetingInfo.hostName, "offer": offer });
        });

        peerConnections[clientId].onnegotiationneeded = (event) => {
            console.log("onnegotiationneeded", event);
            peerConnections[clientId].createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true }).then((offer) => {
                peerConnections[clientId].setLocalDescription(offer);
                send({ "meetingId": meetingInfo.meetingId, "type": "offer", "clientId": clientId, "userName": meetingInfo.hostName, "offer": offer });
            });
        }

        peerConnections[clientId].onconnectionstatechange = (event) => {
            console.log('peerConnections[clientId] onconnectionstatechange', peerConnections[clientId].connectionState);
            if (peerConnections[clientId].connectionState == "connected") {
                if (strm) {
                    strm.getTracks().forEach(track => {
                        console.log("track", track);                        
                        peerConnections[clientId].addTrack(track, strm);
                    })
                }
            } else if (peerConnections[clientId].connectionState == "failed") {
                peerConnections[clientId].createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true }).then((offer) => {
                    peerConnections[clientId].setLocalDescription(offer);
                    send({ "meetingId": meetingInfo.meetingId, "type": "offer", "clientId": clientId, "userName": meetingInfo.hostName, "offer": offer });
                });
            }
        }

        peerConnections[clientId].onicecandidate = (event) => {
            if (event.candidate && peerConnections[clientId].remoteDescription != null) {
                send({ "meetingId": meetingInfo.meetingId, "type": event.type, "clientId": clientId, "candidate": event.candidate });
            }
        };

        peerConnections[clientId].ontrack = (e) => {
            console.log('ontrack', e);
            setClients([...clients, { clientId: meetingInfo.meetingId, userName: meetingInfo.hostName, stream: e.streams[0] }]);
        }

    }


    useEffect(() => {
        if (val) {
            let msg = JSON.parse(val);
            if (msg.type == "offer" && msg.meetingId == meetingInfo.meetingId) {
                let newPeerConnection = peerConnections[msg.clientId] || new RTCPeerConnection(iceconfiguration);

                newPeerConnection.onicecandidate = (event) => {
                    if (event.candidate && newPeerConnection.remoteDescription != null) {
                        send({ "meetingId": meetingInfo.meetingId, "type": event.type, "clientId": clientId, "candidate": event.candidate });
                    }
                };

                newPeerConnection.onconnectionstatechange = (event) => {
                    console.log('newPeerConnection onconnectionstatechange', newPeerConnection.connectionState);
                    if (newPeerConnection.connectionState == "connected") {
                        if (stream) {
                            stream.getTracks().forEach(track => {
                                console.log("track", track);                        
                                newPeerConnection.addTrack(track, stream);
                            })
                        }
                    }
                }

                newPeerConnection.ontrack = (e) => {
                    console.log('ontrack', e);
                    setClients([...clients, { clientId: msg.clientId, userName: msg.userName, stream: e.streams[0] }]);
                }

                newPeerConnection.setRemoteDescription(new RTCSessionDescription(msg.offer));
                setPeerConnections({ ...peerConnections, [msg.clientId]: newPeerConnection });
                newPeerConnection.createAnswer().then((answer) => {
                    newPeerConnection.setLocalDescription(answer);
                    send({ "meetingId": meetingInfo.meetingId, "type": "answer", "clientId": clientId, "answer": answer });
                });
            } else if (msg.type == "icecandidate" && msg.meetingId == meetingInfo.meetingId) {
                if (isHost) {
                    if (peerConnections[msg.clientId] && peerConnections[msg.clientId].remoteDescription != null) {
                        peerConnections[msg.clientId].addIceCandidate(new RTCIceCandidate(msg.candidate));
                    }
                } else {
                    if (peerConnections[clientId] && peerConnections[clientId].remoteDescription != null) {
                        peerConnections[clientId].addIceCandidate(new RTCIceCandidate(msg.candidate));
                    }
                }
            } else if (msg.type == "answer" && msg.meetingId == meetingInfo.meetingId) {
                peerConnections[clientId].setRemoteDescription(new RTCSessionDescription(msg.answer));
            }
        }
    }, [val]);

    return (
        <div id='meetingScreen'>
            <Navbar expand="sm" bg="dark" data-bs-theme="dark">
                <Container>
                    <Navbar.Brand href="#" title='Toplantı Kimliğini Kopyalamak İçin Tıklayın' onClick={() => {
                        setClipboardText(meetingInfo.meetingId);
                    }}>Toplantı | {meetingInfo.meetingId} | {meetingInfo.meetingName} </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <Nav.Link href="#home">Home</Nav.Link>
                            <Nav.Link href="#link">Link</Nav.Link>
                            <NavDropdown title="Dropdown" id="basic-nav-dropdown">
                                <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
                                <NavDropdown.Item href="#action/3.2">
                                    Another action
                                </NavDropdown.Item>
                                <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
                                <NavDropdown.Divider />
                                <NavDropdown.Item href="#action/3.4">
                                    Separated link
                                </NavDropdown.Item>
                            </NavDropdown>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            <Row>
                <Client me={true} meetingInfo={meetingInfo} stream={stream} setStream={joinToMeeting} clientId={clientId} />
                {clients.map((client) => {
                    return <Client key={client.clientId} me={false} meetingInfo={meetingInfo} userName={client.userName} clientId={client.clientId} stream={client.stream} />
                })}
            </Row>
        </div>
    )

}

export default MeetingScreen

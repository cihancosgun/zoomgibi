import { useState } from 'react'
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Button, Stack } from 'react-bootstrap';
import CreateMeeting from './CreateMeeting';
import JoinMeeting from './JoinMeeting';
import MeetingScreen from './MeetingScreen';

function App() {
  const [isHost, setIsHost] = useState(false);
  const [mode, setMode] = useState(0);
  const [meetingInfo, setMeetingInfo] = useState({ "meetingId": "", "meetingName": "", "password": "", "userName": "" });

  return (
    <>
      {mode == 0 &&
        <Stack gap={2} className="col-md-5 mx-auto">
          <h1>(: Zoom gibi :)</h1>
          <Button variant="primary" onClick={() => setMode(1)}>Yeni Toplantı Başlat</Button>
          <Button variant="secondary" onClick={() => setMode(2)}>Toplantıya Katıl</Button>
        </Stack>}

      {mode == 1 &&
        <CreateMeeting mode={mode} setMode={setMode} meetingInfo={meetingInfo} setMeetingInfo={setMeetingInfo} setIsHost={setIsHost} />}
      {mode == 2 &&
        <JoinMeeting mode={mode} setMode={setMode} meetingInfo={meetingInfo} setMeetingInfo={setMeetingInfo} setIsHost={setIsHost} />}
      {mode == 3 &&
        <MeetingScreen meetingInfo={meetingInfo} setMeetingInfo={setMeetingInfo} isHost={isHost} />}
    </>
  )
}

export default App

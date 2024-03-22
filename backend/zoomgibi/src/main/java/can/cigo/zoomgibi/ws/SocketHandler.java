package can.cigo.zoomgibi.ws;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

/**
 *
 * @author cihan
 */
@Component
public class SocketHandler extends TextWebSocketHandler {

    public static List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();
    private static final Logger logger = Logger.getLogger("SocketHandler");
    private static final ObjectReader reader = new ObjectMapper().readerFor(Map.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();
    public static Map<String, Map<String, String>> meetings = new HashMap<>();

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message)
            throws InterruptedException, IOException {
        try {
            Map<String, String> map = reader.readValue(message.getPayload());
            if (map != null) {
                if (map.containsKey("type") && map.get("type").equals("createMeeting")) {
                    meetings.put(map.get("meetingId"), map);
                    session.getAttributes().put("meetingId", map.get("meetingId"));
                    logger.log(Level.INFO, "meeting created : {0}", map.get("meetingId"));
                } else if (map.containsKey("type") && map.get("type").equals("joinMeeting")) {
                    if (meetings.containsKey(map.get("meetingId")) && meetings.get(map.get("meetingId")).get("password").equals(map.get("password"))) {
                        session.getAttributes().put("meetingId", map.get("meetingId"));
                        logger.log(Level.INFO, "meeting joined : {0}", map.get("meetingId"));
                        Map<String, String> returnMessage = new HashMap();
                        returnMessage.put("type", "acceptJoin");
                        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(returnMessage)));
                        return;
                    } else {
                        Map<String, String> returnMessage = new HashMap();
                        returnMessage.put("type", "rejectJoin");
                        String strMessage = objectMapper.writeValueAsString(returnMessage);
                        session.sendMessage(new TextMessage(strMessage));
                        logger.log(Level.INFO, "meeting rejected : {0} {1}", new Object[]{map.get("meetingId"), strMessage});
                        return;
                    }
                }
            }
            for (WebSocketSession webSocketSession : sessions) {
                if (webSocketSession.isOpen() && !webSocketSession.getId().equals(session.getId())) {
                    synchronized (webSocketSession) {
                        try {
                            webSocketSession.sendMessage(message);
                        } catch (Exception e) {
                            logger.log(Level.FINE, "Error", e);
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.log(Level.FINE, "Error", e);
        }
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        session.setTextMessageSizeLimit(5000000);
        sessions.add(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        try {
            sessions.remove(session);
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error", e);
        }
    }

}

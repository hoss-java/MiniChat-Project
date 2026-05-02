package com.minichat.listener;

import com.minichat.model.UserSession;
import com.minichat.service.SessionManager;
import com.minichat.dto.OnlineStatusDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.scheduling.annotation.Scheduled;

import java.time.LocalDateTime;

@Component
@Slf4j
public class WebSocketEventListener {
    
    @Autowired
    private SessionManager sessionManager;
    
    @Autowired
    private SimpMessageSendingOperations messagingTemplate;

    @Scheduled(fixedRate = 60000) // Run every 60 seconds
    public void cleanupIdleSessions() {
        sessionManager.cleanupIdleSessions(300); // 5 minutes idle timeout
    }

    
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        // Extract from STOMP headers if not in session attributes
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        String username = (String) headerAccessor.getSessionAttributes().get("username");

        if (userId == null) {
            String userIdStr = headerAccessor.getFirstNativeHeader("userId");
            if (userIdStr != null) {
                userId = Long.parseLong(userIdStr);
                headerAccessor.getSessionAttributes().put("userId", userId);
            }
        }

        if (username == null) {
            username = headerAccessor.getFirstNativeHeader("username");
            if (username != null) {
                headerAccessor.getSessionAttributes().put("username", username);
            }
        }

        String socketSessionId = headerAccessor.getSessionId();
        
        if (userId != null && username != null) {
            if (sessionManager.hasActiveSession(userId)) {
                // Reconnection case
                UserSession session = sessionManager.reconnectUser(userId, socketSessionId);
                sessionManager.restoreRoomMembership(userId);
                
                // Broadcast reconnect status to room if user was in one
                if (session.getRoomId() != null) {
                    messagingTemplate.convertAndSend(
                        "/topic/room/" + session.getRoomId() + "/status",
                        OnlineStatusDto.builder()
                            .userId(userId)
                            .username(username)
                            .status("online")
                            .roomId(session.getRoomId())
                            .timestamp(LocalDateTime.now())
                            .build()
                    );
                }
                
                log.info("User reconnected: userId={}, username={}, roomId={}", 
                    userId, username, session.getRoomId());
            } else {
                // New connection case
                sessionManager.connectUser(userId, username, socketSessionId);
                log.info("User connected: userId={}, username={}", userId, username);
            }
        } else {
            log.warn("Cannot extract userId/username from WebSocket connection");
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        
        if (userId != null && username != null) {
            UserSession session = sessionManager.getSession(userId);
            
            if (session != null) {
                String roomId = session.getRoomId();
                
                // Broadcast offline status before removing
                if (roomId != null) {
                    messagingTemplate.convertAndSend(
                        "/topic/room/" + roomId + "/status",
                        OnlineStatusDto.builder()
                            .userId(userId)
                            .username(username)
                            .status("offline")
                            .roomId(roomId)
                            .timestamp(LocalDateTime.now())
                            .build()
                    );
                }
            }
            
            // Remove from SessionManager
            sessionManager.disconnectUser(userId);
            
            log.info("WebSocket DISCONNECT: userId={}, username={}", userId, username);
        }
    }
}

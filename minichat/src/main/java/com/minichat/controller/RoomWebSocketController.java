package com.minichat.controller;

import com.minichat.dto.OnlineStatusDto;
import com.minichat.model.UserSession;
import com.minichat.security.JwtTokenProvider;
import com.minichat.service.SessionManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.List;

@Controller
@Slf4j
public class RoomWebSocketController {
    
    @Autowired
    private SessionManager sessionManager;
    
    @Autowired
    private SimpMessageSendingOperations messagingTemplate;
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    
    /**
     * Handle user joining a room
     * Client sends to: /app/room/join/{roomId}
     */
    @MessageMapping("/room/join/{roomId}")
    public void joinRoom(
        @DestinationVariable String roomId,
        SimpMessageHeaderAccessor headerAccessor
    ) {
        String username = headerAccessor.getUser().getName();
        Long userId = extractUserIdFromHeader(headerAccessor);
        
        if (userId == null) {
            log.warn("Cannot extract userId for user: {}", username);
            return;
        }
        
        // Add user to room in SessionManager
        sessionManager.joinRoom(userId, roomId);
        
        // Broadcast online status to all room members
        broadcastRoomStatus(roomId, userId, username, "online");
        
        log.info("User joined room: userId={}, roomId={}", userId, roomId);
    }
    
    /**
     * Handle user leaving a room
     * Client sends to: /app/room/leave/{roomId}
     */
    @MessageMapping("/room/leave/{roomId}")
    public void leaveRoom(
        @DestinationVariable String roomId,
        SimpMessageHeaderAccessor headerAccessor
    ) {
        String username = headerAccessor.getUser().getName();
        Long userId = extractUserIdFromHeader(headerAccessor);
        
        if (userId == null) {
            log.warn("Cannot extract userId for user: {}", username);
            return;
        }
        
        // Remove user from room in SessionManager
        sessionManager.leaveRoom(userId, roomId);
        
        // Broadcast offline status to remaining room members
        broadcastRoomStatus(roomId, userId, username, "offline");
        
        log.info("User left room: userId={}, roomId={}", userId, roomId);
    }
    
    /**
     * Broadcast online/offline status to all members in room
     */
    private void broadcastRoomStatus(String roomId, Long userId, String username, String status) {
        OnlineStatusDto statusMessage = OnlineStatusDto.builder()
            .userId(userId)
            .username(username)
            .status(status)
            .roomId(roomId)
            .timestamp(LocalDateTime.now())
            .build();
        
        // Send to all users in room
        messagingTemplate.convertAndSend(
            "/topic/room/" + roomId + "/status",
            statusMessage
        );
        
        log.debug("Broadcasted {} status for user {} in room {}", status, userId, roomId);
    }
    
    /**
     * Extract userId from WebSocket session header
     * (Must be added by WebSocketAuthInterceptor)
     */
    private Long extractUserIdFromHeader(SimpMessageHeaderAccessor headerAccessor) {
        // Try to get from session attributes (if set by interceptor)
        Object userIdObj = headerAccessor.getSessionAttributes().get("userId");
        if (userIdObj instanceof Long) {
            return (Long) userIdObj;
        }
        
        // Fallback: parse from username in principal (if you stored userId in username)
        // This is a workaround; better to store userId in session during auth
        return null;
    }
}

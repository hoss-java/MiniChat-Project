package com.minichat.controller;

import com.minichat.dto.OnlineStatusDto;
import com.minichat.dto.SignalingMessage;
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
import java.util.Map;

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
     * Handle signaling messages (offer, answer, ICE candidates)
     * Relay SDP offers/answers and ICE candidates to specific peer
     * Client sends to: /app/room/signal/{roomId}
     */
    @MessageMapping("/room/signal/{roomId}")
    public void relaySignalingMessage(
        SignalingMessage message,
        @DestinationVariable String roomId,
        SimpMessageHeaderAccessor headerAccessor
    ) {
        String username = headerAccessor.getUser().getName();
        Long senderId = extractUserIdFromHeader(headerAccessor);
        
        // Log: Message received
        log.info("[SIGNALING] Message received - type={}, from={}, to={}, roomId={}", 
            message.getType(), message.getFrom(), message.getTo(), roomId);
        
        // Error: Cannot extract sender ID
        if (senderId == null) {
            log.warn("[SIGNALING] Auth failed - username={}, cannot extract userId", username);
            sendErrorToClient(headerAccessor, "Authentication failed");
            return;
        }
        
        // Validation: Sender in room
        if (!sessionManager.isUserInRoom(senderId, roomId)) {
            log.warn("[SIGNALING] Sender not in room - senderId={}, roomId={}", senderId, roomId);
            sendErrorToClient(headerAccessor, "You are not in this room");
            return;
        }
        log.debug("[SIGNALING] Sender validated - senderId={}, roomId={}", senderId, roomId);
        
        // Validation: Parse recipient ID
        Long recipientId;
        try {
            recipientId = Long.parseLong(message.getTo());
            log.debug("[SIGNALING] Recipient ID parsed - recipientId={}", recipientId);
        } catch (NumberFormatException e) {
            log.error("[SIGNALING] Invalid recipient ID format - to={}, error={}", 
                message.getTo(), e.getMessage());
            sendErrorToClient(headerAccessor, "Invalid recipient ID");
            return;
        }
        
        // Validation: Recipient in room
        if (!sessionManager.isUserInRoom(recipientId, roomId)) {
            log.warn("[SIGNALING] Recipient not in room - recipientId={}, roomId={}", 
                recipientId, roomId);
            sendErrorToClient(headerAccessor, "Peer not found or left room");
            return;
        }
        log.debug("[SIGNALING] Recipient validated - recipientId={}, roomId={}", recipientId, roomId);
        
        // Validation: Message type
        String messageType = message.getType().toLowerCase();
        if (!isValidSignalingType(messageType)) {
            log.error("[SIGNALING] Invalid message type - type={}", message.getType());
            sendErrorToClient(headerAccessor, "Invalid message type");
            return;
        }
        log.debug("[SIGNALING] Message type validated - type={}", messageType);
        
        // Relay: Send to recipient
        try {
            messagingTemplate.convertAndSendToUser(
                recipientId.toString(),
                "/queue/signal",
                message
            );
            
            log.info("[SIGNALING] Relay success - type={}, from={}, to={}, roomId={}, timestamp={}", 
                messageType, senderId, recipientId, roomId, LocalDateTime.now());
                
        } catch (Exception e) {
            log.error("[SIGNALING] Relay failed - type={}, from={}, to={}, roomId={}, error={}", 
                messageType, senderId, recipientId, roomId, e.getMessage());
            sendErrorToClient(headerAccessor, "Failed to relay message. Connection lost?");
        }
    }

    /**
     * Validate signaling message type
     */
    private boolean isValidSignalingType(String type) {
        return type.equals("offer") || type.equals("answer") || type.equals("ice");
    }

    /**
     * Send error message back to client
     */
    private void sendErrorToClient(SimpMessageHeaderAccessor headerAccessor, String errorMessage) {
        try {
            String username = headerAccessor.getUser().getName();
            messagingTemplate.convertAndSendToUser(
                username,
                "/queue/error",
                Map.of("error", errorMessage, "timestamp", LocalDateTime.now())
            );
            log.debug("[SIGNALING] Error sent to client - username={}, error={}", 
                username, errorMessage);
        } catch (Exception e) {
            log.error("[SIGNALING] Failed to send error to client: {}", e.getMessage());
        }
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
     * Extract userId from WebSocket session header or principal
     */
    private Long extractUserIdFromHeader(SimpMessageHeaderAccessor headerAccessor) {
        // Try to get from session attributes (set by WebSocketAuthInterceptor on CONNECT)
        Object userIdObj = headerAccessor.getSessionAttributes().get("userId");
        if (userIdObj instanceof Long) {
            return (Long) userIdObj;
        }
        
        // Fallback: extract from principal name (username), then lookup user
        // Note: This requires additional repository call, so prefer session attributes
        if (headerAccessor.getUser() != null) {
            String username = headerAccessor.getUser().getName();
            log.warn("userId not in session, falling back to username: {}", username);
            // Could add UserRepository.findByUsername(username).getId() here if needed
        }
        
        return null;
    }
}

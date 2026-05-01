package com.minichat.service;

import com.minichat.model.UserSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@Slf4j
public class SessionManager {
    
    // Key: userId, Value: UserSession
    private final Map<Long, UserSession> userSessions = new ConcurrentHashMap<>();
    
    // Key: roomId, Value: Set of userIds in that room
    private final Map<String, Set<Long>> roomMembers = new ConcurrentHashMap<>();
    
    /**
     * Register user as connected
     */
    public UserSession connectUser(Long userId, String username, String socketSessionId) {
        UserSession session = UserSession.builder()
            .userId(userId)
            .username(username)
            .socketSessionId(socketSessionId)
            .connectedAt(LocalDateTime.now())
            .lastActivityAt(LocalDateTime.now())
            .connectionStatus("connected")
            .build();
        
        userSessions.put(userId, session);
        log.info("User connected: userId={}, username={}", userId, username);
        return session;
    }
    
    /**
     * Add user to room
     */
    public void joinRoom(Long userId, String roomId) {
        UserSession session = userSessions.get(userId);
        if (session != null) {
            session.setRoomId(roomId);
            session.setLastActivityAt(LocalDateTime.now());
            
            roomMembers.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet()).add(userId);
            log.info("User joined room: userId={}, roomId={}", userId, roomId);
        }
    }
    
    /**
     * Remove user from room
     */
    public void leaveRoom(Long userId, String roomId) {
        UserSession session = userSessions.get(userId);
        if (session != null) {
            session.setRoomId(null);
            session.setLastActivityAt(LocalDateTime.now());
            
            Set<Long> members = roomMembers.get(roomId);
            if (members != null) {
                members.remove(userId);
                if (members.isEmpty()) {
                    roomMembers.remove(roomId);
                }
            }
            log.info("User left room: userId={}, roomId={}", userId, roomId);
        }
    }
    
    /**
     * Disconnect user
     */
    public void disconnectUser(Long userId) {
        UserSession session = userSessions.remove(userId);
        if (session != null) {
            String roomId = session.getRoomId();
            if (roomId != null) {
                leaveRoom(userId, roomId);
            }
            log.info("User disconnected: userId={}", userId);
        }
    }
    
    /**
     * Get all users in a room
     */
    public List<UserSession> getRoomMembers(String roomId) {
        Set<Long> userIds = roomMembers.getOrDefault(roomId, new HashSet<>());
        return userIds.stream()
            .map(userSessions::get)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
    }

    /**
     * Restore user to their previous room after reconnect
     */
    public void restoreRoomMembership(Long userId) {
        UserSession session = userSessions.get(userId);
        
        if (session != null && session.getRoomId() != null) {
            String roomId = session.getRoomId();
            Set<Long> members = roomMembers.get(roomId);
            
            if (members != null && !members.contains(userId)) {
                members.add(userId);
                log.info("Room membership restored: userId={}, roomId={}", userId, roomId);
            }
        }
    }
    
    /**
     * Get online user count in room
     */
    public int getRoomMemberCount(String roomId) {
        return roomMembers.getOrDefault(roomId, new HashSet<>()).size();
    }
    
    /**
     * Get user session by userId
     */
    public UserSession getSession(Long userId) {
        return userSessions.get(userId);
    }
    
    /**
     * Check if user is online
     */
    public boolean isUserOnline(Long userId) {
        UserSession session = userSessions.get(userId);
        return session != null && session.isActive();
    }
    
    /**
     * Update last activity
     */
    public void updateLastActivity(Long userId) {
        UserSession session = userSessions.get(userId);
        if (session != null) {
            session.setLastActivityAt(LocalDateTime.now());
        }
    }
    
    /**
     * Get all online users
     */
    public List<UserSession> getAllOnlineUsers() {
        return userSessions.values().stream()
            .filter(UserSession::isActive)
            .collect(Collectors.toList());
    }

    /**
     * Check if user already has an active session
     */
    public boolean hasActiveSession(Long userId) {
        return userSessions.containsKey(userId) && isUserOnline(userId);
    }

    /**
     * Reconnect existing user (update socket session ID)
     */
    public UserSession reconnectUser(Long userId, String newSocketSessionId) {
        UserSession session = userSessions.get(userId);
        
        if (session != null) {
            session.setSocketSessionId(newSocketSessionId);
            session.setLastActivityAt(LocalDateTime.now());
            session.setConnectionStatus("connected");
            
            log.info("User reconnected: userId={}, oldSocketId={}, newSocketId={}", 
                userId, session.getSocketSessionId(), newSocketSessionId);
            
            return session;
        }
        
        return null;
    }

    /**
     * Mark user as idle (no activity for X seconds)
     */
    public void markUserIdle(Long userId) {
        UserSession session = userSessions.get(userId);
        if (session != null) {
            session.setConnectionStatus("idle");
            log.info("User marked idle: userId={}", userId);
        }
    }

    /**
     * Clean up idle sessions (called by scheduled task)
     */
    public void cleanupIdleSessions(long idleTimeoutSeconds) {
        LocalDateTime cutoffTime = LocalDateTime.now().minusSeconds(idleTimeoutSeconds);
        
        List<Long> idleUserIds = userSessions.entrySet().stream()
            .filter(entry -> "idle".equals(entry.getValue().getConnectionStatus()))
            .filter(entry -> entry.getValue().getLastActivityAt().isBefore(cutoffTime))
            .map(Map.Entry::getKey)
            .collect(Collectors.toList());
        
        idleUserIds.forEach(userId -> {
            UserSession session = userSessions.get(userId);
            if (session != null && session.getRoomId() != null) {
                String roomId = session.getRoomId();
                disconnectUser(userId);
                log.info("Idle session cleaned up: userId={}, roomId={}", userId, roomId);
            }
        });
    }
}

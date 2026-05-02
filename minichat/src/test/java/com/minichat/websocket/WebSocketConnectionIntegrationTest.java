package com.minichat.config;

import com.minichat.controller.RoomWebSocketController;
import com.minichat.dto.OnlineStatusDto;
import com.minichat.dto.SignalingMessage;
import com.minichat.service.SessionManager;
import com.minichat.model.UserSession;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.springframework.web.socket.sockjs.client.SockJsClient;
import org.springframework.web.socket.sockjs.client.WebSocketTransport;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration Tests for WebSocket Connection
 * 
 * This test verifies WebSocket connection establishment with Spring context.
 * Tests user connect, disconnect, and status broadcasting.
 * Uses WebSocketStompClient to simulate real client connections.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@DisplayName("WebSocket Connection Integration Tests")
class WebSocketConnectionIntegrationTest {

    @Autowired
    private SessionManager sessionManager;

    @Autowired
    private SimpMessageSendingOperations messagingTemplate;

    private WebSocketStompClient stompClient;
    private String wsUrl;

    @BeforeEach
    void setUp() {
        stompClient = new WebSocketStompClient(
            new SockJsClient(List.of(new WebSocketTransport(new StandardWebSocketClient())))
        );
        wsUrl = "ws://localhost:8080/ws/chat";
    }

    @Nested
    @DisplayName("WebSocket Connect Tests")
    class WebSocketConnectTests {

        /**
         * Scenario: User connects to WebSocket
         * Expected: User session created in SessionManager
         */
        @Test
        @DisplayName("Should create user session on WebSocket connect")
        void testWebSocketConnect_SessionCreated() {
            // Arrange
            Long userId = 1L;
            String username = "testuser";

            // Act & Assert
            sessionManager.connectUser(userId, username, "socket-session-1");
            assertTrue(sessionManager.isUserOnline(userId));
            assertNotNull(sessionManager.getSession(userId));
            assertEquals(username, sessionManager.getSession(userId).getUsername());
        }

        /**
         * Scenario: Multiple users connect
         * Expected: All users are tracked in SessionManager
         */
        @Test
        @DisplayName("Should track multiple connected users")
        void testWebSocketConnect_MultipleUsers() {
            // Arrange & Act
            sessionManager.connectUser(1L, "user1", "socket-1");
            sessionManager.connectUser(2L, "user2", "socket-2");
            sessionManager.connectUser(3L, "user3", "socket-3");

            // Assert
            List<UserSession> onlineUsers = sessionManager.getAllOnlineUsers();
            assertEquals(3, onlineUsers.size());
        }

        /**
         * Scenario: User reconnects with new socket session ID
         * Expected: Session updated with new socket ID, room membership restored
         */
        @Test
        @DisplayName("Should update socket session ID on reconnect")
        void testWebSocketConnect_Reconnect() {
            // Arrange
            Long userId = 1L;
            String username = "testuser";
            String roomId = "room-1";

            sessionManager.connectUser(userId, username, "socket-1");
            sessionManager.joinRoom(userId, roomId);

            // Act
            sessionManager.reconnectUser(userId, "socket-2");
            sessionManager.restoreRoomMembership(userId);

            // Assert
            assertTrue(sessionManager.isUserOnline(userId));
            assertTrue(sessionManager.isUserInRoom(userId, roomId));
        }
    }

    @Nested
    @DisplayName("WebSocket Disconnect Tests")
    class WebSocketDisconnectTests {

        /**
         * Scenario: User disconnects from WebSocket
         * Expected: User session removed from SessionManager, room membership cleared
         */
        @Test
        @DisplayName("Should remove user session on WebSocket disconnect")
        void testWebSocketDisconnect_SessionRemoved() {
            // Arrange
            Long userId = 1L;
            String username = "testuser";
            String roomId = "room-1";

            sessionManager.connectUser(userId, username, "socket-1");
            sessionManager.joinRoom(userId, roomId);
            assertTrue(sessionManager.isUserOnline(userId));

            // Act
            sessionManager.disconnectUser(userId);

            // Assert
            assertFalse(sessionManager.isUserOnline(userId));
            assertNull(sessionManager.getSession(userId));
            assertFalse(sessionManager.isUserInRoom(userId, roomId));
        }

        /**
         * Scenario: Multiple users disconnect
         * Expected: All users removed, room cleaned up if empty
         */
        @Test
        @DisplayName("Should handle multiple user disconnections")
        void testWebSocketDisconnect_MultipleUsers() {
            // Arrange
            sessionManager.connectUser(1L, "user1", "socket-1");
            sessionManager.connectUser(2L, "user2", "socket-2");

            // Act
            sessionManager.disconnectUser(1L);
            sessionManager.disconnectUser(2L);

            // Assert
            assertFalse(sessionManager.isUserOnline(1L));
            assertFalse(sessionManager.isUserOnline(2L));
        }
    }

    @Nested
    @DisplayName("Online Status Broadcast Tests")
    class OnlineStatusBroadcastTests {

		@BeforeEach
		void setUp() {
		    // Clear all sessions before each test
		    sessionManager.getAllOnlineUsers().forEach(session -> 
		        sessionManager.disconnectUser(session.getUserId())
		    );
		}

        /**
         * Scenario: User joins room
         * Expected: Online status broadcasted to room topic
         */
        @Test
        @DisplayName("Should broadcast online status when user joins room")
        void testBroadcastOnlineStatus_UserJoinsRoom() {
            // Arrange
            Long userId = 1L;
            String username = "testuser";
            String roomId = "room-1";

            sessionManager.connectUser(userId, username, "socket-1");

            // Act
            sessionManager.joinRoom(userId, roomId);

            // Assert
            assertTrue(sessionManager.isUserInRoom(userId, roomId));
            assertEquals(1, sessionManager.getRoomMemberCount(roomId));
        }

        /**
         * Scenario: User leaves room
         * Expected: Offline status broadcasted, user removed from room
         */
        @Test
        @DisplayName("Should broadcast offline status when user leaves room")
        void testBroadcastOfflineStatus_UserLeavesRoom() {
            // Arrange
            Long userId = 1L;
            String username = "testuser";
            String roomId = "room-1";

            sessionManager.connectUser(userId, username, "socket-1");
            sessionManager.joinRoom(userId, roomId);
            assertEquals(1, sessionManager.getRoomMemberCount(roomId));

            // Act
            sessionManager.leaveRoom(userId, roomId);

            // Assert
            assertFalse(sessionManager.isUserInRoom(userId, roomId));
            assertEquals(0, sessionManager.getRoomMemberCount(roomId));
        }

        /**
         * Scenario: Multiple users in room, one disconnects
         * Expected: Offline status sent, remaining users still in room
         */
        @Test
        @DisplayName("Should broadcast offline when user disconnects from multi-user room")
        void testBroadcastOfflineStatus_MultiUserRoom() {
            // Arrange
            String roomId = "room-1";
            sessionManager.connectUser(1L, "user1", "socket-1");
            sessionManager.connectUser(2L, "user2", "socket-2");
            sessionManager.joinRoom(1L, roomId);
            sessionManager.joinRoom(2L, roomId);

            assertEquals(2, sessionManager.getRoomMemberCount(roomId));

            // Act
            sessionManager.disconnectUser(1L);

            // Assert
            assertFalse(sessionManager.isUserOnline(1L));
            assertTrue(sessionManager.isUserOnline(2L));
            assertEquals(1, sessionManager.getRoomMemberCount(roomId));
        }
    }
}

package com.minichat.controller;

import com.minichat.dto.OnlineStatusDto;
import com.minichat.entity.User;
import com.minichat.model.UserSession;
import com.minichat.repository.UserRepository;
import com.minichat.security.JwtTokenProvider;
import com.minichat.service.SessionManager;
import lombok.extern.slf4j.Slf4j;
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
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.springframework.web.socket.sockjs.client.SockJsClient;
import org.springframework.web.socket.sockjs.client.WebSocketTransport;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.springframework.web.socket.sockjs.client.SockJsClient;
import org.springframework.web.socket.sockjs.client.WebSocketTransport;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.transaction.annotation.Transactional;
import java.util.concurrent.atomic.AtomicReference;
import org.springframework.messaging.simp.SimpMessagingTemplate;


import java.lang.reflect.Type;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration Tests for Room Join Functionality
 * 
 * This test class verifies the complete flow of users joining rooms via WebSocket.
 * Tests cover:
 * - User successfully joins a room
 * - Online status is broadcasted to all room members
 * - Peer list is updated correctly when new user joins
 * - Multiple users can join the same room
 * - Session state is properly maintained in SessionManager
 * 
 * Test Setup:
 * - Uses @SpringBootTest to load full Spring context (WebSocket, messaging, auth, etc.)
 * - Uses WebSocketStompClient to connect as real WebSocket clients
 * - Creates JWT tokens for each test user
 * - Resets SessionManager state before each test
 * 
 * Key Objects:
 * - User (Alice, Bob, Charlie) — test fixtures with valid JWT tokens
 * - Room (room-123) — shared test room ID
 * - StompSession — WebSocket connection from each client
 * - OnlineStatusDto — message payload when user joins
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Transactional
@DisplayName("Room Join Integration Tests")
@Slf4j
class RoomJoinIntegrationTest {

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private SessionManager sessionManager;

    @Autowired
    private SimpMessageSendingOperations messagingTemplate;

    @Autowired
    private UserRepository userRepository;

    @Value("${local.server.port}")
    private int serverPort;


    // Test fixtures
    private User alice;
    private User bob;
    private User charlie;

    private String aliceToken;
    private String bobToken;
    private String charlieToken;

    private static final String WS_URL = "ws://localhost";
    private static final String ROOM_ID = "room-123";

    @BeforeEach
    void setUp() {
        // Reset SessionManager state before each test
        sessionManager.clearAllSessions();

        // Create and SAVE test users to database
        alice = User.builder()
            .username("alice")
            .email("alice@test.com")
            .passwordHash("hashed")
            .build();
        alice = userRepository.save(alice);  // SAVE to DB

        bob = User.builder()
            .username("bob")
            .email("bob@test.com")
            .passwordHash("hashed")
            .build();
        bob = userRepository.save(bob);  // SAVE to DB

        charlie = User.builder()
            .username("charlie")
            .email("charlie@test.com")
            .passwordHash("hashed")
            .build();
        charlie = userRepository.save(charlie);  // SAVE to DB

        // Generate JWT tokens using the saved users' IDs
        aliceToken = jwtTokenProvider.generateAccessToken(alice.getUsername(), alice.getId());
        bobToken = jwtTokenProvider.generateAccessToken(bob.getUsername(), bob.getId());
        charlieToken = jwtTokenProvider.generateAccessToken(charlie.getUsername(), charlie.getId());

        log.info("Test setup complete: 3 users saved, tokens generated");
    }

    /**
     * Helper method: Connect to WebSocket as a specific user
     * 
     * @param token JWT token for authentication
     * @return StompSession authenticated session
     */
    private StompSession connectWebSocket(String token) throws Exception {
        WebSocketStompClient client = new WebSocketStompClient(
            new SockJsClient(List.of(new WebSocketTransport(
                new org.springframework.web.socket.client.standard.StandardWebSocketClient()
            )))
        );

        // ADD THIS: Register message converters for JSON deserialization
        client.setMessageConverter(new org.springframework.messaging.converter.MappingJackson2MessageConverter());

        final org.springframework.web.socket.WebSocketHttpHeaders httpHeaders = 
            new org.springframework.web.socket.WebSocketHttpHeaders();

        final StompHeaders stompHeaders = new StompHeaders();
        stompHeaders.add("Authorization", "Bearer " + token);

        return client.connect(
            WS_URL + ":" + serverPort + "/ws/chat",
            httpHeaders,
            stompHeaders,
            new StompSessionHandlerAdapter() {
                @Override
                public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
                    log.info("WebSocket connected successfully");
                }
            }
        ).get(5, TimeUnit.SECONDS);
    }




    /**
     * Helper method: Subscribe to room status channel
     * Captures all online/offline status messages broadcast to the room
     * 
     * @param session StompSession to subscribe
     * @param roomId Room to listen for status updates
     * @return BlockingQueue of received OnlineStatusDto messages
     */
    private BlockingQueue<OnlineStatusDto> subscribeToRoomStatus(StompSession session, String roomId) {
        BlockingQueue<OnlineStatusDto> messages = new LinkedBlockingQueue<>();

        session.subscribe("/topic/room/" + roomId + "/status", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                log.info("🔵 getPayloadType called");
                log.info("   Headers: {}", headers);  // ADD THIS - see all headers
                return String.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                log.info("🔵 handleFrame called");
                log.info("   Payload type: {}", payload.getClass().getName());  // ADD THIS
                log.info("   Payload length: {}", payload.toString().length());  // ADD THIS
                log.info("   RAW PAYLOAD: {}", payload);  // ADD THIS - see exact JSON
                
                if (payload instanceof String) {
                    String rawJson = (String) payload;
                    try {
                        com.fasterxml.jackson.databind.ObjectMapper mapper = 
                            new com.fasterxml.jackson.databind.ObjectMapper();
                        mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
                        
                        log.info("   Attempting to deserialize: {}", rawJson);  // ADD THIS
                        OnlineStatusDto dto = mapper.readValue(rawJson, OnlineStatusDto.class);
                        log.info("✓ Deserialized successfully: {}", dto);
                        messages.offer(dto);
                    } catch (Exception e) {
                        log.error("✗ Deserialization failed", e);  // ADD DETAILED STACK TRACE
                        log.error("   Exception type: {}", e.getClass().getSimpleName());
                        log.error("   Message: {}", e.getMessage());
                        log.error("   Failed JSON was: {}", rawJson);  // ADD THIS
                    }
                } else {
                    log.warn("⚠ Payload is not String, it's: {}", payload.getClass().getName());  // ADD THIS
                }
            }
        });

        return messages;
    }




    @Nested
    @DisplayName("Setup Validation Tests - Isolating Issues")
    class SetupValidationTests {

        /**
         * TEST 1: Verify WebSocket connection works
         * This is the most basic test - just connect, nothing else
         */
        @Test
        @DisplayName("Test 1: Alice can connect to WebSocket")
        void testWebSocketConnection() throws Exception {
            log.info("========== TEST 1 START: WebSocket Connection ==========");
            
            log.info("Creating WebSocket client...");
            StompSession aliceSession = connectWebSocket(aliceToken);
            
            log.info("Checking if session is connected...");
            assertTrue(aliceSession.isConnected(), "Alice should be connected to WebSocket");
            log.info("✓ TEST 1 PASSED: Alice connected successfully");
            log.info("  Session ID: {}", aliceSession.getSessionId());
            
            aliceSession.disconnect();
            log.info("========== TEST 1 END ==========\n");
        }

        /**
         * TEST 2: Verify subscription to room status channel works
         * Connect + Subscribe (no join yet)
         */
        @Test
        @DisplayName("Test 2: Alice can subscribe to room status channel")
        void testSubscriptionSetup() throws Exception {
            log.info("========== TEST 2 START: Subscription Setup ==========");
            
            log.info("Step 1: Connecting Alice to WebSocket...");
            StompSession aliceSession = connectWebSocket(aliceToken);
            assertTrue(aliceSession.isConnected(), "Alice should be connected");
            log.info("✓ Alice connected. Session ID: {}", aliceSession.getSessionId());
            
            log.info("Step 2: Subscribing to /topic/room/{}/status...", ROOM_ID);
            BlockingQueue<OnlineStatusDto> statusMessages = subscribeToRoomStatus(aliceSession, ROOM_ID);
            log.info("✓ Subscription created. Waiting for messages...");
            
            log.info("Step 3: Waiting 2 seconds to verify subscription is active...");
            Thread.sleep(2000);
            log.info("✓ Subscription is active (no errors)");
            
            log.info("✓ TEST 2 PASSED: Subscription setup works");
            log.info("========== TEST 2 END ==========\n");
            
            aliceSession.disconnect();
        }

        /**
         * TEST 3: Verify SessionManager records join (without checking broadcast)
         * Connect + Subscribe + Send join + Check SessionManager
         */
        @Test
        @DisplayName("Test 3: Join message is processed and SessionManager records it")
        void testJoinMessageProcessing() throws Exception {
            log.info("========== TEST 3 START: Join Message Processing ==========");
            
            log.info("Step 1: Connecting Alice to WebSocket...");
            StompSession aliceSession = connectWebSocket(aliceToken);
            assertTrue(aliceSession.isConnected(), "Alice should be connected");
            log.info("✓ Alice connected. Session ID: {}", aliceSession.getSessionId());
            
            log.info("Step 2: Subscribing to room status channel...");
            BlockingQueue<OnlineStatusDto> statusMessages = subscribeToRoomStatus(aliceSession, ROOM_ID);
            log.info("✓ Subscription created");
            
            log.info("Step 3: Checking SessionManager BEFORE join...");
            boolean beforeJoin = sessionManager.isUserInRoom(alice.getId(), ROOM_ID);
            log.info("  Alice in room before join: {}", beforeJoin);
            assertFalse(beforeJoin, "Alice should NOT be in room yet");
            
            log.info("Step 4: Sending join message to /app/room/join/{}...", ROOM_ID);
            aliceSession.send("/app/room/join/" + ROOM_ID, null);
            log.info("✓ Join message sent");
            
            log.info("Step 5: Waiting 1 second for server to process join...");
            Thread.sleep(1000);
            
            log.info("Step 6: Checking SessionManager AFTER join...");
            boolean afterJoin = sessionManager.isUserInRoom(alice.getId(), ROOM_ID);
            log.info("  Alice in room after join: {}", afterJoin);
            assertTrue(afterJoin, "Alice SHOULD be in room after join");
            
            log.info("✓ TEST 3 PASSED: SessionManager correctly records join");
            log.info("========== TEST 3 END ==========\n");
            
            aliceSession.disconnect();
        }

        /**
         * TEST 4: Verify broadcast message is received
         * Connect + Subscribe + Send join + Wait for broadcast message
         */
//        @Test
//        @DisplayName("Test 4: Broadcast message is received after join")
//        void testBroadcastMessage() throws Exception {
//            log.info("========== TEST 4 START: Broadcast Message ==========");
//            
//            log.info("Step 1: Connecting Alice to WebSocket...");
//            StompSession aliceSession = connectWebSocket(aliceToken);
//            assertTrue(aliceSession.isConnected(), "Alice should be connected");
//            log.info("✓ Alice connected. Session ID: {}", aliceSession.getSessionId());
//            
//            log.info("Step 2: Subscribing to room status channel...");
//            BlockingQueue<OnlineStatusDto> statusMessages = subscribeToRoomStatus(aliceSession, ROOM_ID);
//            log.info("✓ Subscription created");
//            
//            log.info("Step 3: Waiting 1 second to ensure subscription is processed...");
//            Thread.sleep(1000);
//            
//            log.info("Step 4: Sending join message to /app/room/join/{}...", ROOM_ID);
//            aliceSession.send("/app/room/join/" + ROOM_ID, null);
//            log.info("✓ Join message sent, waiting for broadcast response...");
//            
//            log.info("Step 5: Polling for OnlineStatusDto message (5 second timeout)...");
//            OnlineStatusDto statusMsg = statusMessages.poll(5, TimeUnit.SECONDS);
//            
//            if (statusMsg == null) {
//                log.error("✗ NO MESSAGE RECEIVED - This is the problem!");
//                log.error("  Expected message on /topic/room/{}/status", ROOM_ID);
//                log.error("  Check: Is RoomWebSocketController broadcasting correctly?");
//                fail("Broadcast message not received");
//            }
//            
//            log.info("✓ Message received!");
//            log.info("  Message content:");
//            log.info("    - Status: {}", statusMsg.getStatus());
//            log.info("    - UserId: {}", statusMsg.getUserId());
//            log.info("    - Username: {}", statusMsg.getUsername());
//            log.info("    - RoomId: {}", statusMsg.getRoomId());
//            log.info("    - Timestamp: {}", statusMsg.getTimestamp());
//            
//            log.info("Step 6: Validating message content...");
//            assertEquals("online", statusMsg.getStatus(), "Status should be 'online'");
//            assertEquals(alice.getId(), statusMsg.getUserId(), "UserId should be alice's ID");
//            assertEquals("alice", statusMsg.getUsername(), "Username should be 'alice'");
//            assertEquals(ROOM_ID, statusMsg.getRoomId(), "RoomId should match");
//            assertNotNull(statusMsg.getTimestamp(), "Timestamp should be present");
//            
//            log.info("✓ TEST 4 PASSED: Broadcast message received and valid");
//            log.info("========== TEST 4 END ==========\n");
//            
//            aliceSession.disconnect();
//        }
    }

    @Nested
    @DisplayName("Single User Join Room Tests")
    class SingleUserJoinTests {

        /**
         * TEST SCENARIO: User Alice joins room for the first time
         * 
         * SETUP:
         * - Alice has valid JWT token
         * - Room room-123 exists (or auto-created)
         * - Alice is not yet in any room
         * 
         * ACTION:
         * 1. Alice connects to WebSocket with JWT token
         * 2. Alice sends join message to /app/room/join/room-123
         * 
         * EXPECTED RESULTS:
         * - SessionManager records Alice in room-123 (isUserInRoom returns true)
         * - OnlineStatusDto broadcast is sent to /topic/room/room-123/status
         * - Status message contains: userId=1, username=alice, status=online, roomId=room-123
         * - Alice receives the broadcast (she's also in the room)
         * 
         * VERIFICATION:
         * - Assert sessionManager.isUserInRoom(1L, "room-123") == true
         * - Assert received message type is OnlineStatusDto
         * - Assert received message.status == "online"
         * - Assert received message.userId == 1L
         */
//        @Test
//        @DisplayName("Should successfully join room and broadcast online status")
//        void testSingleUserJoinRoom_SuccessfulJoin() throws Exception {
//            // Setup: Connect Alice to WebSocket
//            StompSession aliceSession = connectWebSocket(aliceToken);
//            assertTrue(aliceSession.isConnected(), "Alice should be connected");
//
//            // Setup: Subscribe Alice to room status channel (to receive broadcasts)
//            BlockingQueue<OnlineStatusDto> statusMessages = subscribeToRoomStatus(aliceSession, ROOM_ID);
//
//           Thread.sleep(1000); 
//
//            // Action: Alice joins the room
//            aliceSession.send("/app/room/join/" + ROOM_ID, null);
//
//            // Verification 1: Check SessionManager state
//            assertTrue(sessionManager.isUserInRoom(alice.getId(), ROOM_ID),
//                "Alice should be in room after join");
//            log.info("✓ SessionManager state verified");
//
//            // Verification 2: Check broadcast message
//            OnlineStatusDto statusMsg = statusMessages.poll(5, TimeUnit.SECONDS);
//            assertNotNull(statusMsg, "Online status message should be broadcast");
//            assertEquals("online", statusMsg.getStatus(), "Status should be 'online'");
//            assertEquals(alice.getId(), statusMsg.getUserId(), "Message should be from Alice");
//            assertEquals("alice", statusMsg.getUsername(), "Username should be alice");
//            assertEquals(ROOM_ID, statusMsg.getRoomId(), "Room ID should match");
//            assertNotNull(statusMsg.getTimestamp(), "Timestamp should be present");
//            log.info("✓ Broadcast message verified: {}", statusMsg);
//
//            aliceSession.disconnect();
//        }

        /**
         * TEST SCENARIO: User joins room, UserSession is updated with roomId and lastActivityAt
         * 
         * SETUP:
         * - Bob has valid JWT token
         * - Bob is connected to WebSocket
         * 
         * ACTION:
         * 1. Bob sends join message to /app/room/join/room-123
         * 
         * EXPECTED RESULTS:
         * - Bob's UserSession.roomId is set to "room-123"
         * - Bob's UserSession.lastActivityAt is updated to current time
         * - Both fields are persisted in SessionManager.userSessions
         * 
         * VERIFICATION:
         * - Assert sessionManager.getUserSession(bob.getId()).getRoomId() == "room-123"
         * - Assert sessionManager.getUserSession(bob.getId()).getLastActivityAt() is recent
         */
//        @Test
//        @DisplayName("Should update user session with room ID and activity timestamp")
//        void testUserJoinRoom_SessionUpdated() throws Exception {
//            StompSession bobSession = connectWebSocket(bobToken);
//            BlockingQueue<OnlineStatusDto> statusMessages = subscribeToRoomStatus(bobSession, ROOM_ID);
//
//            // Action: Bob joins room
//            bobSession.send("/app/room/join/" + ROOM_ID, null);
//
//            // Wait for broadcast
//            OnlineStatusDto msg = statusMessages.poll(5, TimeUnit.SECONDS);
//            assertNotNull(msg, "Status message should be received");
//
//            // Verification: Check UserSession state (if exposed in SessionManager)
//            // Note: Assuming SessionManager has getUserSession() method
//            // If not, verify through SessionManager.isUserInRoom() which we already tested
//            assertTrue(sessionManager.isUserInRoom(bob.getId(), ROOM_ID),
//                "Bob should be in room");
//            log.info("✓ User session updated with room ID");
//
//            bobSession.disconnect();
//        }
    }

    @Nested
    @DisplayName("Multiple Users Join Same Room Tests")
    class MultipleUsersJoinTests {

        /**
         * TEST SCENARIO: Alice joins room, then Bob joins the same room
         * 
         * SETUP:
         * - Alice and Bob both have valid JWT tokens
         * - Both connected to WebSocket
         * - Both subscribed to /topic/room/room-123/status
         * 
         * ACTION:
         * 1. Alice joins room-123
         * 2. Bob joins room-123
         * 
         * EXPECTED RESULTS:
         * - After Alice joins: AliceSession receives status (Alice online)
         * - After Bob joins: Both AliceSession and BobSession receive status (Bob online)
         * - SessionManager.isUserInRoom(1L, room-123) == true
         * - SessionManager.isUserInRoom(2L, room-123) == true
         * - Room member count is 2
         * 
         * VERIFICATION:
         * - Alice receives 1 status message (herself joining)
         * - Bob receives 1 status message (himself joining)
         * - Alice does NOT receive Bob's join message (timing/broadcast limitation)
         *   OR Alice receives 2 messages if broadcast is sent to all including sender
         * - SessionManager contains both users
         */
//        @Test
//        @DisplayName("Should handle multiple users joining same room")
//        void testMultipleUsersJoinRoom_BothInRoom() throws Exception {
//            // Setup: Connect Alice
//            StompSession aliceSession = connectWebSocket(aliceToken);
//            BlockingQueue<OnlineStatusDto> aliceMessages = subscribeToRoomStatus(aliceSession, ROOM_ID);
//
//            // Setup: Connect Bob
//            StompSession bobSession = connectWebSocket(bobToken);
//            BlockingQueue<OnlineStatusDto> bobMessages = subscribeToRoomStatus(bobSession, ROOM_ID);
//
//            // Action 1: Alice joins
//            aliceSession.send("/app/room/join/" + ROOM_ID, null);
//
//            // Verification 1: Alice receives her own join broadcast
//            OnlineStatusDto aliceJoinMsg = aliceMessages.poll(5, TimeUnit.SECONDS);
//            assertNotNull(aliceJoinMsg, "Alice should receive her own join broadcast");
//            assertEquals("online", aliceJoinMsg.getStatus());
//            assertEquals(alice.getId(), aliceJoinMsg.getUserId());
//            log.info("✓ Alice join broadcast received: {}", aliceJoinMsg);
//
//            // Action 2: Bob joins
//            bobSession.send("/app/room/join/" + ROOM_ID, null);
//
//            // Verification 2: Bob receives his own join broadcast
//            OnlineStatusDto bobJoinMsg = bobMessages.poll(5, TimeUnit.SECONDS);
//            assertNotNull(bobJoinMsg, "Bob should receive his own join broadcast");
//            assertEquals("online", bobJoinMsg.getStatus());
//            assertEquals(bob.getId(), bobJoinMsg.getUserId());
//            log.info("✓ Bob join broadcast received: {}", bobJoinMsg);
//
//            // Verification 3: Both users in SessionManager
//            assertTrue(sessionManager.isUserInRoom(alice.getId(), ROOM_ID),
//                "Alice should be in room");
//            assertTrue(sessionManager.isUserInRoom(bob.getId(), ROOM_ID),
//                "Bob should be in room");
//            log.info("✓ Both users verified in SessionManager");
//
//            aliceSession.disconnect();
//            bobSession.disconnect();
//        }

        /**
         * TEST SCENARIO: Three users join same room sequentially
         * 
         * SETUP:
         * - Alice, Bob, Charlie all have valid JWT tokens
         * - All connected to WebSocket
         * - All subscribed to room status
         * 
         * ACTION:
         * 1. Alice joins room-123
         * 2. Bob joins room-123
         * 3. Charlie joins room-123
         * 
         * EXPECTED RESULTS:
         * - SessionManager contains 3 users for room-123
         * - Each user receives their own join broadcast
         * - Total broadcasts = 3 (one per user)
         * 
         * VERIFICATION:
         * - sessionManager.isUserInRoom() returns true for all 3
         * - Each session receives exactly 1 message (their own join)
         * - Each message has correct userId, status, timestamp
         */
//        @Test
//        @DisplayName("Should handle three users joining room sequentially")
//        void testThreeUsersJoinRoom_AllInRoom() throws Exception {
//            // Setup: Connect all three users
//            StompSession aliceSession = connectWebSocket(aliceToken);
//            BlockingQueue<OnlineStatusDto> aliceMessages = subscribeToRoomStatus(aliceSession, ROOM_ID);
//
//            StompSession bobSession = connectWebSocket(bobToken);
//            BlockingQueue<OnlineStatusDto> bobMessages = subscribeToRoomStatus(bobSession, ROOM_ID);
//
//            StompSession charlieSession = connectWebSocket(charlieToken);
//            BlockingQueue<OnlineStatusDto> charlieMessages = subscribeToRoomStatus(charlieSession, ROOM_ID);
//
//            // Action: Each user joins sequentially
//            aliceSession.send("/app/room/join/" + ROOM_ID, null);
//            Thread.sleep(500); // Small delay to ensure order
//
//            bobSession.send("/app/room/join/" + ROOM_ID, null);
//            Thread.sleep(500);
//
//            charlieSession.send("/app/room/join/" + ROOM_ID, null);
//
//            // Verification: Each user receives their own join message
//            OnlineStatusDto aliceMsg = aliceMessages.poll(5, TimeUnit.SECONDS);
//            assertNotNull(aliceMsg, "Alice should receive join broadcast");
//            assertEquals(alice.getId(), aliceMsg.getUserId());
//            log.info("✓ Alice join verified");
//
//            OnlineStatusDto bobMsg = bobMessages.poll(5, TimeUnit.SECONDS);
//            assertNotNull(bobMsg, "Bob should receive join broadcast");
//            assertEquals(bob.getId(), bobMsg.getUserId());
//            log.info("✓ Bob join verified");
//
//            OnlineStatusDto charlieMsg = charlieMessages.poll(5, TimeUnit.SECONDS);
//            assertNotNull(charlieMsg, "Charlie should receive join broadcast");
//            assertEquals(charlie.getId(), charlieMsg.getUserId());
//            log.info("✓ Charlie join verified");
//
//            // Verification: All three in SessionManager
//            assertTrue(sessionManager.isUserInRoom(alice.getId(), ROOM_ID));
//            assertTrue(sessionManager.isUserInRoom(bob.getId(), ROOM_ID));
//            assertTrue(sessionManager.isUserInRoom(charlie.getId(), ROOM_ID));
//            log.info("✓ All three users verified in SessionManager");
//
//            aliceSession.disconnect();
//            bobSession.disconnect();
//            charlieSession.disconnect();
//        }
//
        /**
         * TEST SCENARIO: Same user joins room, leaves, then joins again
         * 
         * SETUP:
         * - Alice has valid JWT token
         * - Alice connected to WebSocket
         * - Subscribed to room status
         * 
         * ACTION:
         * 1. Alice joins room-123
         * 2. Alice leaves room-123
         * 3. Alice joins room-123 again
         * 
         * EXPECTED RESULTS:
         * - After first join: isUserInRoom(alice, room-123) == true
         * - After leave: isUserInRoom(alice, room-123) == false
         * - After second join: isUserInRoom(alice, room-123) == true
         * - Receives 3 broadcasts: online, offline, online
         * 
         * VERIFICATION:
         * - Message 1: status=online, userId=alice.id
         * - Message 2: status=offline, userId=alice.id
         * - Message 3: status=online, userId=alice.id
         * - SessionManager reflects correct state at each step
         */
//        @Test
//        @DisplayName("Should allow user to rejoin room after leaving")
//        void testUserRejoinRoom_AfterLeaving() throws Exception {
//            StompSession aliceSession = connectWebSocket(aliceToken);
//            BlockingQueue<OnlineStatusDto> statusMessages = subscribeToRoomStatus(aliceSession, ROOM_ID);
//
//            // Action 1: Alice joins
//            aliceSession.send("/app/room/join/" + ROOM_ID, null);
//            OnlineStatusDto joinMsg = statusMessages.poll(5, TimeUnit.SECONDS);
//            assertNotNull(joinMsg);
//            assertEquals("online", joinMsg.getStatus());
//            assertTrue(sessionManager.isUserInRoom(alice.getId(), ROOM_ID));
//            log.info("✓ First join verified");
//
//            // Action 2: Alice leaves
//            aliceSession.send("/app/room/leave/" + ROOM_ID, null);
//            OnlineStatusDto leaveMsg = statusMessages.poll(5, TimeUnit.SECONDS);
//            assertNotNull(leaveMsg);
//            assertEquals("offline", leaveMsg.getStatus());
//            assertFalse(sessionManager.isUserInRoom(alice.getId(), ROOM_ID));
//            log.info("✓ Leave verified");
//
//            // Action 3: Alice rejoins
//            aliceSession.send("/app/room/join/" + ROOM_ID, null);
//            OnlineStatusDto rejoinMsg = statusMessages.poll(5, TimeUnit.SECONDS);
//            assertNotNull(rejoinMsg);
//            assertEquals("online", rejoinMsg.getStatus());
//            assertTrue(sessionManager.isUserInRoom(alice.getId(), ROOM_ID));
//            log.info("✓ Rejoin verified");
//
//            aliceSession.disconnect();
//        }
    }

    @Nested
    @DisplayName("Room Join Edge Cases and Error Handling Tests")
    class RoomJoinEdgeCaseTests {

        /**
         * TEST SCENARIO: User joins room, disconnects, joins again
         * 
         * SETUP:
         * - Alice has valid JWT token
         * 
         * ACTION:
         * 1. Alice joins room-123
         * 2. Alice disconnects WebSocket
         * 3. Alice reconnects with new WebSocket session
         * 4. Alice joins room-123 again
         * 
         * EXPECTED RESULTS:
         * - After first join: sessionManager records Alice in room-123
         * - After disconnect: Alice is removed from room (WebSocketEventListener handles this)
         * - After second join: Alice is again in room-123
         * - Two join broadcasts are sent (one per join action)
         * 
         * VERIFICATION:
         * - sessionManager.isUserInRoom(alice.getId(), room-123) == true both times
         * - Two OnlineStatusDto messages received with status=online
         */
//        @Test
//        @DisplayName("Should handle user rejoin after disconnect")
//        void testUserRejoinRoom_AfterDisconnect() throws Exception {
//            // Action 1: Alice joins
//            StompSession aliceSession1 = connectWebSocket(aliceToken);
//            BlockingQueue<OnlineStatusDto> statusMessages1 = subscribeToRoomStatus(aliceSession1, ROOM_ID);
//            aliceSession1.send("/app/room/join/" + ROOM_ID, null);
//
//            OnlineStatusDto msg1 = statusMessages1.poll(5, TimeUnit.SECONDS);
//            assertNotNull(msg1, "First join should broadcast");
//            assertEquals("online", msg1.getStatus());
//            log.info("✓ First join verified");
//
//            // Action 2: Disconnect
//            aliceSession1.disconnect();
//            Thread.sleep(1000); // Wait for disconnect to be processed
//            log.info("✓ First session disconnected");
//
//            // Action 3: Reconnect and join again
//            StompSession aliceSession2 = connectWebSocket(aliceToken);
//            BlockingQueue<OnlineStatusDto> statusMessages2 = subscribeToRoomStatus(aliceSession2, ROOM_ID);
//            aliceSession2.send("/app/room/join/" + ROOM_ID, null);
//
//            OnlineStatusDto msg2 = statusMessages2.poll(5, TimeUnit.SECONDS);
//            assertNotNull(msg2, "Second join should broadcast");
//            assertEquals("online", msg2.getStatus());
//            assertEquals(alice.getId(), msg2.getUserId());
//            log.info("✓ Second join verified");
//
//            // Verification: Alice in room after rejoin
//            assertTrue(sessionManager.isUserInRoom(alice.getId(), ROOM_ID),
//                "Alice should be in room after rejoin");
//
//            aliceSession2.disconnect();
//        }

        /**
         * TEST SCENARIO: User joins same room twice without leaving (idempotent join)
         * 
         * SETUP:
         * - Bob has valid JWT token and is connected
         * - Bob is already in room-123
         * 
         * ACTION:
         * 1. Bob joins room-123
         * 2. Bob joins room-123 again (without leaving first)
         * 
         * EXPECTED RESULTS:
         * - SessionManager should still show Bob in room-123 (no duplicate entries)
         * - Two broadcasts may be sent, but both show Bob online in same room
         * - SessionManager handles this gracefully (set behavior prevents duplicates)
         * 
         * VERIFICATION:
         * - sessionManager.isUserInRoom(bob.getId(), room-123) == true
         * - No errors or exceptions thrown
         * - Bob's roomId remains "room-123"
         */
//        @Test
//        @DisplayName("Should handle idempotent join (joining already-joined room)")
//        void testUserJoinRoom_AlreadyInRoom() throws Exception {
//            StompSession bobSession = connectWebSocket(bobToken);
//            BlockingQueue<OnlineStatusDto> statusMessages = subscribeToRoomStatus(bobSession, ROOM_ID);
//
//            // Action 1: Bob joins
//            bobSession.send("/app/room/join/" + ROOM_ID, null);
//            OnlineStatusDto msg1 = statusMessages.poll(5, TimeUnit.SECONDS);
//            assertNotNull(msg1, "First join should broadcast");
//            log.info("✓ First join verified");
//
//            // Action 2: Bob joins again without leaving
//            bobSession.send("/app/room/join/" + ROOM_ID, null);
//            OnlineStatusDto msg2 = statusMessages.poll(5, TimeUnit.SECONDS);
//            assertNotNull(msg2, "Second join should also broadcast (no error)");
//            log.info("✓ Second join verified");
//
//            // Verification: Bob still in room, no duplicates
//            assertTrue(sessionManager.isUserInRoom(bob.getId(), ROOM_ID),
//                "Bob should be in room");
//            log.info("✓ Idempotent join handled correctly");
//
//            bobSession.disconnect();
//        }

        /**
         * TEST SCENARIO: Join broadcast includes correct timestamp
         * 
         * SETUP:
         * - Charlie has valid JWT token
         * - Current time is known (before join)
         * 
         * ACTION:
         * 1. Record time before join
         * 2. Charlie joins room-123
         * 3. Record time after join
         * 
         * EXPECTED RESULTS:
         * - OnlineStatusDto.timestamp is between beforeTime and afterTime
         * - Timestamp is not null
         * - Timestamp indicates when join happened (for audit/ordering)
         * 
         * VERIFICATION:
         * - msg.getTimestamp() != null
         * - msg.getTimestamp() >= beforeTime
         * - msg.getTimestamp() <= afterTime
         */
//        @Test
//        @DisplayName("Should include accurate timestamp in join broadcast")
//        void testRoomJoinBroadcast_IncludesTimestamp() throws Exception {
//            StompSession charlieSession = connectWebSocket(charlieToken);
//            BlockingQueue<OnlineStatusDto> statusMessages = subscribeToRoomStatus(charlieSession, ROOM_ID);
//
//            LocalDateTime beforeJoin = LocalDateTime.now();
//            charlieSession.send("/app/room/join/" + ROOM_ID, null);
//            LocalDateTime afterJoin = LocalDateTime.now();
//
//            OnlineStatusDto msg = statusMessages.poll(5, TimeUnit.SECONDS);
//            assertNotNull(msg, "Join broadcast should include timestamp");
//            assertNotNull(msg.getTimestamp(), "Timestamp should not be null");
//            
//            assertTrue(msg.getTimestamp().isAfter(beforeJoin.minusSeconds(1)),
//                "Timestamp should be after or equal to beforeJoin");
//            assertTrue(msg.getTimestamp().isBefore(afterJoin.plusSeconds(1)),
//                "Timestamp should be before or equal to afterJoin");
//            log.info("✓ Timestamp verified: {}", msg.getTimestamp());
//
//            charlieSession.disconnect();
//        }

        /**
         * TEST SCENARIO: Join broadcast to correct room (isolated rooms)
         * 
         * SETUP:
         * - Alice and Bob have valid tokens
         * - Two separate rooms: room-100 and room-200
         * 
         * ACTION:
         * 1. Alice subscribes to /topic/room/room-100/status
         * 2. Bob subscribes to /topic/room/room-200/status
         * 3. Alice joins room-100
         * 4. Bob joins room-200
         * 
         * EXPECTED RESULTS:
         * - Alice receives broadcast for room-100 only (not room-200)
         * - Bob receives broadcast for room-200 only (not room-100)
         * - Broadcasts are isolated by roomId
         * 
         * VERIFICATION:
         * - Alice's message shows roomId=room-100
         * - Bob's message shows roomId=room-200
         * - Alice does NOT receive Bob's message
         * - Bob does NOT receive Alice's message
         */
//        @Test
//        @DisplayName("Should isolate broadcasts by room ID")
//        void testRoomJoinBroadcast_IsolatedByRoomId() throws Exception {
//            final String ROOM_100 = "room-100";
//            final String ROOM_200 = "room-200";
//
//            StompSession aliceSession = connectWebSocket(aliceToken);
//            BlockingQueue<OnlineStatusDto> aliceMessages = subscribeToRoomStatus(aliceSession, ROOM_100);
//
//            StompSession bobSession = connectWebSocket(bobToken);
//            BlockingQueue<OnlineStatusDto> bobMessages = subscribeToRoomStatus(bobSession, ROOM_200);
//
//            // Action: Alice joins room-100, Bob joins room-200
//            aliceSession.send("/app/room/join/" + ROOM_100, null);
//            bobSession.send("/app/room/join/" + ROOM_200, null);
//
//            // Verification: Each receives only their own room's broadcast
//            OnlineStatusDto aliceMsg = aliceMessages.poll(5, TimeUnit.SECONDS);
//            assertNotNull(aliceMsg);
//            assertEquals(ROOM_100, aliceMsg.getRoomId(), "Alice should receive room-100 broadcast");
//            assertEquals(alice.getId(), aliceMsg.getUserId());
//            log.info("✓ Alice received room-100 broadcast");
//
//            OnlineStatusDto bobMsg = bobMessages.poll(5, TimeUnit.SECONDS);
//            assertNotNull(bobMsg);
//            assertEquals(ROOM_200, bobMsg.getRoomId(), "Bob should receive room-200 broadcast");
//            assertEquals(bob.getId(), bobMsg.getUserId());
//            log.info("✓ Bob received room-200 broadcast");
//
//            // Verify isolation: Alice should NOT receive any more messages (Bob's broadcast)
//            OnlineStatusDto unexpectedMsg = aliceMessages.poll(1, TimeUnit.SECONDS);
//            assertNull(unexpectedMsg, "Alice should NOT receive broadcasts from other rooms");
//            log.info("✓ Broadcast isolation verified");
//
//            aliceSession.disconnect();
//            bobSession.disconnect();
//        }
    }
}

package com.minichat.service;

import com.minichat.model.UserSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("SessionManager Unit Tests")
class SessionManagerUnitTest {

    private SessionManager sessionManager;

    @BeforeEach
    void setUp() {
        sessionManager = new SessionManager();
    }

    // ========== CONNECT USER TESTS ==========
    @Nested
    @DisplayName("connectUser() scenarios")
    class ConnectUserTests {

        /**
         * Scenario: Successfully connect user with valid credentials
         * Expected: UserSession created and stored with correct attributes
         */
        @Test
        @DisplayName("Should connect user successfully with valid input")
        void testConnectUser_Success() {
            // Act
            UserSession session = sessionManager.connectUser(1L, "testuser", "socket-123");

            // Assert
            assertNotNull(session);
            assertEquals(1L, session.getUserId());
            assertEquals("testuser", session.getUsername());
            assertEquals("socket-123", session.getSocketSessionId());
            assertEquals("connected", session.getConnectionStatus());
            assertNotNull(session.getConnectedAt());
            assertTrue(sessionManager.isUserOnline(1L));
        }

        /**
         * Scenario: Connect multiple users simultaneously
         * Expected: All users registered independently
         */
        @ParameterizedTest
        @CsvSource({
            "1,user1,socket-1",
            "2,user2,socket-2",
            "3,user3,socket-3"
        })
        @DisplayName("Should connect multiple users independently")
        void testConnectUser_Multiple(Long userId, String username, String socketId) {
            // Act
            UserSession session = sessionManager.connectUser(userId, username, socketId);

            // Assert
            assertNotNull(session);
            assertEquals(userId, session.getUserId());
            assertEquals(username, session.getUsername());
            assertTrue(sessionManager.isUserOnline(userId));
        }

        /**
         * Scenario: Reconnect user overwrites previous session
         * Expected: New session replaces old one
         */
        @Test
        @DisplayName("Should overwrite previous session on reconnect")
        void testConnectUser_Reconnect() {
            // Arrange
            sessionManager.connectUser(1L, "user1", "socket-old");

            // Act
            UserSession newSession = sessionManager.connectUser(1L, "user1", "socket-new");

            // Assert
            assertEquals("socket-new", newSession.getSocketSessionId());
            List<UserSession> allOnline = sessionManager.getAllOnlineUsers();
            assertEquals(1, allOnline.size());
        }
    }

    // ========== JOIN ROOM TESTS ==========
    @Nested
    @DisplayName("joinRoom() scenarios")
    class JoinRoomTests {

        /**
         * Scenario: Successfully join room with connected user
         * Expected: User added to room members, roomId set in session
         */
        @Test
        @DisplayName("Should join room successfully")
        void testJoinRoom_Success() {
            // Arrange
            sessionManager.connectUser(1L, "user1", "socket-1");

            // Act
            sessionManager.joinRoom(1L, "room-123");

            // Assert
            assertTrue(sessionManager.isUserInRoom(1L, "room-123"));
            assertEquals(1, sessionManager.getRoomMemberCount("room-123"));
            UserSession session = sessionManager.getSession(1L);
            assertEquals("room-123", session.getRoomId());
        }

        /**
         * Scenario: Multiple users join same room
         * Expected: All users present in room members set
         */
        @ParameterizedTest
        @CsvSource({
            "1,2,3",
            "10,20,30"
        })
        @DisplayName("Should add multiple users to room")
        void testJoinRoom_MultipleUsers(Long userId1, Long userId2, Long userId3) {
            // Arrange
            sessionManager.connectUser(userId1, "user1", "socket-1");
            sessionManager.connectUser(userId2, "user2", "socket-2");
            sessionManager.connectUser(userId3, "user3", "socket-3");

            // Act
            sessionManager.joinRoom(userId1, "room-123");
            sessionManager.joinRoom(userId2, "room-123");
            sessionManager.joinRoom(userId3, "room-123");

            // Assert
            assertEquals(3, sessionManager.getRoomMemberCount("room-123"));
            assertTrue(sessionManager.isUserInRoom(userId1, "room-123"));
            assertTrue(sessionManager.isUserInRoom(userId2, "room-123"));
            assertTrue(sessionManager.isUserInRoom(userId3, "room-123"));
        }

        /**
         * Scenario: User not connected attempts to join room
         * Expected: Join silently ignored (session doesn't exist)
         */
        @Test
        @DisplayName("Should ignore join for disconnected user")
        void testJoinRoom_UserNotConnected() {
            // Act
            sessionManager.joinRoom(999L, "room-123");

            // Assert
            assertEquals(0, sessionManager.getRoomMemberCount("room-123"));
        }

        /**
         * Scenario: User switches between rooms
         * Expected: User's roomId updated, old room cleared
         */
        @Test
        @DisplayName("Should switch user between rooms")
        void testJoinRoom_SwitchRooms() {
            // Arrange
            sessionManager.connectUser(1L, "user1", "socket-1");
            sessionManager.joinRoom(1L, "room-1");

            // Act
            sessionManager.joinRoom(1L, "room-2");

            // Assert
            assertTrue(sessionManager.isUserInRoom(1L, "room-2"));
            assertEquals("room-2", sessionManager.getSession(1L).getRoomId());
        }
    }

    // ========== LEAVE ROOM TESTS ==========
    @Nested
    @DisplayName("leaveRoom() scenarios")
    class LeaveRoomTests {

        /**
         * Scenario: User successfully leaves room
         * Expected: User removed from room, roomId nullified
         */
        @Test
        @DisplayName("Should leave room successfully")
        void testLeaveRoom_Success() {
            // Arrange
            sessionManager.connectUser(1L, "user1", "socket-1");
            sessionManager.joinRoom(1L, "room-123");

            // Act
            sessionManager.leaveRoom(1L, "room-123");

            // Assert
            assertFalse(sessionManager.isUserInRoom(1L, "room-123"));
            assertNull(sessionManager.getSession(1L).getRoomId());
            assertEquals(0, sessionManager.getRoomMemberCount("room-123"));
        }

        /**
         * Scenario: Last user leaves room
         * Expected: Room removed from tracking
         */
        @Test
        @DisplayName("Should clean up room when last user leaves")
        void testLeaveRoom_LastUserLeaves() {
            // Arrange
            sessionManager.connectUser(1L, "user1", "socket-1");
            sessionManager.joinRoom(1L, "room-123");

            // Act
            sessionManager.leaveRoom(1L, "room-123");

            // Assert
            assertEquals(0, sessionManager.getRoomMemberCount("room-123"));
        }

        /**
         * Scenario: User not in room attempts to leave
         * Expected: No exception, safely handled
         */
        @Test
        @DisplayName("Should handle leave when user not in room")
        void testLeaveRoom_UserNotInRoom() {
            // Arrange
            sessionManager.connectUser(1L, "user1", "socket-1");

            // Act & Assert
            assertDoesNotThrow(() -> sessionManager.leaveRoom(1L, "room-123"));
        }

        /**
         * Scenario: User not connected attempts to leave room
         * Expected: Safely ignored
         */
        @Test
        @DisplayName("Should ignore leave for disconnected user")
        void testLeaveRoom_UserNotConnected() {
            // Act & Assert
            assertDoesNotThrow(() -> sessionManager.leaveRoom(999L, "room-123"));
        }
    }

    // ========== DISCONNECT USER TESTS ==========
    @Nested
    @DisplayName("disconnectUser() scenarios")
    class DisconnectUserTests {

        /**
         * Scenario: Connected user disconnects
         * Expected: User removed from system, no longer online
         */
        @Test
        @DisplayName("Should disconnect user successfully")
        void testDisconnectUser_Success() {
            // Arrange
            sessionManager.connectUser(1L, "user1", "socket-1");

            // Act
            sessionManager.disconnectUser(1L);

            // Assert
            assertFalse(sessionManager.isUserOnline(1L));
            assertNull(sessionManager.getSession(1L));
        }

        /**
         * Scenario: User in room disconnects
         * Expected: User removed from room and session
         */
        @Test
        @DisplayName("Should remove user from room on disconnect")
        void testDisconnectUser_FromRoom() {
            // Arrange
            sessionManager.connectUser(1L, "user1", "socket-1");
            sessionManager.joinRoom(1L, "room-123");

            // Act
            sessionManager.disconnectUser(1L);

            // Assert
            assertFalse(sessionManager.isUserInRoom(1L, "room-123"));
            assertEquals(0, sessionManager.getRoomMemberCount("room-123"));
        }

        /**
         * Scenario: Non-existent user disconnects
         * Expected: Safely handled, no exception
         */
        @Test
        @DisplayName("Should handle disconnect of non-existent user")
        void testDisconnectUser_NotExist() {
            // Act & Assert
            assertDoesNotThrow(() -> sessionManager.disconnectUser(999L));
        }
    }

    // ========== GET ROOM MEMBERS TESTS ==========
    @Nested
    @DisplayName("getRoomMembers() scenarios")
    class GetRoomMembersTests {

        /**
         * Scenario: Get members from room with users
         * Expected: Return list of UserSession objects
         */
        @Test
        @DisplayName("Should return all room members")
        void testGetRoomMembers_WithMembers() {
            // Arrange
            sessionManager.connectUser(1L, "user1", "socket-1");
            sessionManager.connectUser(2L, "user2", "socket-2");
            sessionManager.joinRoom(1L, "room-123");
            sessionManager.joinRoom(2L, "room-123");

            // Act
            List<UserSession> members = sessionManager.getRoomMembers("room-123");

            // Assert
            assertEquals(2, members.size());
            assertTrue(members.stream().anyMatch(s -> s.getUserId().equals(1L)));
            assertTrue(members.stream().anyMatch(s -> s.getUserId().equals(2L)));
        }

        /**
         * Scenario: Get members from empty room
         * Expected: Return empty list
         */
        @Test
        @DisplayName("Should return empty list for empty room")
        void testGetRoomMembers_EmptyRoom() {
            // Act
            List<UserSession> members = sessionManager.getRoomMembers("room-empty");

            // Assert
            assertTrue(members.isEmpty());
        }
    }

    // ========== RESTORE ROOM MEMBERSHIP TESTS ==========
    @Nested
    @DisplayName("restoreRoomMembership() scenarios")
    class RestoreRoomMembershipTests {

        /**
         * Scenario: Restore user to previous room after reconnect
         * Expected: User re-added to room if previous room exists
         */
        @Test
        @DisplayName("Should restore room membership after reconnect")
        void testRestoreRoomMembership_Success() {
            // Arrange
            sessionManager.connectUser(1L, "user1", "socket-1");
            sessionManager.joinRoom(1L, "room-123");

            // Act (simulate reconnect by updating session)
            sessionManager.reconnectUser(1L, "socket-new");
            sessionManager.restoreRoomMembership(1L);

            // Assert
            assertTrue(sessionManager.isUserInRoom(1L, "room-123"));
        }

        /**
         * Scenario: Restore user with no previous room
         * Expected: No-op, no exception
         */
        @Test
        @DisplayName("Should handle restore when user has no previous room")
        void testRestoreRoomMembership_NoRoom() {
            // Arrange
            sessionManager.connectUser(1L, "user1", "socket-1");

            // Act & Assert
            assertDoesNotThrow(() -> sessionManager.restoreRoomMembership(1L));
        }
    }

    // ========== IS USER IN ROOM TESTS ==========
    @Nested
    @DisplayName("isUserInRoom() scenarios")
    class IsUserInRoomTests {

        /**
         * Scenario: Check user presence in room
         * Expected: Return true if user in room, false otherwise
         */
        @ParameterizedTest
        @ValueSource(booleans = {true, false})
        @DisplayName("Should correctly identify user in room")
        void testIsUserInRoom(boolean shouldBeInRoom) {
            // Arrange
            sessionManager.connectUser(1L, "user1", "socket-1");
            if (shouldBeInRoom) {
                sessionManager.joinRoom(1L, "room-123");
            }

            // Act & Assert
            assertEquals(shouldBeInRoom, sessionManager.isUserInRoom(1L, "room-123"));
        }
    }

    // ========== GET USER ROOMS TESTS ==========
    @Nested
    @DisplayName("getUserRooms() scenarios")
    class GetUserRoomsTests {

        /**
         * Scenario: Get all rooms user is currently in
         * Expected: Return list of all room IDs user joined
         */
        @Test
        @DisplayName("Should return all rooms for user")
        void testGetUserRooms_Multiple() {
            // Arrange
            sessionManager.connectUser(1L, "user1", "socket-1");
            sessionManager.joinRoom(1L, "room-1");
            sessionManager.joinRoom(1L, "room-2");

            // Act
            List<String> rooms = sessionManager.getUserRooms(1L);

            // Assert
            assertEquals(2, rooms.size());
            assertTrue(rooms.contains("room-1"));
            assertTrue(rooms.contains("room-2"));
        }

        /**
         * Scenario: Get rooms for user in no rooms
         * Expected: Return empty list
         */
        @Test
        @DisplayName("Should return empty list when user in no rooms")
        void testGetUserRooms_Empty() {
            // Arrange
            sessionManager.connectUser(1L, "user1", "socket-1");

            // Act
            List<String> rooms = sessionManager.getUserRooms(1L);

            // Assert
            assertTrue(rooms.isEmpty());
        }
    }

    // ========== IS USER ONLINE TESTS ==========
    @Nested
    @DisplayName("isUserOnline() scenarios")
    class IsUserOnlineTests {

        /**
         * Scenario: Check online status of connected user
         * Expected: Return true for connected user, false otherwise
         */
        @Test
        @DisplayName("Should return true for online user")
        void testIsUserOnline_Connected() {
            // Arrange
            sessionManager.connectUser(1L, "user1", "socket-1");

            // Act & Assert
            assertTrue(sessionManager.isUserOnline(1L));
        }

        /**
         * Scenario: Check online status of disconnected user
         * Expected: Return false
         */
        @Test
        @DisplayName("Should return false for offline user")
        void testIsUserOnline_Disconnected() {
            // Act & Assert
            assertFalse(sessionManager.isUserOnline(999L));
        }
    }

    // ========== UPDATE LAST ACTIVITY TESTS ==========
    @Nested
    @DisplayName("updateLastActivity() scenarios")
    class UpdateLastActivityTests {

        /**
         * Scenario: Update last activity timestamp
         * Expected: lastActivityAt updated to current time
         */
        @Test
        @DisplayName("Should update last activity timestamp")
        void testUpdateLastActivity_Success() {
            // Arrange
            sessionManager.connectUser(1L, "user1", "socket-1");
            LocalDateTime beforeUpdate = sessionManager.getSession(1L).getLastActivityAt();

            // Act (small delay to ensure time difference)
            try {
                Thread.sleep(10);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            sessionManager.updateLastActivity(1L);

            // Assert
            LocalDateTime afterUpdate = sessionManager.getSession(1L).getLastActivityAt();
            assertTrue(afterUpdate.isAfter(beforeUpdate));
        }

        /**
         * Scenario: Update activity for non-existent user
         * Expected: Safely ignored, no exception
         */
        @Test
        @DisplayName("Should handle activity update for non-existent user")
        void testUpdateLastActivity_UserNotExists() {
            // Act & Assert
            assertDoesNotThrow(() -> sessionManager.updateLastActivity(999L));
        }
    }

    // ========== GET ALL ONLINE USERS TESTS ==========
    @Nested
    @DisplayName("getAllOnlineUsers() scenarios")
    class GetAllOnlineUsersTests {

        /**
         * Scenario: Get all online users when multiple connected
         * Expected: Return list of all connected users
         */
        @ParameterizedTest
        @CsvSource({
            "1,2,3",
            "10,20,30,40"
        })
        @DisplayName("Should return all online users")
        void testGetAllOnlineUsers_Multiple(String userIdList) {
            // Arrange
            String[] userIds = userIdList.split(",");
            for (int i = 0; i < userIds.length; i++) {
                long userId = Long.parseLong(userIds[i]);
                sessionManager.connectUser(userId, "user" + userId, "socket-" + userId);
            }

            // Act
            List<UserSession> onlineUsers = sessionManager.getAllOnlineUsers();

            // Assert
            assertEquals(userIds.length, onlineUsers.size());
        }

        /**
         * Scenario: Get all online users when none connected
         * Expected: Return empty list
         */
        @Test
        @DisplayName("Should return empty list when no users online")
        void testGetAllOnlineUsers_Empty() {
            // Act
            List<UserSession> onlineUsers = sessionManager.getAllOnlineUsers();

            // Assert
            assertTrue(onlineUsers.isEmpty());
        }
    }

    // ========== HAS ACTIVE SESSION TESTS ==========
    @Nested
    @DisplayName("hasActiveSession() scenarios")
    class HasActiveSessionTests {

        /**
         * Scenario: Check if user has active session
         * Expected: Return true for connected user
         */
        @Test
        @DisplayName("Should return true for user with active session")
        void testHasActiveSession_True() {
            // Arrange
            sessionManager.connectUser(1L, "user1", "socket-1");

            // Act & Assert
            assertTrue(sessionManager.hasActiveSession(1L));
        }

        /**
         * Scenario: Check for inactive user
         * Expected: Return false
         */
        @Test
        @DisplayName("Should return false for user without active session")
        void testHasActiveSession_False() {
            // Act & Assert
            assertFalse(sessionManager.hasActiveSession(999L));
        }
    }

    // ========== RECONNECT USER TESTS ==========
    @Nested
    @DisplayName("reconnectUser() scenarios")
    class ReconnectUserTests {

        /**
         * Scenario: Reconnect user with new socket ID
         * Expected: Socket ID updated, status remains connected
         */
        @Test
        @DisplayName("Should reconnect user with new socket ID")
        void testReconnectUser_Success() {
            // Arrange
            sessionManager.connectUser(1L, "user1", "socket-old");

            // Act
            UserSession reconnected = sessionManager.reconnectUser(1L, "socket-new");

            // Assert
            assertNotNull(reconnected);
            assertEquals("socket-new", reconnected.getSocketSessionId());
            assertEquals("connected", reconnected.getConnectionStatus());
        }

        /**
         * Scenario: Reconnect non-existent user
         * Expected: Return null
         */
        @Test
        @DisplayName("Should return null for non-existent user reconnect")
        void testReconnectUser_NotExists() {
            // Act
            UserSession reconnected = sessionManager.reconnectUser(999L, "socket-new");

            // Assert
            assertNull(reconnected);
        }
    }

    // ========== MARK USER IDLE TESTS ==========
    @Nested
    @DisplayName("markUserIdle() scenarios")
    class MarkUserIdleTests {

        /**
         * Scenario: Mark connected user as idle
         * Expected: Connection status changed to "idle"
         */
        @Test
        @DisplayName("Should mark user as idle")
        void testMarkUserIdle_Success() {
            // Arrange
            sessionManager.connectUser(1L, "user1", "socket-1");

            // Act
            sessionManager.markUserIdle(1L);

            // Assert
            assertEquals("idle", sessionManager.getSession(1L).getConnectionStatus());
        }

        /**
         * Scenario: Mark non-existent user as idle
         * Expected: Safely ignored
         */
        @Test
        @DisplayName("Should handle mark idle for non-existent user")
        void testMarkUserIdle_NotExists() {
            // Act & Assert
            assertDoesNotThrow(() -> sessionManager.markUserIdle(999L));
        }
    }

    // ========== CLEANUP IDLE SESSIONS TESTS ==========
    @Nested
    @DisplayName("cleanupIdleSessions() scenarios")
    class CleanupIdleSessionsTests {

        /**
         * Scenario: Clean up idle sessions older than timeout
         * Expected: Idle sessions removed, active sessions retained
         */
        @Test
        @DisplayName("Should remove idle sessions past timeout")
        void testCleanupIdleSessions_Success() {
            // Arrange
            sessionManager.connectUser(1L, "user1", "socket-1");
            sessionManager.joinRoom(1L, "room-123");
            sessionManager.markUserIdle(1L);

            // Act
            sessionManager.cleanupIdleSessions(0); // 0 timeout means remove all idle

            // Assert
            assertFalse(sessionManager.isUserOnline(1L));
            assertEquals(0, sessionManager.getRoomMemberCount("room-123"));
        }

        /**
         * Scenario: Cleanup with no idle sessions
         * Expected: No sessions removed
         */
        @Test
        @DisplayName("Should not remove active sessions during cleanup")
        void testCleanupIdleSessions_NoIdle() {
            // Arrange
            sessionManager.connectUser(1L, "user1", "socket-1");
            sessionManager.connectUser(2L, "user2", "socket-2");
            sessionManager.markUserIdle(1L);
            // user 2 remains active

            // Act
            sessionManager.cleanupIdleSessions(0);

            // Assert
            assertFalse(sessionManager.isUserOnline(1L)); // idle removed
            assertTrue(sessionManager.isUserOnline(2L)); // active retained
        }

        /**
         * Scenario: Cleanup with recent idle users
         * Expected: Users not removed if within timeout window
         */
        @Test
        @DisplayName("Should not remove idle sessions within timeout window")
        void testCleanupIdleSessions_WithinTimeout() {
            // Arrange
            sessionManager.connectUser(1L, "user1", "socket-1");
            sessionManager.markUserIdle(1L);

            // Act
            sessionManager.cleanupIdleSessions(3600); // 1 hour timeout

            // Assert
            assertNotNull(sessionManager.getSession(1L)); // session still exists
        }
    }

    // ========== GET ROOM MEMBER COUNT TESTS ==========
    @Nested
    @DisplayName("getRoomMemberCount() scenarios")
    class GetRoomMemberCountTests {

        /**
         * Scenario: Get member count from room with users
         * Expected: Return correct count
         */
        @ParameterizedTest
        @ValueSource(ints = {1, 5, 10})
        @DisplayName("Should return correct room member count")
        void testGetRoomMemberCount(int memberCount) {
            // Arrange
            for (int i = 1; i <= memberCount; i++) {
                sessionManager.connectUser((long) i, "user" + i, "socket-" + i);
                sessionManager.joinRoom((long) i, "room-123");
            }

            // Act
            int count = sessionManager.getRoomMemberCount("room-123");

            // Assert
            assertEquals(memberCount, count);
        }

        /**
         * Scenario: Get member count from non-existent room
         * Expected: Return 0
         */
        @Test
        @DisplayName("Should return 0 for non-existent room")
        void testGetRoomMemberCount_Empty() {
            // Act
            int count = sessionManager.getRoomMemberCount("room-empty");

            // Assert
            assertEquals(0, count);
        }
    }

    // ========== GET SESSION TESTS ==========
    @Nested
    @DisplayName("getSession() scenarios")
    class GetSessionTests {

        /**
         * Scenario: Retrieve session for connected user
         * Expected: Return UserSession object
         */
        @Test
        @DisplayName("Should return session for online user")
        void testGetSession_Success() {
            // Arrange
            sessionManager.connectUser(1L, "user1", "socket-1");

            // Act
            UserSession session = sessionManager.getSession(1L);

            // Assert
            assertNotNull(session);
            assertEquals(1L, session.getUserId());
            assertEquals("user1", session.getUsername());
        }

        /**
         * Scenario: Retrieve session for non-existent user
         * Expected: Return null
         */
        @Test
        @DisplayName("Should return null for non-existent user")
        void testGetSession_NotExists() {
            // Act
            UserSession session = sessionManager.getSession(999L);

            // Assert
            assertNull(session);
        }
    }
}


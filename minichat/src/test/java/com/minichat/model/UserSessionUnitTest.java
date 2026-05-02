package com.minichat.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit Tests for UserSession
 * 
 * This test file validates UserSession model methods in isolation.
 * Tests focus on state management and status checks.
 */
@DisplayName("UserSession Unit Tests")
class UserSessionUnitTest {

    private UserSession userSession;

    @BeforeEach
    void setUp() {
        userSession = UserSession.builder()
            .userId(1L)
            .username("testUser")
            .socketSessionId("socket-123")
            .roomId("room-1")
            .connectedAt(LocalDateTime.now())
            .lastActivityAt(LocalDateTime.now())
            .connectionStatus("connected")
            .build();
    }

    @Nested
    @DisplayName("IsActive Tests")
    class IsActiveTests {

        /**
         * Scenario: User status is "connected"
         * Expected: isActive() returns true
         */
        @Test
        @DisplayName("Should return true when status is 'connected'")
        void testIsActive_Connected() {
            // Arrange
            userSession.setConnectionStatus("connected");

            // Act
            boolean result = userSession.isActive();

            // Assert
            assertTrue(result);
        }

        /**
         * Scenario: User status is "idle"
         * Expected: isActive() returns false
         */
        @Test
        @DisplayName("Should return false when status is 'idle'")
        void testIsActive_Idle() {
            // Arrange
            userSession.setConnectionStatus("idle");

            // Act
            boolean result = userSession.isActive();

            // Assert
            assertFalse(result);
        }

        /**
         * Scenario: User status is "disconnected"
         * Expected: isActive() returns false
         */
        @Test
        @DisplayName("Should return false when status is 'disconnected'")
        void testIsActive_Disconnected() {
            // Arrange
            userSession.setConnectionStatus("disconnected");

            // Act
            boolean result = userSession.isActive();

            // Assert
            assertFalse(result);
        }

        /**
         * Scenario: User status is null
         * Expected: isActive() returns false
         */
        @Test
        @DisplayName("Should return false when status is null")
        void testIsActive_Null() {
            // Arrange
            userSession.setConnectionStatus(null);

            // Act
            boolean result = userSession.isActive();

            // Assert
            assertFalse(result);
        }

        /**
         * Scenario: User status is arbitrary string (not "connected")
         * Expected: isActive() returns false
         */
        @ParameterizedTest
        @ValueSource(strings = {"offline", "away", "busy", "unknown"})
        @DisplayName("Should return false for non-'connected' statuses")
        void testIsActive_OtherStatuses(String status) {
            // Arrange
            userSession.setConnectionStatus(status);

            // Act
            boolean result = userSession.isActive();

            // Assert
            assertFalse(result);
        }
    }

    @Nested
    @DisplayName("UserSession Builder Tests")
    class BuilderTests {

        /**
         * Scenario: Build complete UserSession
         * Expected: All fields set correctly
         */
        @Test
        @DisplayName("Should build UserSession with all fields")
        void testBuilder_CompleteSession() {
            // Arrange & Act
            UserSession session = UserSession.builder()
                .userId(2L)
                .username("anotherUser")
                .socketSessionId("socket-456")
                .roomId("room-2")
                .connectedAt(LocalDateTime.now())
                .lastActivityAt(LocalDateTime.now())
                .connectionStatus("connected")
                .build();

            // Assert
            assertEquals(2L, session.getUserId());
            assertEquals("anotherUser", session.getUsername());
            assertEquals("socket-456", session.getSocketSessionId());
            assertEquals("room-2", session.getRoomId());
            assertNotNull(session.getConnectedAt());
            assertNotNull(session.getLastActivityAt());
            assertEquals("connected", session.getConnectionStatus());
        }

        /**
         * Scenario: Build UserSession with minimal fields
         * Expected: Fields are null/default
         */
        @Test
        @DisplayName("Should build UserSession with null fields")
        void testBuilder_MinimalSession() {
            // Arrange & Act
            UserSession session = UserSession.builder().build();

            // Assert
            assertNull(session.getUserId());
            assertNull(session.getUsername());
            assertNull(session.getSocketSessionId());
            assertNull(session.getRoomId());
            assertNull(session.getConnectedAt());
            assertNull(session.getLastActivityAt());
            assertNull(session.getConnectionStatus());
        }
    }
}

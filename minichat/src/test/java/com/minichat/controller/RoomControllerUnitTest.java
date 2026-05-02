package com.minichat.controller;

import com.minichat.dto.OnlineStatusDto;
import com.minichat.model.UserSession;
import com.minichat.service.RoomService;
import com.minichat.service.SessionManager;
import com.minichat.entity.Room;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * Unit Tests for RoomController
 * 
 * This test file validates RoomController methods in isolation.
 * All dependencies (RoomService, SessionManager) are mocked.
 * No Spring Boot context is loaded.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("RoomController Unit Tests")
class RoomControllerUnitTest {

    private Room mockRoom;

    @BeforeEach
    void setUp() {
        mockRoom = Room.builder()
            .id(1L)
            .name("Test Room")
            .build();
    }

    @Mock
    private RoomService roomService;

    @Mock
    private SessionManager sessionManager;

    @InjectMocks
    private RoomController roomController;

    @Nested
    @DisplayName("GetRoomPeers Tests")
    class GetRoomPeersTests {

        /**
         * Scenario: Valid room ID with online peers
         * Expected: Return 200 OK with list of OnlineStatusDto
         */
        @Test
        @DisplayName("Should return peers when room exists and has members")
        void testGetRoomPeers_Success() {
            // Arrange
            String roomId = "1";
            UserSession peer1 = UserSession.builder()
                .userId(1L)
                .username("user1")
                .connectionStatus("connected")
                .roomId(roomId)
                .lastActivityAt(LocalDateTime.now())
                .build();

            List<UserSession> members = List.of(peer1);

            when(roomService.getRoomById(1L)).thenReturn(Optional.of(mockRoom)); // Room exists
            when(sessionManager.getRoomMembers(roomId)).thenReturn(members);

            // Act
            ResponseEntity<?> response = roomController.getRoomPeers(roomId);

            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody() instanceof List);
            
            @SuppressWarnings("unchecked")
            List<OnlineStatusDto> peers = (List<OnlineStatusDto>) response.getBody();
            assertEquals(1, peers.size());
            assertEquals("user1", peers.get(0).getUsername());
            assertEquals("connected", peers.get(0).getStatus());

            verify(roomService, times(1)).getRoomById(1L);
            verify(sessionManager, times(1)).getRoomMembers(roomId);
        }

        /**
         * Scenario: Valid room ID with no peers
         * Expected: Return 200 OK with empty list
         */
        @Test
        @DisplayName("Should return empty list when room has no members")
        void testGetRoomPeers_EmptyRoom() {
            // Arrange
            String roomId = "1";
            
            when(roomService.getRoomById(1L)).thenReturn(Optional.of(mockRoom));
            when(sessionManager.getRoomMembers(roomId)).thenReturn(new ArrayList<>());

            // Act
            ResponseEntity<?> response = roomController.getRoomPeers(roomId);

            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode());
            
            @SuppressWarnings("unchecked")
            List<OnlineStatusDto> peers = (List<OnlineStatusDto>) response.getBody();
            assertTrue(peers.isEmpty());

            verify(roomService, times(1)).getRoomById(1L);
            verify(sessionManager, times(1)).getRoomMembers(roomId);
        }

        /**
         * Scenario: Room ID does not exist
         * Expected: Return 404 Not Found
         */
        @Test
        @DisplayName("Should return 404 when room does not exist")
        void testGetRoomPeers_RoomNotFound() {
            // Arrange
            String roomId = "999";
            
            when(roomService.getRoomById(999L)).thenReturn(Optional.empty());

            // Act
            ResponseEntity<?> response = roomController.getRoomPeers(roomId);

            // Assert
            assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
            verify(roomService, times(1)).getRoomById(999L);
            verify(sessionManager, never()).getRoomMembers(anyString());
        }

        /**
         * Scenario: Invalid room ID format (non-numeric)
         * Expected: Return 400 Bad Request
         */
        @Test
        @DisplayName("Should return 400 when room ID format is invalid")
        void testGetRoomPeers_InvalidRoomIdFormat() {
            // Arrange
            String invalidRoomId = "invalid-id";

            // Act
            ResponseEntity<?> response = roomController.getRoomPeers(invalidRoomId);

            // Assert
            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            assertTrue(response.getBody() instanceof String);
            assertTrue(response.getBody().toString().contains("Invalid room ID format"));

            verify(roomService, never()).getRoomById(anyLong());
            verify(sessionManager, never()).getRoomMembers(anyString());
        }

        /**
         * Scenario: Multiple peers in room
         * Expected: Return all peers in response
         */
        @Test
        @DisplayName("Should return all peers when room has multiple members")
        void testGetRoomPeers_MultiplePeers() {
            // Arrange
            String roomId = "1";
            UserSession peer1 = UserSession.builder()
                .userId(1L)
                .username("user1")
                .connectionStatus("connected")
                .roomId(roomId)
                .lastActivityAt(LocalDateTime.now())
                .build();
            UserSession peer2 = UserSession.builder()
                .userId(2L)
                .username("user2")
                .connectionStatus("idle")
                .roomId(roomId)
                .lastActivityAt(LocalDateTime.now())
                .build();

            List<UserSession> members = List.of(peer1, peer2);

            when(roomService.getRoomById(1L)).thenReturn(Optional.of(mockRoom));
            when(sessionManager.getRoomMembers(roomId)).thenReturn(members);

            // Act
            ResponseEntity<?> response = roomController.getRoomPeers(roomId);

            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode());
            
            @SuppressWarnings("unchecked")
            List<OnlineStatusDto> peers = (List<OnlineStatusDto>) response.getBody();
            assertEquals(2, peers.size());
            assertEquals("user1", peers.get(0).getUsername());
            assertEquals("user2", peers.get(1).getUsername());

            verify(roomService, times(1)).getRoomById(1L);
            verify(sessionManager, times(1)).getRoomMembers(roomId);
        }
    }
}

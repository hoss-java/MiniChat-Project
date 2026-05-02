package com.minichat.service;

import com.minichat.entity.Room;
import com.minichat.entity.User;
import com.minichat.repository.RoomRepository;
import com.minichat.repository.UserRepository;
import com.minichat.exception.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("RoomService Unit Tests")
class RoomServiceUnitTest {

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RoomService roomService;

    private User testUser;
    private Room testRoom;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        testUser = User.builder().id(1L).email("test@test.com").build();
        testRoom = Room.builder().id(1L).name("Test Room").createdBy(testUser).build();
    }

    // ========== CREATE ROOM TESTS ==========
    @Nested
    @DisplayName("createRoom() scenarios")
    class CreateRoomTests {

        /**
         * Scenario: Successfully create room with valid userId and roomName
         * Expected: Room saved and returned with correct attributes
         */
        @Test
        @DisplayName("Should create room successfully with valid input")
        void testCreateRoom_Success() {
            // Arrange
            Long userId = 1L;
            String roomName = "Valid Room";
            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
            when(roomRepository.save(any(Room.class))).thenReturn(testRoom);

            // Act
            Room result = roomService.createRoom(userId, roomName);

            // Assert
            assertNotNull(result);
            assertEquals("Test Room", result.getName());
            assertEquals(testUser, result.getCreatedBy());
            verify(roomRepository, times(1)).save(any(Room.class));
            verify(userRepository, times(1)).findById(userId);
        }

        /**
         * Scenario: Attempt to create room with invalid room names (empty, null, too long)
         * Expected: Throw IllegalArgumentException
         */
        @ParameterizedTest
        @ValueSource(strings = {"", "   "})
        @DisplayName("Should throw IllegalArgumentException for invalid room names")
        void testCreateRoom_InvalidRoomName(String invalidName) {
            // Act & Assert
            assertThrows(IllegalArgumentException.class, () -> {
                roomService.createRoom(1L, invalidName);
            });
            verify(roomRepository, never()).save(any());
        }

        /**
         * Scenario: Attempt to create room with null room name
         * Expected: Throw IllegalArgumentException
         */
        @Test
        @DisplayName("Should throw IllegalArgumentException when room name is null")
        void testCreateRoom_NullRoomName() {
            assertThrows(IllegalArgumentException.class, () -> {
                roomService.createRoom(1L, null);
            });
            verify(roomRepository, never()).save(any());
        }

        /**
         * Scenario: Attempt to create room with non-existent user
         * Expected: Throw UnauthorizedException
         */
        @Test
        @DisplayName("Should throw UnauthorizedException when user not found")
        void testCreateRoom_UserNotFound() {
            // Arrange
            Long userId = 999L;
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThrows(UnauthorizedException.class, () -> {
                roomService.createRoom(userId, "Valid Room");
            });
            verify(roomRepository, never()).save(any());
        }

        /**
         * Scenario: Room name with leading/trailing whitespace is trimmed
         * Expected: Room saved with trimmed name
         */
        @Test
        @DisplayName("Should trim room name before saving")
        void testCreateRoom_TrimmedName() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> {
                Room room = invocation.getArgument(0);
                assertEquals("Trimmed Room", room.getName());
                return room;
            });

            // Act
            roomService.createRoom(1L, "  Trimmed Room  ");

            // Assert
            verify(roomRepository, times(1)).save(any(Room.class));
        }
    }

    // ========== JOIN ROOM TESTS ==========
    @Nested
    @DisplayName("joinRoom() scenarios")
    class JoinRoomTests {

        /**
         * Scenario: Successfully join room with valid roomId and userId
         * Expected: User added to room members set
         */
        @Test
        @DisplayName("Should join room successfully with valid input")
        void testJoinRoom_Success() {
            // Arrange
            Long roomId = 1L;
            Long userId = 1L;
            when(roomRepository.findById(roomId)).thenReturn(Optional.of(testRoom));
            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

            // Act
            roomService.joinRoom(roomId, userId);

            // Assert
            Set<Long> members = roomService.getRoomMembers(roomId);
            assertTrue(members.contains(userId));
            verify(roomRepository, times(1)).findById(roomId);
            verify(userRepository, times(1)).findById(userId);
        }

        /**
         * Scenario: Attempt to join non-existent room
         * Expected: Throw IllegalArgumentException
         */
        @Test
        @DisplayName("Should throw IllegalArgumentException when room not found")
        void testJoinRoom_RoomNotFound() {
            // Arrange
            when(roomRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThrows(IllegalArgumentException.class, () -> {
                roomService.joinRoom(999L, 1L);
            });
            verify(userRepository, never()).findById(any());
        }

        /**
         * Scenario: Attempt to join room with non-existent user
         * Expected: Throw UnauthorizedException
         */
        @Test
        @DisplayName("Should throw UnauthorizedException when user not found")
        void testJoinRoom_UserNotFound() {
            // Arrange
            when(roomRepository.findById(1L)).thenReturn(Optional.of(testRoom));
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThrows(UnauthorizedException.class, () -> {
                roomService.joinRoom(1L, 999L);
            });
        }

        /**
         * Scenario: Multiple users join same room
         * Expected: All users present in room members set
         */
        @ParameterizedTest
        @CsvSource({"1,2,3", "10,20,30"})
        @DisplayName("Should add multiple users to room")
        void testJoinRoom_MultipleUsers(Long userId1, Long userId2, Long userId3) {
            // Arrange
            Long roomId = 1L;
            when(roomRepository.findById(roomId)).thenReturn(Optional.of(testRoom));
            when(userRepository.findById(any())).thenReturn(Optional.of(testUser));

            // Act
            roomService.joinRoom(roomId, userId1);
            roomService.joinRoom(roomId, userId2);
            roomService.joinRoom(roomId, userId3);

            // Assert
            Set<Long> members = roomService.getRoomMembers(roomId);
            assertEquals(3, members.size());
            assertTrue(members.containsAll(Set.of(userId1, userId2, userId3)));
        }
    }

    // ========== LEAVE ROOM TESTS ==========
    @Nested
    @DisplayName("leaveRoom() scenarios")
    class LeaveRoomTests {

        /**
         * Scenario: User successfully leaves room
         * Expected: User removed from room members set
         */
        @Test
        @DisplayName("Should leave room successfully")
        void testLeaveRoom_Success() {
            // Arrange
            Long roomId = 1L;
            Long userId = 1L;
            when(roomRepository.findById(roomId)).thenReturn(Optional.of(testRoom));
            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
            roomService.joinRoom(roomId, userId);

            // Act
            when(roomRepository.existsById(roomId)).thenReturn(true);
            roomService.leaveRoom(roomId, userId);

            // Assert
            Set<Long> members = roomService.getRoomMembers(roomId);
            assertFalse(members.contains(userId));
            verify(roomRepository, times(1)).existsById(roomId);
        }

        /**
         * Scenario: Attempt to leave non-existent room
         * Expected: Throw IllegalArgumentException
         */
        @Test
        @DisplayName("Should throw IllegalArgumentException when room not found")
        void testLeaveRoom_RoomNotFound() {
            // Arrange
            when(roomRepository.existsById(999L)).thenReturn(false);

            // Act & Assert
            assertThrows(IllegalArgumentException.class, () -> {
                roomService.leaveRoom(999L, 1L);
            });
        }

        /**
         * Scenario: Leave room when user not in room (no-op)
         * Expected: No exception, set remains empty
         */
        @Test
        @DisplayName("Should handle leave when user not in room")
        void testLeaveRoom_UserNotInRoom() {
            // Arrange
            Long roomId = 1L;
            when(roomRepository.existsById(roomId)).thenReturn(true);

            // Act
            roomService.leaveRoom(roomId, 999L);

            // Assert
            Set<Long> members = roomService.getRoomMembers(roomId);
            assertTrue(members.isEmpty());
        }
    }

    // ========== GET ROOM TESTS ==========
    @Nested
    @DisplayName("getRoomById() scenarios")
    class GetRoomTests {

        /**
         * Scenario: Retrieve existing room
         * Expected: Return room with correct attributes
         */
        @Test
        @DisplayName("Should return room when exists")
        void testGetRoomById_Success() {
            // Arrange
            when(roomRepository.findById(1L)).thenReturn(Optional.of(testRoom));

            // Act
            Optional<Room> result = roomService.getRoomById(1L);

            // Assert
            assertTrue(result.isPresent());
            assertEquals(testRoom, result.get());
            verify(roomRepository, times(1)).findById(1L);
        }

        /**
         * Scenario: Retrieve non-existent room
         * Expected: Return empty Optional
         */
        @Test
        @DisplayName("Should return empty Optional when room not found")
        void testGetRoomById_NotFound() {
            // Arrange
            when(roomRepository.findById(999L)).thenReturn(Optional.empty());

            // Act
            Optional<Room> result = roomService.getRoomById(999L);

            // Assert
            assertTrue(result.isEmpty());
            verify(roomRepository, times(1)).findById(999L);
        }
    }

    // ========== GET ROOM MEMBERS TESTS ==========
    @Nested
    @DisplayName("getRoomMembers() scenarios")
    class GetRoomMembersTests {

        /**
         * Scenario: Get members from room with users
         * Expected: Return set containing all room members
         */
        @Test
        @DisplayName("Should return all room members")
        void testGetRoomMembers_WithMembers() {
            // Arrange
            Long roomId = 1L;
            when(roomRepository.findById(roomId)).thenReturn(Optional.of(testRoom));
            when(userRepository.findById(any())).thenReturn(Optional.of(testUser));
            roomService.joinRoom(roomId, 1L);
            roomService.joinRoom(roomId, 2L);

            // Act
            Set<Long> members = roomService.getRoomMembers(roomId);

            // Assert
            assertEquals(2, members.size());
            assertTrue(members.contains(1L));
            assertTrue(members.contains(2L));
        }

        /**
         * Scenario: Get members from non-existent room
         * Expected: Return empty set
         */
        @Test
        @DisplayName("Should return empty set for non-existent room")
        void testGetRoomMembers_EmptyRoom() {
            // Act
            Set<Long> members = roomService.getRoomMembers(999L);

            // Assert
            assertTrue(members.isEmpty());
        }
    }
}

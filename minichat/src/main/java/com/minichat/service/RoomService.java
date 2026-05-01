package com.minichat.service;

import com.minichat.entity.Room;
import com.minichat.entity.User;
import com.minichat.repository.RoomRepository;
import com.minichat.repository.UserRepository;
import com.minichat.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final ConcurrentHashMap<Long, Set<Long>> roomMembers = new ConcurrentHashMap<>();

    public Room createRoom(Long userId, String roomName) {
        // Validate room name
        if (roomName == null || roomName.trim().isEmpty()) {
            throw new IllegalArgumentException("Room name cannot be empty");
        }
        if (roomName.trim().length() > 100) {
            throw new IllegalArgumentException("Room name must be less than 100 characters");
        }

        // Validate user exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        Room room = Room.builder()
                .name(roomName.trim())
                .createdBy(user)
                .createdAt(LocalDateTime.now())
                .build();

        return roomRepository.save(room);
    }

    public void joinRoom(Long roomId, Long userId) {
        // Validate room exists
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));

        // Validate user exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        roomMembers.putIfAbsent(roomId, ConcurrentHashMap.newKeySet());
        roomMembers.get(roomId).add(userId);
    }

    public void leaveRoom(Long roomId, Long userId) {
        // Validate room exists
        if (!roomRepository.existsById(roomId)) {
            throw new IllegalArgumentException("Room not found");
        }

        roomMembers.computeIfPresent(roomId, (key, members) -> {
            members.remove(userId);
            return members;
        });
    }


    public List<Room> listRooms() {
        return roomRepository.findAll();
    }

    public Set<Long> getRoomMembers(Long roomId) {
        return roomMembers.getOrDefault(roomId, new HashSet<>());
    }

    public Optional<Room> getRoomById(Long roomId) {
        return roomRepository.findById(roomId);
    }
}

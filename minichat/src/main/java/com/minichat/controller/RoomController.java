package com.minichat.controller;

import com.minichat.dto.OnlineStatusDto;
import com.minichat.model.UserSession;
import com.minichat.service.RoomService;
import com.minichat.service.SessionManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@Slf4j
public class RoomController {
    
    private final RoomService roomService;
    private final SessionManager sessionManager;
    
    /**
     * Get list of online peers in a room
     * GET /api/rooms/{roomId}/peers
     */
    @GetMapping("/{roomId}/peers")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getRoomPeers(@PathVariable String roomId) {
        try {
            // Validate room exists
            if (!roomService.getRoomById(Long.parseLong(roomId)).isPresent()) {
                log.warn("Room not found: roomId={}", roomId);
                return ResponseEntity.notFound().build();
            }
            
            // Get all members in the room from SessionManager
            List<UserSession> members = sessionManager.getRoomMembers(roomId);
            
            // Map to OnlineStatusDto
            List<OnlineStatusDto> peers = members.stream()
                .map(session -> OnlineStatusDto.builder()
                    .userId(session.getUserId())
                    .username(session.getUsername())
                    .status(session.getConnectionStatus())
                    .roomId(roomId)
                    .timestamp(session.getLastActivityAt())
                    .build())
                .collect(Collectors.toList());
            
            log.info("Fetched peers for room: roomId={}, peerCount={}", roomId, peers.size());
            return ResponseEntity.ok(peers);
            
        } catch (NumberFormatException e) {
            log.error("Invalid roomId format: roomId={}", roomId);
            return ResponseEntity.badRequest().body("Invalid room ID format");
        } catch (Exception e) {
            log.error("Error fetching peers for room: roomId={}, error={}", roomId, e.getMessage());
            return ResponseEntity.badRequest().body("Error fetching peers: " + e.getMessage());
        }
    }

}

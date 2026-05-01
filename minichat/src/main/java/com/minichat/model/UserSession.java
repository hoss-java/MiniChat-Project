package com.minichat.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSession {
    private Long userId;
    private String username;
    private String socketSessionId;      // WebSocket session ID
    private String roomId;                // Current room (null if not in a room)
    private LocalDateTime connectedAt;
    private LocalDateTime lastActivityAt;
    private String connectionStatus;      // "connected", "idle", "disconnected"
    
    public boolean isActive() {
        return "connected".equals(connectionStatus);
    }
}

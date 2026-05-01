package com.minichat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnlineStatusDto {
    private Long userId;
    private String username;
    private String status;              // "online" or "offline"
    private String roomId;
    private LocalDateTime timestamp;
}

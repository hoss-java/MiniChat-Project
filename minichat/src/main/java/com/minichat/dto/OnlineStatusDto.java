package com.minichat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Slf4j
public class OnlineStatusDto {
    private Long userId;
    private String username;
    private String status;              // "online" or "offline"
    private String roomId;
    private LocalDateTime timestamp;
}

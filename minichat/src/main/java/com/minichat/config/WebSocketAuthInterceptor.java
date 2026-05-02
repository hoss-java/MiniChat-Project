package com.minichat.config;

import com.minichat.security.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class WebSocketAuthInterceptor implements ChannelInterceptor {
    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = accessor.getFirstNativeHeader("Authorization");
            
            log.info("WebSocket CONNECT attempt. Token: {}", token != null ? "present" : "missing");

            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
                
                if (jwtTokenProvider.validateToken(token)) {
                    Long userId = jwtTokenProvider.extractUserId(token);
                    String username = jwtTokenProvider.extractUsername(token);

                    // Store in session attributes
                    accessor.getSessionAttributes().put("userId", userId);
                    accessor.getSessionAttributes().put("username", username);
                    
                    accessor.setUser(new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        username, null, new java.util.ArrayList<>()
                    ));
                    
                    log.info("WebSocket user authenticated: userId={}, username={}", userId, username);
                } else {
                    log.warn("✗ Invalid token for WebSocket connection");
                    return null;
                }
            } else {
                log.warn("✗ Missing or malformed Authorization header. Token: {}", token);
                return null;
            }
        }

        // Preserve user on SUBSCRIBE if not already set
        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            if (accessor.getUser() == null) {
                // Get user from session attributes
                Long userId = (Long) accessor.getSessionAttributes().get("userId");
                String username = (String) accessor.getSessionAttributes().get("username");
                
                if (userId != null && username != null) {
                    accessor.setUser(new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        username, null, new java.util.ArrayList<>()
                    ));
                    log.info("✓ User restored on SUBSCRIBE: {}", username);
                }
            }
        }
        
        return message;
    }
}

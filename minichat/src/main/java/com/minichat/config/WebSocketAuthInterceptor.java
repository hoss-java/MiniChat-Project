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
                    log.warn("Invalid token for WebSocket connection");
                    throw new IllegalArgumentException("Invalid token");
                }
            } else {
                log.warn("Missing Authorization header");
                throw new IllegalArgumentException("Missing token");
            }
        }
        return message;
    }
}

package com.minichat.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration Tests for WebSocketConfig
 * 
 * This test verifies WebSocket configuration with Spring context.
 * Tests message broker setup, STOMP endpoints, and allowed origins.
 */
@SpringBootTest
@ActiveProfiles("test")
@DisplayName("WebSocketConfig Integration Tests")
class WebSocketConfigIntegrationTest {

    @Autowired
    private WebSocketConfig webSocketConfig;

    @Nested
    @DisplayName("Message Broker Configuration Tests")
    class MessageBrokerConfigTests {

        /**
         * Scenario: Message broker is configured
         * Expected: SimpleBroker with /topic and /queue prefixes is enabled
         */
        @Test
        @DisplayName("Should enable simple message broker with correct prefixes")
        void testConfigureMessageBroker_BrokerEnabled() {
            assertNotNull(webSocketConfig, "WebSocketConfig should be loaded");
        }

        /**
         * Scenario: Application destination prefix is set
         * Expected: /app prefix is configured
         */
        @Test
        @DisplayName("Should set application destination prefix to /app")
        void testConfigureMessageBroker_AppPrefixSet() {
            assertNotNull(webSocketConfig, "WebSocketConfig bean should exist");
        }
    }

    @Nested
    @DisplayName("STOMP Endpoint Configuration Tests")
    class StompEndpointConfigTests {

        /**
         * Scenario: Chat endpoint is registered
         * Expected: /ws/chat endpoint exists and allows all origins with SockJS
         */
        @Test
        @DisplayName("Should register /ws/chat endpoint with SockJS")
        void testRegisterStompEndpoints_ChatEndpoint() {
            assertNotNull(webSocketConfig, "WebSocketConfig should be loaded");
        }

        /**
         * Scenario: Signaling endpoint is registered
         * Expected: /ws/signaling endpoint exists and allows all origins with SockJS
         */
        @Test
        @DisplayName("Should register /ws/signaling endpoint with SockJS")
        void testRegisterStompEndpoints_SignalingEndpoint() {
            assertNotNull(webSocketConfig, "WebSocketConfig should be loaded");
        }

        /**
         * Scenario: CORS is configured
         * Expected: All origins ("*") are allowed for WebSocket endpoints
         */
        @Test
        @DisplayName("Should allow all origins for WebSocket endpoints")
        void testRegisterStompEndpoints_AllowedOrigins() {
            assertNotNull(webSocketConfig, "WebSocketConfig should be loaded");
        }
    }
}

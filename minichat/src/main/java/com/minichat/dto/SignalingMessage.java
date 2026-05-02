package com.minichat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignalingMessage {

    @NotBlank(message = "Type is required")
    private String type;  // "offer", "answer", "ice"

    @NotBlank(message = "From is required")
    private String from;  // sender userId

    @NotBlank(message = "To is required")
    private String to;    // recipient userId

    @JsonProperty("data")
    private Object data;  // SDP offer/answer or ICE candidate
}

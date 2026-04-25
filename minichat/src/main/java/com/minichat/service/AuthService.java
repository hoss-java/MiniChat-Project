package com.minichat.service;

import com.minichat.dto.RegisterRequest;
import com.minichat.dto.RegisterResponse;
import com.minichat.dto.LoginRequest;
import com.minichat.dto.LoginResponse;
import com.minichat.dto.UserProfileDto;
import com.minichat.entity.User;
import com.minichat.entity.RoleType;
import com.minichat.entity.Role;
import com.minichat.entity.Session;
import com.minichat.repository.UserRepository;
import com.minichat.repository.SessionRepository;
import com.minichat.exception.UserAlreadyExistsException;
import com.minichat.exception.UnauthorizedException;
import com.minichat.exception.InvalidPasswordException;
import com.minichat.exception.PasswordMismatchException;
import com.minichat.exception.RoleNotFoundException;
import com.minichat.repository.RoleRepository;
import com.minichat.util.PasswordValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Service
@Transactional
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private PasswordValidator passwordValidator;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    public RegisterResponse register(RegisterRequest request) {
        // Validate password strength
        if (!passwordValidator.isValidPassword(request.getPassword())) {
            throw new InvalidPasswordException(passwordValidator.getPasswordRequirements());
        }
        
        // Validate passwords match
        if (!request.isPasswordMatch()) {
            throw new PasswordMismatchException("Passwords do not match");
        }
        
        // Check duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already registered");
        }
        
        // Check duplicate username
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException("Username already registered");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setUsername(request.getUsername());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setIsActive(true);
        
        Role userRole = roleRepository.findByName(RoleType.USER)
            .orElseThrow(() -> new RoleNotFoundException("USER role not found"));
        user.setRoles(new HashSet<>(Set.of(userRole)));


        User savedUser = userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(savedUser);
        String refreshToken = jwtService.generateRefreshToken(savedUser);

        saveSession(savedUser, refreshToken);

        return RegisterResponse.builder()
            .id(savedUser.getId())
            .username(savedUser.getUsername())
            .email(savedUser.getEmail())
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .createdAt(savedUser.getCreatedAt())
            .build();
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (!user.getIsActive()) {
            throw new UnauthorizedException("User account is inactive");
        }

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        saveSession(user, refreshToken);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .build();
    }

    public LoginResponse refreshToken(String refreshToken) {
        if (!jwtService.validateToken(refreshToken)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        Session session = sessionRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new UnauthorizedException("Session not found"));

        if (!session.getActive() || session.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new UnauthorizedException("Session expired");
        }

        User user = session.getUser();
        String accessToken = jwtService.generateAccessToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);

        session.setActive(false);
        sessionRepository.save(session);

        saveSession(user, newRefreshToken);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(newRefreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .build();
    }

    public UserProfileDto getCurrentUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        return UserProfileDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .fingerprint(user.getFingerprint())
                .createdAt(user.getCreatedAt())
                .lastLogin(user.getLastLogin())
                .build();
    }

    public UserProfileDto updateUserProfile(String email, UserProfileDto profileDto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        if (profileDto.getUsername() != null) {
            user.setUsername(profileDto.getUsername());
        }

        User updatedUser = userRepository.save(user);

        return UserProfileDto.builder()
                .id(updatedUser.getId())
                .email(updatedUser.getEmail())
                .username(updatedUser.getUsername())
                .fingerprint(updatedUser.getFingerprint())
                .createdAt(updatedUser.getCreatedAt())
                .lastLogin(updatedUser.getLastLogin())
                .build();
    }

    private void saveSession(User user, String refreshToken) {
        Session session = new Session();
        session.setUser(user);
        session.setRefreshToken(refreshToken);
        session.setExpiresAt(LocalDateTime.now().plusDays(7));
        session.setActive(true);
        sessionRepository.save(session);
    }
}

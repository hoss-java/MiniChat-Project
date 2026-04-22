---
Title: minichat
Description: plans and project management sheets
Date: 
Robots: noindex,nofollow
Template: index
---

# minichat

## Plan and Time Estimation for P2P Chat System

Time Estimation is based on  **Subscription-Platform** performance, 

here's the key insight:
**Actual pace:** ~1.5 days per card / ~44 work-days for 32 calendar days on a full-stack project with security focus.

**Spend heavily on:** Authentication, testing, security, and refinement (72% of time on auth alone in subscription platform).

**Move fast on:** CRUD features, UI work, and integrations once patterns are established.

---

## Revised Phase-Based Plan with Realistic Timings

| Phase | Backend | Frontend | Duration (work-days) | Calendar Days | Total Status |
|-------|---------|----------|----------------------|----------------|--------------|
| **Phase 1: Auth Foundation** | User model, JWT, login | React setup, auth UI | 8-10 | 10-14 | ⏳ Start here |
| **Phase 2: WebSocket Signaling** | WebSocket server, room mgmt, peer discovery | WebSocket client, room UI | 6-8 | 8-10 | Follow Phase 1 |
| **Phase 3: P2P & Data Channels** | SDP/ICE relaying, STUN/TURN config | WebRTC setup, data channels, localStorage chat | 8-10 | 10-14 | Follow Phase 2 |
| **Phase 4: E2E Encryption** | Key exchange endpoints, key storage | Crypto lib integration, key UI | 10-12 | 12-16 | Follow Phase 3 |
| **Phase 5: Message History & Server Storage** | Message persistence, encrypted storage | Toggle local/server, sync UI | 6-8 | 8-12 | Follow Phase 4 |
| **Phase 6: Testing & Optimization** | Integration tests, edge cases | Unit tests, E2E tests | 8-10 | 10-14 | Follow Phase 5 |
| **Phase 7: Voice/Video** | Signaling optimization | WebRTC audio/video, UI controls | 8-10 | 10-14 | Follow Phase 6 |
| **Phase 8: Client Apps (Electron)** | API versioning, minor adjustments | React + Electron packaging | 6-8 | 8-12 | Follow Phase 7 |
| | | | **~60-86 work-days** | **~86-116 calendar days** | **3-4 months realistic** |

---

## Phase-by-Phase Detailed Breakdown

### Phase 1: Auth Foundation (8-10 work-days | 10-14 calendar days)

**Why longer than you might think:** Your subscription platform spent 9 days on JWT alone. Expect similar here because security is foundational.

#### Backend Tasks
- [ ] **Spring Boot project setup** (Maven, dependencies, structure) — *0.5 days*
  - Spring Web, WebSocket, Security, JPA, MySQL
- [ ] **Database schema** (User, Role, Session entities) — *1 day*
  - Users table with hashed passwords, roles, created_at, last_login
- [ ] **User registration endpoint** (`POST /auth/register`) — *1.5 days*
  - Input validation, password hashing (BCrypt), duplicate user check, return JWT
- [ ] **Login endpoint** (`POST /auth/login`) — *2 days*
  - Email/password validation, token generation, refresh token logic
- [ ] **JWT filter & validation** — *2.5 days*
  - Token validation on all protected endpoints, error handling, token expiration
- [ ] **User profile endpoint** (`GET /auth/me`, `PUT /auth/profile`) — *1 day*
  - Retrieve current user, update profile info
- [ ] **Integration tests** (auth endpoints) — *2 days*
  - Test register, login, JWT validation, refresh tokens

**Backend Subtotal: 10-11 days (expect 10, budget for 12)**

#### Frontend Tasks
- [ ] **React project setup** (Create React App, folder structure, dependencies) — *0.5 days*
  - Install react-router, axios, Context API setup
- [ ] **Auth context/state management** — *1.5 days*
  - Store JWT, user data, login/logout actions
- [ ] **Login page UI** — *1.5 days*
  - Form, validation, error messages, redirect on success
- [ ] **Registration page UI** — *1.5 days*
  - Form, password confirmation, validation, success message
- [ ] **Protected route wrapper** — *1 day*
  - Redirect to login if not authenticated
- [ ] **Basic dashboard/home page** — *0.5 days*
  - Just show "Welcome, {username}" and logout button
- [ ] **HTTP service layer** (API calls) — *1 day*
  - Axios instance with JWT header injection, error handling
- [ ] **Unit tests** (auth service, context) — *2 days*
  - Test login flow, JWT storage, logout

**Frontend Subtotal: 9-10 days (expect 10, budget for 11)**

**Phase 1 Total: 8-10 work-days (~10-12 with buffer) = 10-14 calendar days**

**Deliverable:** User can register, login, see personalized dashboard. JWT works.

---

### Phase 2: WebSocket Signaling (6-8 work-days | 8-10 calendar days)

Now you're on familiar ground (like Phases 2-3 of subscription platform—should be fast).

#### Backend Tasks
- [ ] **Spring WebSocket configuration** — *1 day*
  - WebSocketConfig, message broker setup (SimpleBroker)
- [ ] **User session tracking** (online/offline) — *1.5 days*
  - Track connected users in-memory or Redis, broadcast online status
- [ ] **Room entity & service** — *1 day*
  - Create room, join room, leave room, list rooms
- [ ] **Peer discovery endpoint** — *1 day*
  - `/api/rooms/{roomId}/peers` — return list of online peers
- [ ] **Signaling message handler** — *1.5 days*
  - Relay SDP offers, answers, ICE candidates between peers
  - Message format: `{ type: 'offer|answer|ice', from: userId, to: userId, data: {...} }`
- [ ] **Integration tests** (WebSocket flow) — *1.5 days*
  - Test user connect, room join, message relay

**Backend Subtotal: 6-7 days**

#### Frontend Tasks
- [ ] **WebSocket client setup** — *1 day*
  - SockJS + STOMP library (or raw WebSocket), connection management
- [ ] **Room list page** — *1.5 days*
  - Display available rooms, show online peer count
- [ ] **Create/join room UI** — *1 day*
  - Form to create or join room, room selection
- [ ] **Online users display** — *1 day*
  - Real-time list of peers in current room
- [ ] **Signaling message handler** — *1 day*
  - Listen for SDP/ICE messages, trigger WebRTC connection
- [ ] **Connection state UI** — *0.5 days*
  - Show "connecting", "connected", "error" status
- [ ] **Unit tests** (WebSocket service) — *1.5 days*
  - Mock WebSocket, test message handling

**Frontend Subtotal: 6.5-7 days**

**Phase 2 Total: 6-8 work-days = 8-10 calendar days**

**Deliverable:** Users can create rooms, see online peers, real-time updates work.

---

### Phase 3: P2P & Data Channels (8-10 work-days | 10-14 calendar days)

**Note:** This is the hardest part. WebRTC debugging is tedious (tricky NAT/firewall issues). Budget generously.

#### Backend Tasks
- [ ] **STUN/TURN server configuration** — *1.5 days*
  - Research & setup: Use **Google's public STUN** (free) + configure **Coturn** (self-hosted) or Firebase ICE servers
  - Add to WebSocket signaling response: `{ iceServers: [...] }`
- [ ] **SDP offer/answer relay** — *1 day*
  - Already partially done in Phase 2, refine here
- [ ] **ICE candidate relay** — *1 day*
  - Handle `{ type: 'ice', candidate: {...} }` messages, forward to peer
- [ ] **Connection monitoring** (optional) — *0.5 days*
  - Track P2P connection state, log failures
- [ ] **Integration tests** (P2P signaling) — *1.5 days*
  - Mock WebRTC, test offer/answer/ICE flow

**Backend Subtotal: 5-6 days**

#### Frontend Tasks
- [ ] **WebRTC peer connection setup** — *2 days*
  - Initialize RTCPeerConnection, handle state changes
  - **Consider using `simple-peer` library** (1 day faster than raw WebRTC)
- [ ] **Data channel creation & handling** — *1.5 days*
  - Create data channel, handle `onmessage`, `onopen`, `onerror`
- [ ] **Message sending/receiving** — *1 day*
  - Send messages via data channel, display in chat UI
- [ ] **Chat UI** (message list, input, send button) — *1.5 days*
  - Display messages, timestamp, sender name
- [ ] **localStorage persistence** — *1 day*
  - Save messages to localStorage with key `chat_${peerId}_${roomId}`
  - Load on reconnect
- [ ] **Connection error handling** — *1 day*
  - Display user-friendly errors (NAT issues, connection failed, etc.)
- [ ] **Unit & integration tests** (WebRTC, data channels) — *2 days*
  - Test peer connection flow, message sending, localStorage

**Frontend Subtotal: 9-10 days**

**Phase 3 Total: 8-10 work-days = 10-14 calendar days**

**Deliverable:** Two users can P2P chat, messages stored locally.

**Common Issues to Budget For:**
- STUN/TURN not working behind corporate firewalls (1-2 days debugging)
- Browser WebRTC inconsistencies (add 0.5 days)
- localStorage quota issues (0.5 days)

---

### Phase 4: E2E Encryption (10-12 work-days | 12-16 calendar days)

**Why long:** Crypto is complex. You need careful implementation, thorough testing, and key management edge cases.

#### Backend Tasks
- [ ] **Key entity & schema** — *1 day*
  - Store user public key, key fingerprint, created_at, key_type (auto/manual)
- [ ] **Key generation service** — *1.5 days*
  - Generate Ed25519 keypair using **Bouncy Castle** or **NaCl4j**
  - Return public key only to user
- [ ] **POST /keys/generate endpoint** — *1 day*
  - Create keypair on first login, return public key
- [ ] **GET /keys/{userId} endpoint** — *0.5 days*
  - Public key lookup
- [ ] **Key exchange endpoint** — *1 day*
  - Store peer's public key when user requests it (trust on first use)
- [ ] **Encrypted key storage** — *1.5 days*
  - Encrypt private keys at rest (optional: use HSM or key vault)
- [ ] **Key rotation/revocation** (optional, important) — *1 day*
  - Allow users to rotate keys, invalidate old ones
- [ ] **Integration tests** (key exchange flow) — *2 days*
  - Test keypair generation, storage, retrieval, trust-on-first-use

**Backend Subtotal: 10-11 days**

#### Frontend Tasks
- [ ] **Crypto library integration** — *1 day*
  - Choose **libsodium.js** (recommended) or **TweetNaCl.js**
  - Test bundle size impact
- [ ] **Key generation on first login** — *1.5 days*
  - Generate keypair, prompt user to save or confirm auto-generation
- [ ] **Public key display & fingerprint** — *1 day*
  - Show fingerprint (first 16 chars of public key hash) for manual verification
- [ ] **Fetch peer's public key** — *0.5 days*
  - Call backend to get peer's key before starting chat
- [ ] **Encrypt outgoing messages** — *1.5 days*
  - Before sending via data channel, encrypt with peer's public key
- [ ] **Decrypt incoming messages** — *1.5 days*
  - After receiving, decrypt with your private key
- [ ] **Key import/export UI** — *1 day*
  - Allow users to manually import a key (paste) or export their public key
- [ ] **Trust-on-first-use UI** — *0.5 days*
  - Show warning: "Trusting peer's key for the first time"
- [ ] **Key verification UI** (optional) — *0.5 days*
  - Side-by-side fingerprint comparison for verification
- [ ] **Unit tests** (crypto operations) — *2 days*
  - Test encryption/decryption, key generation, import/export
- [ ] **E2E tests** (encrypted chat flow) — *1 day*
  - Two browser instances, verify end-to-end encryption works

**Frontend Subtotal: 10-11 days**

**Phase 4 Total: 10-12 work-days = 12-16 calendar days**

**Deliverable:** Messages are encrypted E2E, key exchange works, users can see key fingerprints.

**Common Issues:**
- Crypto library bundle size bloat (plan 0.5 days)
- Key format confusion (PEM vs. raw bytes) (0.5 days)
- Decryption failures on old clients (1 day)

---

### Phase 5: Message History & Server Storage (6-8 work-days | 8-12 calendar days)

Back to familiar CRUD-like work—should be quick.

#### Backend Tasks
- [ ] **Message entity & schema** — *0.5 days*
  - `id, roomId, senderId, receiverId, encryptedContent, createdAt, isRead`
- [ ] **Message service & repository** — *1 day*
  - Save message, query by room/user, pagination
- [ ] **POST /messages endpoint** — *1 day*
  - Accept encrypted message, store in DB
- [ ] **GET /messages?roomId={id}&limit=50 endpoint** — *1 day*
  - Return paginated history
- [ ] **Message retention policy** (optional) — *1 day*
  - Auto-delete messages older than X days (configurable)
- [ ] **Read receipt tracking** (optional) — *0.5 days*
  - Mark messages as read
- [ ] **Integration tests** — *1.5 days*

**Backend Subtotal: 7-8 days**

#### Frontend Tasks
- [ ] **Storage toggle UI** — *0.5 days*
  - Checkbox: "Save chat history on server" (default: local only)
- [ ] **Fetch server history on room join** — *1 day*
  - If toggle is on, call GET /messages, merge with local
- [ ] **Display server messages** — *0.5 days*
  - Show different styling or indicator for server vs. local messages
- [ ] **Clear old localStorage** — *0.5 days*
  - When switching to server-only, optionally clear local cache
- [ ] **Sync status indicator** — *0.5 days*
  - Show "synced to server" or "local only" badge on messages
- [ ] **Error handling** (storage failures) — *1 day*
  - If server save fails, fallback to local gracefully
- [ ] **Unit tests** (storage toggle, sync logic) — *1.5 days*

**Frontend Subtotal: 6-7 days**

**Phase 5 Total: 6-8 work-days = 8-12 calendar days**

**Deliverable:** Users can optionally sync chat history to server, toggle works.

---

# Phase 6: Testing & Optimization (8-10 work-days | 10-14 calendar days) - COMPLETE

**Based on your subscription platform:** You spent 6 days on JS unit tests alone. Expect similar rigor here.

#### Backend Tasks
- [ ] **Complete integration test suite** — *3 days*
  - Auth flow, WebSocket signaling, P2P relay, encryption, message storage
  - Aim for 80%+ code coverage
- [ ] **Performance testing** — *1.5 days*
  - Load test WebSocket server (100+ concurrent users)
  - Test message throughput, latency
- [ ] **Security audit** — *1.5 days*
  - Review JWT handling, key storage, SQL injection, CSRF
- [ ] **Error handling edge cases** — *1 day*
  - Network failures, malformed messages, key expiration
- [ ] **Refactoring & cleanup** — *0.5 days*

**Backend Subtotal: 7.5 days**

#### Frontend Tasks
- [ ] **Unit tests** (all services, components) — *3 days*
  - WebSocket service, crypto service, chat component, auth context
  - Message service, storage service, encryption logic
  - Aim for 80%+ code coverage
  - Use Jest + React Testing Library
- [ ] **E2E tests** (Cypress or Playwright) — *2 days*
  - Full user flow: register → login → create room → chat → send message
  - Test both local & server storage modes
  - Test P2P connection establishment
  - Test encryption/decryption end-to-end
- [ ] **Cross-browser testing** — *0.5 days*
  - Test on Chrome, Firefox, Safari (WebRTC behavior differs)
  - Verify encryption works across browsers
- [ ] **Performance profiling** — *0.5 days*
  - Lighthouse audit, bundle size check, memory leaks
  - Test with 100+ messages in chat history
- [ ] **Mobile responsiveness testing** — *0.5 days*
  - Test on mobile viewport, touch interactions
- [ ] **Accessibility testing** — *0.5 days*
  - Screen reader compatibility, keyboard navigation
- [ ] **Error scenario testing** — *1 day*
  - Network disconnection, encryption key missing, storage quota exceeded
  - WebSocket reconnection, data channel failures

**Frontend Subtotal: 8-9 days**

**Phase 6 Total: 8-10 work-days = 10-14 calendar days**

**Deliverable:** 80%+ test coverage, stable on all browsers, documented test cases.

**Common Issues:**
- WebRTC testing complexity (mock with fake RTCPeerConnection) (1 day)
- Flaky async tests in E2E (0.5 days)
- Cross-browser crypto differences (0.5 days)

---

### Phase 7: Voice/Video (8-10 work-days | 10-14 calendar days)

**Note:** Audio/video adds complexity but reuses WebRTC infrastructure from Phase 3. Should be faster than P2P setup.

#### Backend Tasks
- [ ] **Signaling optimization for media** — *1 day*
  - Add media type to SDP offer/answer (`audio: true, video: true`)
  - Handle renegotiation when toggling media on/off
- [ ] **Media state tracking** (optional) — *1 day*
  - Track which peers have audio/video enabled in-room
  - Broadcast media state via WebSocket
- [ ] **TURN server optimization for media** — *1.5 days*
  - Ensure TURN servers have bandwidth for video
  - Test with multiple simultaneous video streams
- [ ] **Monitoring media quality** (optional) — *1 day*
  - Log WebRTC stats (bandwidth, packet loss, latency)
  - Alert on poor connection quality
- [ ] **Integration tests** (media signaling) — *1.5 days*
  - Test offer/answer with audio/video tracks
  - Test renegotiation, track removal

**Backend Subtotal: 6-7 days**

#### Frontend Tasks
- [ ] **WebRTC media stream setup** — *2 days*
  - `navigator.mediaDevices.getUserMedia()` for audio/video
  - Handle permission requests and denials
  - Stop tracks cleanly on disconnect
- [ ] **Audio/video track management** — *1.5 days*
  - Add audio/video tracks to peer connection via `addTrack()`
  - Handle remote track `ontrack` event
  - Display remote video/audio streams
- [ ] **Local video preview** — *1 day*
  - Show user's own camera feed in small preview window
  - Mute/unmute audio control
- [ ] **Remote video display** — *1.5 days*
  - Render remote peer's video stream in main chat area
  - Handle multiple video streams (grid layout for 3+ peers)
- [ ] **Media controls UI** — *1 day*
  - Toggle buttons: Mute audio, Turn off camera
  - Disable/enable button state based on device availability
  - Show indicator when audio/video is off
- [ ] **Error handling** (camera/mic issues) — *1 day*
  - Handle permission denied, device not found, in-use errors
  - Graceful fallback to audio-only if video fails
  - User-friendly error messages
- [ ] **Performance optimization** — *1 day*
  - Bandwidth throttling detection
  - Adaptive bitrate (lower quality if bandwidth is low)
  - CPU optimization for video encoding
- [ ] **Unit & E2E tests** (media flow) — *1.5 days*
  - Mock `getUserMedia()`
  - Test track addition/removal
  - Test video UI rendering

**Frontend Subtotal: 10-11 days**

**Phase 7 Total: 8-10 work-days = 10-14 calendar days**

**Deliverable:** Users can send/receive audio and video in P2P chat, controls work.

**Common Issues:**
- Camera/microphone permission prompts (browser-specific) (0.5 days)
- Video codec compatibility across browsers (1 day)
- Audio echo cancellation setup (0.5 days)
- Bandwidth adaptation complexity (1 day)

---

### Phase 8: Client Apps (Electron/React Native) (6-8 work-days | 8-12 calendar days)

**Note:** Since you're sharing React code, this is mostly packaging + platform-specific adjustments.

#### Backend Tasks
- [ ] **API versioning strategy** — *0.5 days*
  - Plan for backward compatibility as clients evolve
  - Add API version header or path versioning
- [ ] **Client app endpoints** (optional) — *0.5 days*
  - App version check endpoint
  - Client-specific config endpoint (STUN/TURN servers, features)
- [ ] **Minor adjustments** — *0.5 days*
  - CORS configuration for Electron
  - User-Agent detection for app clients
- [ ] **Testing with Electron/React Native clients** — *1 day*
  - Verify auth flow works in Electron
  - Test WebSocket in native environment

**Backend Subtotal: 2.5-3 days**

#### Frontend Tasks

##### Electron (Desktop App)
- [ ] **Electron project setup** — *1 day*
  - `electron-react-boilerplate` or manual setup
  - Main process + renderer process separation
  - Bundler config (Webpack/Vite)
- [ ] **Share React code** — *0.5 days*
  - Extract common components into shared folder
  - Both web and Electron import from `/src/shared`
- [ ] **Platform-specific adjustments** — *1.5 days*
  - File system access (if needed for logs, caches)
  - Native window controls (minimize, maximize, close)
  - App menu (File, Edit, Help)
  - System tray icon (optional)
- [ ] **Auto-update mechanism** — *1 day*
  - Check for new version, download, install, restart
  - Use `electron-updater` library
- [ ] **Packaging & distribution** — *1 day*
  - Create installers (.exe for Windows, .dmg for macOS, .AppImage for Linux)
  - Code signing (optional, for distribution)
- [ ] **Testing (Electron-specific)** — *1 day*
  - Spectron for E2E testing in Electron
  - Test native features, auto-update flow

**Electron Subtotal: 5.5-6 days**

##### React Native (Mobile App) - *Optional, add if needed*
- [ ] **React Native project setup** — *1.5 days*
  - Expo or bare React Native project
  - Native iOS/Android setup
- [ ] **Share React code** — *0.5 days*
  - Extract common logic into shared services
  - Platform-specific UI components (iOS vs Android styling)
- [ ] **Platform-specific adjustments** — *2 days*
  - Push notifications for incoming messages
  - Background task handling (keep WebSocket alive)
  - Camera/microphone permissions (iOS-specific flows)
  - Deep linking (open app from notification)
- [ ] **Navigation adaptation** — *1 day*
  - React Navigation for mobile bottom tabs
  - Mobile-optimized layout for small screens
- [ ] **Testing & packaging** — *1.5 days*
  - Build APK (Android) and IPA (iOS)
  - TestFlight / Google Play Store submission prep

**React Native Subtotal: 6.5-7 days** *(if included)*

**Phase 8 Total:**
- **Desktop only (Electron):** 6-7 work-days = 8-10 calendar days
- **Desktop + Mobile:** 12-14 work-days = 16-20 calendar days

**Deliverable:** Users can download and run Electron desktop app, mobile app available on stores.

---

## COMPLETE PROJECT TIMELINE SUMMARY

| Phase | Work-Days | Calendar Days | Cumulative |
|-------|-----------|---------------|-----------|
| **1: Auth Foundation** | 8-10 | 10-14 | 10-14 |
| **2: WebSocket Signaling** | 6-8 | 8-10 | 18-24 |
| **3: P2P & Data Channels** | 8-10 | 10-14 | 28-38 |
| **4: E2E Encryption** | 10-12 | 12-16 | 40-54 |
| **5: Message History & Server Storage** | 6-8 | 8-12 | 48-66 |
| **6: Testing & Optimization** | 8-10 | 10-14 | 58-80 |
| **7: Voice/Video** | 8-10 | 10-14 | 68-94 |
| **8: Electron Desktop App** | 6-7 | 8-10 | 76-104 |
| **TOTAL (no mobile)** | **60-85** | **86-114** | **3-4 months** |
| **TOTAL (with React Native)** | **72-100** | **102-134** | **4-5 months** |

---

## Resource Allocation Recommendation

### Ideal Team Structure
- **1 Backend Engineer** (Java/Spring Boot) — handles all backend phases
- **1 Frontend Engineer** (React) — handles web + Electron/React Native
- **1 QA Engineer** (Part-time from Phase 3+) — testing & edge cases
- **1 DevOps/Infrastructure** (Part-time) — STUN/TURN setup, deployment, monitoring

### If Solo Developer (You)
**Realistic pace:** 1.5 days per major task (not 0.5-1 day estimates above)
- **Adjusted timeline:** ~100-130 work-days = **5-6 months** (not 3-4)
- **Strategy:** Focus on Phases 1-6 first (core chat), defer Phase 7-8 (media/apps) to v2

---

## Critical Path (Must-Do Before Next Phase)

```
Phase 1 (Auth)
    ↓
Phase 2 (WebSocket)
    ↓
Phase 3 (P2P) ← Don't skip, critical for decentralization
    ↓
Phase 4 (Encryption) ← Security foundation
    ↓
Phase 5 (Server Storage) ← Optional, but recommended for UX
    ↓
Phase 6 (Testing) ← Non-negotiable before production
    ↓
Phase 7 (Media) ← Nice-to-have, can ship without
    ↓
Phase 8 (Apps) ← Final polish, can use web app first
```

---

## Risk Mitigation

| Risk | Mitigation | Buffer |
|------|-----------|--------|
| WebRTC NAT/firewall issues | Setup TURN server early (Phase 3) | +2 days |
| Crypto implementation bugs | Use well-tested libraries (libsodium.js), heavy testing | +3 days |
| Async state management complexity | Use established patterns (Context API or Redux) | +1 day |
| Browser inconsistencies | Test on Chrome/Firefox/Safari from Phase 2 | +1 day |
| WebSocket reliability | Implement reconnection logic with exponential backoff | +1 day |

**Total recommended buffer: +8 days across 8 phases ≈ 1 day per phase**

---
```
## Budget Summary (if outsourcing)

Based on **$80/hr average developer rate:**

| Scenario | Work-Days | Hours | Cost |
|----------|-----------|-------|------|
| Core Chat (Phases 1-5) | 38-48 | 304-384 | **$24.3K - $30.7K** |
| Full Product (Phases 1-7) | 68-94 | 544-752 | **$43.5K - $60.2K** |
| + Mobile App (Phase 8) | 80-104 | 640-832 | **$51.2K - $66.6K** |

**Note:** Prices assume experienced developer; junior devs would be slower but cheaper.
```

```mermaid
gantt
    section %BOARD%
```


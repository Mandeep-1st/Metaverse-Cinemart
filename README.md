# Metaverse Cinema

## Project Summary

Metaverse Cinema is a Turborepo-based full-stack monorepo for a social movie experience. It combines:

- a main web app for authentication, discovery, movie detail views, AI-assisted flows, and room management
- a 3D room app for immersive shared viewing and interaction
- an HTTP backend for REST APIs, auth, rooms, movie data, comments, and AI endpoints
- a WebSocket + Mediasoup signaling server for real-time room coordination and WebRTC media
- supporting worker services and shared workspace packages

The product idea is bigger than a standard movie listing app. It tries to join together:

- movie exploration
- user identity and profiles
- room creation and sharing
- persistent comments and reactions
- AI-assisted movie interactions
- real-time synchronized room activity
- WebRTC-based communication inside a themed cinema space

## Monorepo Architecture

This repository uses:

- `pnpm` workspaces
- `turbo` for orchestration
- TypeScript across frontend and backend
- shared workspace packages under `packages/`

Top-level structure:

```text
apps/
  ai-server/
  http-server/
  misc-server/
  socket-server/
  web-main/
  web-room/
  web-test/
packages/
  config/
  db/
  eslint-config/
  tailwind-config/
  types/
  typescript-config/
  ui/
```

## Core Apps

### 1. `apps/web-main`

Primary user-facing frontend built with:

- React 18
- Vite
- React Router
- Tailwind CSS
- shared UI components from `@repo/ui`

Main responsibilities:

- landing page and entry experience
- signup and login
- OTP verification and account onboarding
- avatar selection
- protected authenticated app shell
- movie browsing and discovery
- movie detail pages
- AI-assisted movie interaction
- room creation and room management
- navigation into the immersive room experience

Important routes in `src/App.tsx`:

- `/` -> landing page
- `/login`
- `/signup`
- `/avatar`
- `/home`
- `/movies/:movieId`
- `/movies/:movieId/ai`
- `/rooms`

Key architectural notes:

- Uses `AuthProvider` for session state.
- Uses `AppShellProvider` for authenticated app-level state.
- Uses protected route guards to enforce login + avatar selection.
- Uses a centralized API client which now resolves URLs through `@repo/config`.

### 2. `apps/web-room`

Immersive room frontend built with:

- React 18
- Vite
- React Router
- Three.js
- React Three Fiber
- Drei
- Mediasoup client

Main responsibilities:

- render the cinema/theatre room
- room join and room experience
- synchronized shared state
- room-level media and signaling coordination
- chat, likes, vote state, trailer/player sync, and navigation back to the main app

Important route:

- `/` -> `Space`

Key architectural notes:

- `Space.tsx` is the major orchestration page for the room experience.
- `SocketProvider` wraps socket connectivity for signaling.
- `SocketService` manages low-level WebSocket communication.
- Uses shared UI pieces like AI mode panel, loading spinner, movie detail panel, and persistent comments panel.
- Uses centralized config from `@repo/config` for API and socket configuration.

### 3. `apps/http-server`

Main REST backend built with:

- Express
- TypeScript
- Mongoose
- JWT auth
- Multer
- Cloudinary
- Redis
- Nodemailer

Main responsibilities:

- auth and user lifecycle
- profile and avatar updates
- movie search/discovery/detail APIs
- movie comments
- room creation and retrieval
- AI routes protected by auth
- cross-service coordination with worker/email flows

Mounted API namespaces from `src/app.ts`:

- `/api/v1/users`
- `/api/v1/movies`
- `/api/v1/ai`
- `/api/v1/rooms`

Backend route highlights:

#### User routes

- `POST /register`
- `POST /signin`
- `POST /google`
- `POST /verifyotp`
- `POST /requestotp`
- `GET /me`
- `GET /logout`
- `POST /password-email-sent`
- `PATCH /avatar`
- `PATCH /profile`
- `PATCH /password`
- `POST /feedback`

#### Movie routes

- `GET /search`
- `GET /discover`
- `GET /recommendations`
- `GET /:tmdbId/comments`
- `POST /:tmdbId/comments`
- `GET /:tmdbId/related`
- `GET /:tmdbId`
- `POST /seed`
- `POST /preference/init`
- `GET /preference`
- `POST /whenclicked`
- `POST /whensearch`
- `POST /whencomment`
- `POST /whenroom`

#### Room routes

- `GET /mine`
- `POST /`
- `GET /:roomId`
- `GET /:roomId/recommendations`

#### AI routes

- `POST /suggest`
- `POST /context-chat`
- `POST /chat`

### 4. `apps/socket-server`

Real-time signaling and WebRTC coordination service built with:

- Express
- native HTTP server
- `ws`
- Mediasoup

Main responsibilities:

- WebSocket connection handling
- room join flow
- room-scoped peer management
- router/transport/producer/consumer management for Mediasoup
- avatar sync
- trailer sync
- chat messages
- like events
- vote state
- room bootstrap events for late joiners

Observed message/event types in the server include:

- `join-room`
- `avatar-sync`
- `getRtpCapabilities`
- `createWebRtcTransport`
- `transport-connect`
- `transport-recv-connect`
- `transport-produce`
- `consume`
- `consumer-resume`
- `producer-pause`
- `producer-resume`
- `producer-close`
- `trailer-update`
- `chat-send`
- `chat-like`
- `vote-submit`

The server stores in-memory room state with:

- room router
- connected peers
- producers
- chat messages
- vote state
- trailer state

Important scaling note:

- state is currently in memory inside the socket server, so horizontal scaling would need shared state or sticky session strategy

### 5. `apps/misc-server`

Supporting worker-like service.

Main observed responsibilities:

- health-check HTTP endpoint
- Redis-backed queue consumption
- sending mail
- notifying the HTTP server when password email delivery is completed

It appears to process a `sendPassword` Redis queue and then POST back to:

- `/api/v1/users/password-email-sent`

### 6. `apps/ai-server`

At the moment this app looks minimal.

Observed state:

- basic Express server bootstrapping
- not much implemented yet compared to the HTTP server AI routes

This suggests either:

- it is reserved for future expansion, or
- some AI functionality was folded into `http-server` first while this service stayed skeletal

### 7. `apps/web-test`

This looks like a lightweight frontend app scaffold in the monorepo. Based on the current scan, it does not appear central to the production flow right now.

## Shared Packages

### `packages/config`

This is the shared frontend configuration package added to centralize environment-based URLs.

Exports:

- `config`
- `buildApiUrl`
- `getApiBaseUrl`
- `apiBasePath`
- shared Axios instance `api`

Current env contract:

- `VITE_API_URL`
- `VITE_SOCKET_URL`
- `VITE_WEB_MAIN_URL`
- `VITE_WEB_ROOM_URL`

Important design behavior:

- no silent fallback to relative `/api`
- missing required env values throw immediately
- API URL building is normalized in one place

This package is important because it removed scattered frontend API configuration and reduced the risk of API requests accidentally going to the frontend origin.

### `packages/db`

Shared database connection package.

Current responsibility:

- provides `connectDB(uri)` using Mongoose

### `packages/types`

Shared TypeScript types package.

Used to keep common domain types available across apps/packages.

### `packages/ui`

Shared React UI component library.

Observed exported component areas include:

- AI mode panel
- cinema avatar
- loading spinner
- movie rich details
- persistent comments panel

This helps keep `web-main` and `web-room` visually and behaviorally aligned around shared pieces.

### `packages/tailwind-config`

Shared Tailwind configuration package for consistent styling.

### `packages/typescript-config`

Shared TypeScript config presets for the monorepo.

### `packages/eslint-config`

Shared linting configuration package.

## Data Layer

### Database

MongoDB is used through Mongoose.

Observed models under `apps/http-server/src/models`:

- `users.model.ts`
- `userPreference.model.ts`
- `movies.model.ts`
- `movieComment.model.ts`
- `room.model.ts`
- `feedback.model.ts`
- `invertedIndex.model.ts`

What this implies about the domain:

- users have auth/profile/avatar data
- user preferences are tracked for recommendation/personalization features
- movies are cached or stored locally in addition to external movie lookups
- comments are persisted per movie
- rooms are persisted with shareable or relational data
- feedback is stored
- some indexing/search optimization work exists through inverted index modeling

### Cache / Queue

Redis appears to be used for:

- queue-like async tasks
- worker communication

At least one known queue:

- `sendPassword`

## External Integrations

Based on the codebase scan, the project integrates with:

- TMDB for movie data
- Google Sign-In
- Cloudinary for media uploads
- Nodemailer / email delivery
- Redis
- Mediasoup for WebRTC signaling/media coordination

## Frontend Architecture Notes

### Authentication Flow

The main frontend is built around an auth-first flow:

- guests can visit landing/login/signup
- after auth, user session is checked
- avatar selection is enforced before entering the protected app
- protected routes are wrapped behind auth guards

This gives the app a clear onboarding pipeline:

1. create account or sign in
2. verify session
3. select avatar
4. enter the main product experience

### Movie Experience

The main app supports:

- movie discovery
- movie search
- recommendations
- per-movie detail pages
- movie comments
- AI interaction around the movie
- creation of shareable room links

### Room Experience

The room app is the immersive layer of the platform.

It combines:

- 3D room rendering
- room membership
- synchronized state
- WebSocket messaging
- WebRTC/Mediasoup transport setup
- chat and social interaction
- vote state
- trailer/media sync
- cross-navigation back to the main app

## API and Realtime Flow

### REST flow

Current frontend REST flow is:

1. frontend calls local `apiClient`
2. local `apiClient` uses `buildApiUrl()` from `@repo/config`
3. `buildApiUrl()` composes `VITE_API_URL + /api/v1 + path`
4. requests go to `http-server`

This is now consistent across the frontends that were migrated.

### Socket flow

Current socket flow is:

1. frontend reads `config.socketUrl`
2. room/main socket code opens a WebSocket to that URL
3. socket server joins peers into room-scoped state
4. Mediasoup signaling and room social events are exchanged over that connection

## Environment Configuration

### Frontend env keys

Current important frontend environment variables:

- `VITE_API_URL`
- `VITE_SOCKET_URL`
- `VITE_WEB_MAIN_URL`
- `VITE_WEB_ROOM_URL`

Current production API target for both frontend apps:

- `https://metaverse-cinemart.onrender.com`

### Backend env keys seen in code

Examples observed:

- `SERVER_VAR_PORT`
- `SERVER_VAR_DATABASE_URL`
- `SERVER_VAR_CORS_ORIGIN`
- `SERVER_VAR_REDIS_URL`
- `SERVER_VAR_HTTP_SERVER_URL`
- `SERVER_VAR_MEDIASOUP_MIN_PORT`
- `SERVER_VAR_MEDIASOUP_MAX_PORT`

## Recent Important Improvement

One of the major recent fixes in this codebase was centralizing frontend API configuration.

### Problem that existed

Some frontend code was making calls like:

```ts
fetch("/api/v1/...");
```

That caused requests to hit the frontend origin instead of the backend when deployment environments differed.

### What was changed

- introduced shared package `packages/config`
- standardized API URL creation with `buildApiUrl()`
- created shared exported config accessors
- created shared Axios instance
- removed old `VITE_HTTP_SERVER_URL` and `VITE_WS_URL` usage from migrated frontend paths
- replaced frontend fallback behavior that silently defaulted to `/api`

### Why it matters

- prevents environment drift
- makes `web-main` and `web-room` consistent
- reduces production-only bugs
- makes future frontend code easier to review

## Build and Tooling

Root scripts:

- `pnpm dev` -> `turbo run dev`
- `pnpm build` -> `turbo run build`
- `pnpm lint` -> `turbo run lint`
- `pnpm check-types` -> `turbo run check-types`

Frontend app scripts generally use:

- `vite`
- `tsc -b`
- `vite build`

Backend services generally use:

- `ts-node`
- `nodemon`
- `tsc`

## Strengths of the Current Project

- ambitious multi-app architecture
- real separation between main product shell and immersive room experience
- shared package strategy is in place
- clear route segmentation on the HTTP backend
- strong foundation for real-time synchronized features
- recommendation/personalization hooks are already present
- AI features are already represented in the product surface

## Current Risks / Technical Debt Areas

### 1. Documentation gap

The old root README is still the default Turborepo starter and does not describe the actual system.

### 2. Large orchestration files

`apps/web-room/src/pages/Space.tsx` appears to be a very large orchestration file. It likely deserves future splitting into:

- UI sections
- room state hooks
- mediasoup logic
- trailer sync logic
- search/create-room flows

### 3. In-memory room state in socket server

Good for single-instance deployment, but a scaling limitation for multi-instance realtime infrastructure.

### 4. Mixed service maturity

`http-server` is much more mature than `ai-server`. The AI service boundary may need clarification later.

### 5. Potential env sprawl

Even after centralization, this system has enough services that environment documentation should be formalized in a dedicated `.env.example` set for each app.

## Suggested Next Documentation Files

If you want this project to feel truly production-documented, the next useful files would be:

- `README.md` rewrite for setup + quick start
- `ARCHITECTURE.md` for deep technical design
- `API_REFERENCE.md` for REST endpoints
- `.env.example` files for each app
- `DEPLOYMENT.md` for Render/Vercel/service deployment notes

## Quick Mental Model

If someone asks what this repo is, the shortest accurate answer is:

> Metaverse Cinema is a full-stack monorepo for a social movie platform with a standard web app for discovery and account flows, plus a separate immersive 3D room app for synchronized realtime viewing powered by a REST backend, WebSocket signaling, and Mediasoup.

## Ownership Map

If you are making changes, this is the fastest way to think about where to work:

- auth/profile/movie/room/AI REST changes -> `apps/http-server`
- realtime room signaling/WebRTC changes -> `apps/socket-server`
- landing/auth/discovery/room management UI -> `apps/web-main`
- immersive room experience UI -> `apps/web-room`
- shared frontend env/api config -> `packages/config`
- shared UI -> `packages/ui`
- shared DB connection -> `packages/db`
- shared domain types -> `packages/types`

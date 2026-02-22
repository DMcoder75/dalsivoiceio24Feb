# Dalsi Voice - Project TODO

## Design & Setup
- [x] Design system and color palette (elegant, premium aesthetic)
- [x] Global styling with Tailwind and custom CSS variables
- [x] Typography and spacing system
- [x] Logo and branding assets

## Database & Backend
- [x] Create database schema for voice profiles, sessions, and generation history
- [x] Implement voice profile seed data (accents, genders, voice types)
- [x] Build tRPC procedures for voice generation and history tracking
- [x] Implement session management and 2-generation limit enforcement
- [ ] Create audio download endpoint

## Avatar Images
- [x] Research avatar image sources or generation approach
- [x] Generate/collect avatar images for each voice profile
- [x] Optimize and store avatars in S3
- [x] Create avatar mapping in database

## Frontend - Core Pages
- [x] Build landing/home page with hero section
- [x] Create main text-to-speech generator page
- [x] Implement voice selection interface (accent, gender, voice type)
- [x] Build avatar display component
- [x] Create audio player/preview component
- [x] Implement download functionality UI

## Text-to-Speech Integration
- [ ] Research and integrate TTS API (Google Cloud, AWS Polly, or similar)
- [ ] Implement text validation and sanitization
- [ ] Add audio generation with proper error handling
- [ ] Implement audio format conversion (MP3, WAV)
- [ ] Add audio caching strategy

## Session & Usage Tracking
- [ ] Implement session-based generation counter
- [ ] Add UI feedback for remaining generations
- [ ] Implement limit enforcement with user-friendly messaging
- [ ] Add generation history display

## Features & Polish
- [ ] Add responsive design for mobile/tablet/desktop
- [ ] Implement loading states and animations
- [ ] Add error handling and user feedback
- [ ] Create help/info sections
- [ ] Add keyboard shortcuts for power users
- [ ] Implement audio playback controls (play, pause, volume, speed)

## Testing & QA
- [ ] Write vitest tests for backend procedures
- [ ] Test voice generation with various inputs
- [ ] Test 2-generation limit enforcement
- [ ] Test responsive design across devices
- [ ] Test audio download functionality
- [ ] Test session persistence

## Deployment
- [ ] Configure domain dalsivoice.io
- [ ] Set up environment variables
- [ ] Create final checkpoint
- [ ] Deploy to production

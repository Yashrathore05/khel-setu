# Khel-Setu Web

Production-ready React + TypeScript + Vite app for capturing and evaluating sports fitness tests with automatic anti-cheat and video evidence.

## Recent UI & Form Updates

- Badges now use Lottie animations via `lottie-web`.
  - Component: `src/components/Badge.tsx` → `LottieBadge` loads JSON from `public` (e.g., `/athlete.json`, `/training.json`).
  - Home page badges show a large, centered animation with the badge name and category below. Grid is responsive with increased spacing.
- Athlete Fitness Test Registration form now accepts values as-is (no mandatory validation).
  - File: `src/components/FitnessRegistrationForm.tsx`
  - Removed Aadhaar/mobile/email digit/format checks; inputs no longer restrict characters or require lengths; values are saved exactly as entered.

### Tech Stack
- React 19, TypeScript, Vite 7, Tailwind CSS
- Firebase Auth + Firestore (profiles, test results)
- Supabase Storage (video/image uploads)
- TensorFlow.js models: COCO-SSD (person detection), MoveNet (pose)
- OpenCV.js (A4 calibration for real-world scaling)
- i18n via i18next (multi-language UI)

## Project Structure

```
src/
  components/        // UI primitives (Button, Card, Input, etc.)
  contexts/          // AuthContext (Firebase Auth providers)
  hooks/             // Data hooks
  i18n/              // i18n setup + language JSONs
  layouts/           // AppLayout (header/nav)
  lib/               // firebase.ts, firestore.ts, supabase.ts
  pages/             // Pages (login, fitness tests, etc.)
  services/          // Firestore and progress services
```

Key files:
- `src/pages/fitness-test-detail.tsx`: All per-test camera/pose logic, calibration, overlays, recording, integrity, and submission.
- `src/services/testProgressService.ts`: Writes/reads test results to/from Firestore and computes summaries/progress.
- `src/contexts/AuthContext.tsx`: Email/password and social login (Google, GitHub, Apple stub, phone).
- `src/pages/login.tsx`: Combined login/signup UI with Google button.
- `src/layouts/AppLayout.tsx`: Global layout (dark theme default, language switcher, auth controls).

## Data Model & Storage

### Authentication (Firebase Auth)
- Providers: Email/Password, Google (active), GitHub (optional), Apple (stub), Phone (optional).
- State handled in `AuthContext`. On first Google sign-in, we backfill a user profile in Firestore.

### User Profiles (Firestore)
- Collection: `users` (via `userProfileService` in `src/services/firestoreService.ts`).
- Example fields: `name`, `email`, `level`, `region`.
- Created/updated during sign-up or first provider sign-in.

### Fitness Test Results (Firestore)
- Collection: `fitnessTestResults`, Document ID: `${userId}_${testId}`
- Interface (simplified):
  - `testId`, `testName`
  - `result` (number | null), `unit` (e.g., cm, sec, count)
  - `status`: 'completed' | 'incomplete' | 'failed'
  - `testType`: 'input' | 'video'
  - `videoUrl?`, `imageUrl?`
  - `integrityResult?` (object)
  - `completedAt`: server timestamp

`integrityResult` per test includes contextual/anti-cheat data:
- Common: `personCount`, `pxPerCm`, `calibrated`
- Height (test1): calibration info and captured `imageUrl`
- Sit & Reach (test3): wrist/foot keypoint distance snapshot
- Vertical Jump (test4): `baselineY`, `peakY`
- Broad Jump (test5): `takeoff`, `landing`
- Medicine Ball (test6): `startX`, `maxDxPx`
- 30m (test7): `startMs`, `finishMs`
- 4x10 Shuttle (test8): `startMs`, `finishMs`, `crossings`
- Sit-ups (test9): `reps`
- 800m/1.6km (test10): `laps`, `startMs`

### Media (Supabase Storage)
- Bucket: `Fitness-Test`
- Path: `${user.uid}/{timestamped filename}`
- Public URL is stored in the Firestore document alongside `result` and `integrityResult`.

### Dashboard Progress Metrics

These values power the Progress Tracking card on the home page:

- Overall Score: Uses the stored value in the `progress` document when available. Otherwise falls back to `(completedTests / totalTests) × 100`.
- Benchmark: Uses the stored value in the `progress` document when available. Otherwise falls back to `(completedTests / totalTests) × 100`.
- Improvement: Percentage change vs a saved baseline in the `progress` document (e.g., `((currentScore − baselineScore) / baselineScore) × 100`).
- Pending/Completed: `completedTests` is the count of results with status `completed`. `totalTests` is 10 (the fixed test set). `pending = totalTests − completedTests`.
- Progress Bar Width: `min(value, 100)%`.

## Fitness Tests: Logic Overview

All camera-based tests run in `src/pages/fitness-test-detail.tsx`:
- Camera: `getUserMedia` with front or rear selection depending on test.
- Models: COCO-SSD (person detection), MoveNet (pose) loaded lazily per test.
- Calibration: OpenCV.js detects an A4 sheet to compute pixels-per-cm.
- Anti-cheat: If more than one person is detected at any time, the test auto-stops and shows a violation modal.
- Recording: `MediaRecorder` captures video; on stop, the file is uploaded and a Firestore record is written.

Per test specifics:
- Height (test1): Person bbox height → cm (with calibration). Capture frame as image plus integrity.
- Weight (test2): Manual input field only.
- Sit & Reach (test3): MoveNet wrists-to-toes distance, uses A4 calibration for cm.
- Vertical Jump (test4): Baseline hip/ankle Y during first ~1s, track min Y as peak; jump height = baseline - peak (px → cm).
- Broad Jump (test5): Baseline toes at takeoff, track max forward X displacement; distance = Δx (px → cm).
- Medicine Ball (test6): Frame differencing centroid of motion; max Δx from start (px → cm).
- 30 m (test7): Virtual start/finish lines; time crossing from start to finish.
- 4×10 m Shuttle (test8): Virtual left/right lines; count side crossings (8 total) to measure total time.
- Sit-ups (test9): Angle at hip (torso vs thigh); increment reps on crunch and extend crossing thresholds.
- 800m/1.6km (test10): Midline crossings as laps; track elapsed time.

## Pages & UX

- `login.tsx`: Combined login/signup with email/password and a Google button present in both modes.
- `signup.tsx`: Standalone signup page that also supports Google (kept for direct linking if needed).
- `fitness-test.tsx`: Test list UI (status, progress). Uses `TestProgressService` to get summaries.
- `fitness-test-detail.tsx`: Single test execution (camera, overlays, recording, submit, violation modal).
- `index.tsx`, `events.tsx`, `profile.tsx`, `chatbot.tsx`: Supporting pages.

## Environment & Config

Add Firebase and Supabase config:
- `src/lib/firebase.ts`: Initialize Firebase app (apiKey, authDomain, projectId, etc.)
- `src/lib/firestore.ts`: `db` export for Firestore
- `src/lib/supabase.ts`: Supabase client initialization (url + anon key)

Gemini (AI Coach) config:
- Create `.env` in project root and add:
  - `VITE_GEMINI_API_KEY=YOUR_KEY_HERE`
- The Chatbot page (`/chatbot`) uses `src/services/geminiService.ts` and the model `gemini-1.5-flash`.
- The assistant is primed with a sports coaching prompt tailored for youth athletes in India.

Dark theme:
- Default enabled via `<html class="dark">` in `index.html`.

## Developer Notes

- Run dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`

Model performance tips:
- Prefer good lighting and a single athlete in frame.
- For distance-based tests, ensure the A4 sheet is fully visible for calibration.

Known limitations:
- Motion/pose estimation can be sensitive; a simple reference (A4) is used for scale.
- Virtual line positions are heuristic; adjust constants for your camera setup if needed.

## Data Flow Examples

1) Sit & Reach flow:
- User starts camera → calibrates with A4 → performs reach → presses Start Recording, then Stop & Submit.
- App uploads video to Supabase and writes Firestore doc `${userId}_${testId}` with `result` (cm) and `integrityResult`.

2) 30 m timing flow:
- App draws start/finish lines → detects first crossing of start → starts timer → stops when crossing finish.
- On submit, saves `result` (seconds) and start/finish timestamps.

## Support & Troubleshooting

- Multiple persons detected → test auto-stops with violation modal; user must retry alone.
- If camera doesn’t start: check browser permissions and HTTPS context.
- If calibration fails: ensure A4 sheet fully visible and well-lit.

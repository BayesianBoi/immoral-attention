# Tasks

## Done

- [x] Project structure: create `src/lab/`, `src/web/`, `src/web/lib/`
- [x] Move original PsychoPy files to `src/lab/`
- [x] Scaffold web experiment: `index.html`, `experiment.js`, `style.css`
- [x] Update `requirements.md` for this project
- [x] Download and add `webgazer.min.js` to `src/web/lib/`
- [x] Implement 9-point calibration with click-to-calibrate (5 clicks per dot)
- [x] Implement calibration validation (5-point, compute mean error)
- [x] Wire up fullscreen enforcement and exit handling
- [x] Implement face detection check before calibration starts
- [x] Implement pre-experiment device/browser/webcam checks (blocking)
- [x] Separate gaze CSV output (timestamp, x, y, trial, phase, vw, vh)
- [x] Behavioral CSV matching lab format (session_id, subject_id, condition, aoi_*, assessment)
- [x] AOI hit summaries per trial in behavioral CSV
- [x] Download MediaPipe face mesh model files for WebGazer
- [x] Sequential calibration with randomized dot order (5 clicks/dot)
- [x] Listener-based validation (replaced broken async setInterval)
- [x] Instruction text matching lab version
- [x] Condition assignment via participant ID modulo
- [x] Fix: WebGazer video blocking calibration dot clicks (pointer-events: none)
- [x] Fix: calibration click delay reduced to 300ms
- [x] Fix: switch ridge to weightedRidge regression for better accuracy
- [x] Fix: explicitly enable Kalman filter for gaze smoothing
- [x] Fix: face detection now polls WebGazer predictions instead of using timer
- [x] Fix: AOI computation reads actual DOM positions via getBoundingClientRect
- [x] Fix: card box spacing increased from 5vh to 10vh gap
- [x] Fix: validation points moved off calibration grid (tests interpolation)
- [x] Fix: validation "Good" threshold lowered from 300px to 150px
- [x] Add validation_error_px and screen dimensions to behavioral CSV
- [x] Show failure message when pre-experiment checks fail
- [x] Paradigm audit: attribute positions shuffled once per session (not per trial)
- [x] Paradigm audit: cursor hidden during trial screens (matches lab mouseVisible=False)
- [x] Paradigm audit: welcome text matches lab exactly
- [x] UX: calibration click counter per dot (e.g. "3/5 clicks")
- [x] UX: styled buttons, smooth screen transitions, better end screen
- [x] UX: calibration info positioned at top to avoid dot overlap
- [x] UX: split calibration into instruction + clean dot screen
- [x] UX: split validation into intro + dots + result screens
- [x] Dynamic validation result screen (blue/grey buttons based on quality tier)
- [x] Critical audit of experiment flow
- [x] Added informed consent screen (placeholder text)
- [x] Added task instructions screen (replaces empty welcome screen)
- [x] Added debrief placeholder on end screen
- [x] Hidden webcam video during calibration dots (less distracting)
- [x] Button cooldown (1.5s) on all navigation buttons to prevent spam-clicking
- [x] Flow: checks -> consent -> entry form -> face check -> calibration -> validation -> instructions -> trials

## To do

### Next up
- [ ] Remove redundant `vw`/`vh` from per-sample gaze data (store once per trial in behavioral CSV instead)
- [ ] Add environment setup instruction screen between entry form and camera check (lighting, distance, posture, glasses, close other tabs)
- [ ] Fill in consent text from ethics approval (placeholder in index.html)
- [ ] Fill in debrief text (placeholder in index.html)
- [ ] Decide: keep "Other" gender option or match lab (Male/Female only)?
- [ ] Decide: is `id % 2` condition assignment OK, or switch to balanced assignment (e.g. Prolific URL param)?
- [ ] Replace `downloadCSV()` with Pavlovia server-side save API
- [ ] Add per-trial data saving (guard against browser close)

### Data
- [ ] Per-trial save to Pavlovia (guard against browser close)

### Integration
- [ ] Pavlovia deployment setup (repo structure, config)
- [ ] Test on Chrome, Firefox, Edge
- [ ] End-to-end test: full experiment flow with gaze recording

### Polish
- [ ] Recalibration option between trials (for future MAXTRIALS > 2)
- [ ] URL parameter for test mode (`?mode=test`)
- [ ] CSS styling for `#screen-validation-result` (may be missing or incomplete)

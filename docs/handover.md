# Handover

## What this project is

A hiring bias experiment measuring how information order (professional qualifications vs demographics) affects hiring decisions. Eye-tracking captures where participants look during decision-making.

Two versions exist:
- **Lab version** (`src/lab/`): PsychoPy + EyeLink hardware. Used in completed studies.
- **Web version** (`src/web/`): Browser-based for at-home participants. Uses WebGazer.js for webcam eye-tracking. Hosted on Pavlovia.

## Experiment design

Each participant is assigned condition 1 or 2 (via participant ID modulo 2).

Trial flow:
1. Fixation cross (0.5-1s random)
2. First card: 3 attributes in randomized order, displayed in vertically stacked boxes
   - Condition 1 sees: Education, Experience, Skills
   - Condition 2 sees: Race, Age, Gender
3. Prompt: "see more details?" (Space = yes, Right Arrow = no)
4. If yes: second card with the other 3 attributes
5. Rating: 1-10 hiring qualification scale

Stimuli are generated randomly each trial:
- Education: Finance, Accounting, Marketing, Trade
- Experience: 12-36 months
- Skills: Analytical, Interpersonal
- Race: White, Asian, Black, Native Hawaiian
- Age: 30-45 years
- Gender: Male, Female

## Architecture decisions

**Code-only PsychoJS** (no Builder). The experiment has conditional branching and WebGazer integration that Builder can't handle without Code components everywhere. Writing JS directly is cleaner.

**Viewport-relative units** for all positions and sizes. Home participants have varied screen resolutions. The lab version hardcodes 1680x1050 pixels; the web version uses proportional units.

**State machine for trial flow.** PsychoPy uses blocking `event.waitKeys()`. JavaScript is async, so each trial phase (fixation, first_card, prompt, second_card, rating) is a state with key-event transitions.

**Separate gaze data file.** Raw gaze goes to its own CSV (like EDF was separate from behavioral CSV in the lab). Per-trial AOI summaries go in the behavioral CSV for quick analysis.

**Modulo condition assignment.** Even participant IDs get condition 1, odd get condition 2. Simple, no concurrency issues on Pavlovia. Can also use URL parameters if recruiting through Prolific.

## Calibration accuracy

Uses `weightedRidge` regression (weights recent data more) + Kalman filter smoothing. Calibration enforces 300ms minimum between clicks to prevent rushing. WebGazer video elements have `pointer-events: none` during calibration so dots are always clickable.

Validation reports: Good (<150px), Acceptable (150-250px), Poor (>250px). The `validation_error_px` column in behavioral CSV allows post-hoc quality filtering.

Card boxes use 10vh vertical gap (increased from original 5vh) to reduce AOI overlap at WebGazer accuracy levels. AOI hit computation uses actual DOM bounding rects (not hardcoded positions).

## Known limitations of web version

- WebGazer accuracy: ~100-200px uncertainty vs <1 degree for EyeLink
- Sampling rate: ~15-25 Hz vs 500-1000 Hz for EyeLink
- Expect ~40% data exclusion rate (vs ~10% in lab) due to poor webcam, lighting, head movement
- No control over participant environment (lighting, distance, distractions)
- Calibration drift over time; current 2-trial design is short enough to be fine

## Web version dependency: MediaPipe face mesh

WebGazer.js loads MediaPipe face mesh models at runtime from a relative path (`/mediapipe/face_mesh/`). These files must be present locally:
- `face_mesh.binarypb`
- `face_mesh_solution_packed_assets_loader.js`
- `face_mesh_solution_packed_assets.data`
- `face_mesh_solution_simd_wasm_bin.js`
- `face_mesh_solution_simd_wasm_bin.wasm`

Downloaded from `@mediapipe/face_mesh@0.4.1633559619` via jsDelivr. Without these, `webgazer.begin()` hangs silently.

## Paradigm parity notes

The web version matches the lab trial structure exactly:
- Attribute positions (`['Education','Experience','Skills']`, `['Race','Age','Gender']`) are shuffled once per session, fixed across trials (matches lab `GetPosition()` called once before the loop)
- First card dismiss accepts Space or Right Arrow (matches lab)
- See-more prompt text matches lab verbatim per condition
- Second card dismiss accepts Space or Right Arrow (matches lab)
- Rating scale: keys 1-9, 0=10, Space to submit, starts at 1 (matches lab)
- Fixation cross: 0.5-1s random wait (matches lab)
- Cursor hidden during trial screens (matches lab `mouseVisible = False`)

Experiment flow: checks -> consent -> participant entry -> face detection -> calibration intro -> calibration dots -> validation intro -> validation dots -> validation result -> task instructions -> trials -> end/debrief

Minor intentional differences:
- Stimulus sampling uses uniform `Math.floor(Math.random() * N)` instead of lab's `int(round(random.uniform(0,N-1)))` which slightly under-samples endpoints. The web version is more correct.
- Condition assignment uses `id % 2` instead of consuming from a pre-generated list.
- Web adds `validation_error_px`, `screen_width`, `screen_height` columns (extra, not replacing anything).

## Current state (as of 2026-03-25)

The experiment runs end-to-end locally. Calibration, validation, trials, rating, and CSV export all work. The validation flow was recently split into three screens (intro, dots, results) and works correctly.

### What was done in the critical audit (2026-03-25)

- Added informed consent screen with placeholder text (needs real ethics-approved text)
- Added task instructions screen explaining the hiring evaluation task (replaces the empty welcome screen that promised instructions but had none)
- Added debrief placeholder on end screen
- Hidden webcam video during calibration dot phase (was distracting)
- Added 1.5s button cooldown on all navigation buttons to prevent spam-clicking through screens
- Validation result screen now adapts button styling to quality tier (done in prior session)
- Removed dead `screen-welcome` (replaced by `screen-instructions`)

### What still needs doing

- Fill in consent text from ethics approval (placeholder: `[INSERT CONSENT TEXT FROM ETHICS APPROVAL HERE]`)
- Fill in debrief text (placeholder: `[INSERT DEBRIEF TEXT HERE]`)
- Decide: keep "Other" gender option or match lab (Male/Female only)?
- Decide: is `id % 2` condition assignment OK for your recruitment method, or use balanced assignment?
- Add environment setup instructions screen (lighting, distance, posture, glasses, close tabs)
- Replace `downloadCSV()` with Pavlovia server-side save
- Add per-trial data saving (guard against browser close)
- Remove redundant `vw`/`vh` from per-sample gaze data

### Key files to read

- `src/web/experiment.js` (741 lines) -- all experiment logic
- `src/web/index.html` -- screen definitions and structure
- `src/web/style.css` -- styling
- `src/lab/ImmoralAttention.py` -- the reference lab experiment (do not modify)

### Calibration click delay

Currently 300ms (`CLICK_DELAY` constant). Was 600ms, user found it annoying. The handover text below says 600ms but the code says 300ms. The code is correct.

## Known bugs in lab version (not carried to web)

- Lines 254-293: duplicate elif blocks (same conditions repeated 3x, harmless but confusing)
- Line 388: `aoi_7_attr` should be `aoi_6_attr`
- Windows-specific: `ctypes.windll` calls for error dialogs won't exist in web version

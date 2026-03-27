# Immoral Attention (Online)

Online eye-tracking experiment built with WebGazer.js. Participants evaluate fictional job candidates and choose whether to view additional information. Gaze data is recorded throughout to measure attention allocation across attribute types (performance vs. demographic).

This is an online port of a lab-based PsychoPy + EyeLink paradigm. The trial structure and stimuli generation are identical to the lab version, but calibration and gaze tracking are handled through the browser webcam instead of dedicated hardware.

## How it works

1. Setup checks (desktop, screen size, webcam)
2. Consent form
3. Participant info (ID, age, gender)
4. WebGazer calibration (9-point click) and validation (5-point passive)
5. Trial loop:
   - Fixation cross (0.5-1s)
   - Card with 3 candidate attributes
   - Option to view a second card with 3 more attributes
   - Rating (1-10 scale)
6. Data download (behavioral CSV + gaze CSV)

Condition assignment is between-subjects: condition 1 sees performance info first (education, experience, skills), condition 2 sees demographic info first (race, age, gender). Assigned by participant ID (even = condition 1, odd = condition 2).

## Running locally

Open `src/web/index.html` in Chrome. WebGazer needs webcam access and works best in Chrome. No build step or server required for local testing.

For local gaze tracking to work, the page needs to be served (not opened as a file). A quick way to do that:

```
cd src/web
python3 -m http.server 8000
```

Then open `http://localhost:8000` in Chrome.

## Visualisation tool

`src/web/visualise/` is a standalone tool for inspecting trial data after collection. Open it in any browser, drop in the behavioral and gaze CSV files, and it overlays gaze samples on the stimulus cards with per-AOI dwell percentages, first fixation markers, and a temporal gaze timeline for each trial. No server needed.

## Output

Two CSV files are downloaded at the end of the experiment:

**Behavioral CSV** (one row per trial): condition, stimuli shown, which AOI held which attribute, AOI bounding rectangles in pixels, gaze count and percentage per AOI, rating, and calibration validation error.

**Gaze CSV** (one row per sample): trial number, phase, x/y coordinates, timestamp, which AOI the gaze fell in (if any), and viewport dimensions.

## Dependencies

- [WebGazer.js](https://webgazer.cs.brown.edu/) (bundled in `src/web/lib/`)
- MediaPipe Face Mesh (bundled in `src/web/mediapipe/`)

No external dependencies need to be installed.

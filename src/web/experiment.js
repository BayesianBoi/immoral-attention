// Immoral Attention - Online version

const MAXTRIALS = 2;

const EDUCATION = ['Finance', 'Accounting', 'Marketing', 'Trade'];
const SKILLS = ['Analytical', 'Interpersonal'];
const RACE = ['White', 'Asian', 'Black', 'Native Hawaiian'];
const GENDER = ['Male', 'Female'];
const EXP_RANGE = [12, 36];
const AGE_RANGE = [30, 45];

// 9-point calibration positions (proportional to viewport)
const CALIBRATION_POINTS = [
  [0.1, 0.1], [0.5, 0.1], [0.9, 0.1],
  [0.1, 0.5], [0.5, 0.5], [0.9, 0.5],
  [0.1, 0.9], [0.5, 0.9], [0.9, 0.9],
];

const CLICKS_PER_DOT = 5;
const CLICK_DELAY = 300; // min ms between calibration clicks
const BUTTON_COOLDOWN = 1500; // delay before nav buttons are clickable

// 5-point validation positions (off the calibration grid)
const VALIDATION_POINTS = [
  [0.3, 0.3], [0.7, 0.3], [0.5, 0.5], [0.3, 0.7], [0.7, 0.7],
];

const VALIDATION_DURATION = 2000; // ms per dot

let participantInfo = { id: null, age: null, gender: null };
let assignedProfile = null;
let sessionID = null;
let trialData = [];
let gazeData = [];
let validationSamples = [];
let currentTrial = 0;
let gazeActive = false;
let validationActive = false;
let currentPhase = '';
let webgazerStarted = false;
let validationError = NaN;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateSessionID() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return dd + mm + hh + min;
}

function formatAttribute(item, isFirstCard, profile) {
  if (EDUCATION.includes(item)) return item + ' degree';
  if (SKILLS.includes(item)) return item;
  if (RACE.includes(item)) return 'Race: ' + item;
  if (GENDER.includes(item)) return 'Gender: ' + item;
  if (typeof item === 'number') {
    // experience vs age depends on which card set this is
    const isProf = (profile === 1 && isFirstCard) || (profile === 2 && !isFirstCard);
    if (isProf) return item + ' months exp.';
    return item + ' years old';
  }
  return String(item);
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const hideCursor = ['screen-fixation', 'screen-card', 'screen-see-more', 'screen-rating'];
  document.body.style.cursor = hideCursor.includes(id) ? 'none' : 'default';
}

function delayButton(btn) {
  btn.disabled = true;
  setTimeout(() => { btn.disabled = false; }, BUTTON_COOLDOWN);
}

function startGazeRecording(phase) {
  currentPhase = phase;
  gazeActive = true;
}

function stopGazeRecording() {
  gazeActive = false;
}

function onGazeData(data, timestamp) {
  if (data === null) return;
  if (validationActive) {
    validationSamples.push({ x: data.x, y: data.y });
  }
  if (!gazeActive) return;
  const gx = Math.round(data.x);
  const gy = Math.round(data.y);
  gazeData.push({
    trial: currentTrial,
    phase: currentPhase,
    x: gx,
    y: gy,
    t: Math.round(timestamp),
    aoi_hit: classifyGaze(gx, gy, currentTrial, currentPhase),
    vw: window.innerWidth,
    vh: window.innerHeight,
  });
}

async function runChecks() {
  const list = document.getElementById('check-list');
  let allPass = true;

  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  addCheck(list, 'Desktop device', !isMobile);
  if (isMobile) allPass = false;

  const bigEnough = window.innerWidth >= 1024 && window.innerHeight >= 600;
  addCheck(list, 'Screen size (min 1024x600)', bigEnough);
  if (!bigEnough) allPass = false;

  let hasCamera = false;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    hasCamera = devices.some(d => d.kind === 'videoinput');
  } catch (e) {}
  addCheck(list, 'Webcam detected', hasCamera);
  if (!hasCamera) allPass = false;

  const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);
  addCheck(list, 'Chrome browser (recommended)', isChrome, true);

  const btn = document.getElementById('btn-start-setup');
  if (allPass) {
    delayButton(btn);
    btn.addEventListener('click', () => showScreen('screen-consent'));
  } else {
    document.getElementById('checks-fail-msg').style.display = 'block';
  }
}

function addCheck(list, label, pass, warnOnly) {
  const li = document.createElement('li');
  li.textContent = label;
  li.className = pass ? 'pass' : (warnOnly ? 'pass' : 'fail');
  list.appendChild(li);
}

function setupConsent() {
  const btnAgree = document.getElementById('btn-consent-agree');
  const btnDecline = document.getElementById('btn-consent-decline');

  // buttons start disabled, enabled when screen is actually shown
  btnAgree.disabled = true;
  btnDecline.disabled = true;

  const observer = new MutationObserver(() => {
    if (document.getElementById('screen-consent').classList.contains('active')) {
      delayButton(btnAgree);
      delayButton(btnDecline);
      observer.disconnect();
    }
  });
  observer.observe(document.getElementById('screen-consent'), { attributes: true });

  btnAgree.addEventListener('click', () => showScreen('screen-entry'));
  btnDecline.addEventListener('click', () => {
    document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;color:#fff;font-size:1.2rem;text-align:center;padding:2rem;">You have declined to participate. You may close this window.</div>';
  });
}

function setupEntryForm() {
  document.getElementById('entry-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = parseInt(document.getElementById('input-id').value, 10);
    const age = parseInt(document.getElementById('input-age').value, 10);
    const gender = document.getElementById('input-gender').value;

    if (isNaN(id) || isNaN(age)) {
      alert('ID and Age must be numbers.');
      return;
    }

    participantInfo = { id, age, gender };
    sessionID = generateSessionID();

    // condition assignment: even ID = profile 1, odd = profile 2
    assignedProfile = (id % 2 === 0) ? 1 : 2;

    startFaceCheck();
  });
}

async function startFaceCheck() {
  showScreen('screen-face-check');

  try {
    await document.documentElement.requestFullscreen();
  } catch (e) {}

  if (!webgazerStarted) {
    try {
      await webgazer
        .setRegression('weightedRidge')
        .setGazeListener(onGazeData)
        .begin();
      webgazer.applyKalmanFilter(true);
      webgazerStarted = true;
    } catch (e) {
      document.getElementById('face-status').textContent =
        'Camera access was denied. Please allow camera access in your browser and refresh.';
      return;
    }
  }

  webgazer.showVideo(true);
  webgazer.showFaceOverlay(false);
  webgazer.showFaceFeedbackBox(false);
  webgazer.showPredictionPoints(false);

  const statusEl = document.getElementById('face-status');
  const btn = document.getElementById('btn-face-ok');
  btn.disabled = true;

  let faceFound = false;
  const checkFace = setInterval(async () => {
    const prediction = await webgazer.getCurrentPrediction();
    if (prediction !== null && !faceFound) {
      faceFound = true;
      clearInterval(checkFace);
      statusEl.textContent = 'Face detected. Make sure you can see yourself in the video, then continue.';
      btn.disabled = false;
    }
  }, 500);

  setTimeout(() => {
    if (!faceFound) {
      clearInterval(checkFace);
      statusEl.textContent = 'Could not detect face. Check your webcam and lighting, then refresh.';
    }
  }, 15000);

  btn.onclick = () => {
    btn.onclick = null;
    showCalibrationIntro();
  };
}

function showCalibrationIntro() {
  showScreen('screen-calibration-intro');

  webgazer.showVideo(true);
  webgazer.showFaceOverlay(true);
  webgazer.showFaceFeedbackBox(true);
  webgazer.showPredictionPoints(false);

  const btn = document.getElementById('btn-start-calibration');
  delayButton(btn);
  btn.onclick = () => {
    btn.onclick = null;
    startCalibration();
  };
}

async function startCalibration() {
  showScreen('screen-calibration');

  // hide video during calibration
  webgazer.showVideo(false);
  webgazer.showFaceOverlay(false);
  webgazer.showFaceFeedbackBox(false);
  setWebGazerPointerEvents(false);

  const container = document.getElementById('calibration-container');
  container.innerHTML = '';

  const points = shuffle(CALIBRATION_POINTS);

  for (let i = 0; i < points.length; i++) {
    const [xPct, yPct] = points[i];

    const dot = document.createElement('div');
    dot.className = 'calibration-dot';
    dot.style.left = (xPct * 100) + '%';
    dot.style.top = (yPct * 100) + '%';
    container.appendChild(dot);

    const label = document.createElement('span');
    label.className = 'dot-label';
    label.textContent = '0/' + CLICKS_PER_DOT;
    dot.appendChild(label);

    await new Promise(resolve => {
      let clicks = 0;
      let lastClick = 0;
      dot.addEventListener('click', function handler() {
        const now = Date.now();
        if (now - lastClick < CLICK_DELAY) return;
        lastClick = now;
        clicks++;
        label.textContent = clicks + '/' + CLICKS_PER_DOT;
        const scale = 1 - (clicks / CLICKS_PER_DOT) * 0.4;
        dot.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
        if (clicks >= CLICKS_PER_DOT) {
          dot.removeEventListener('click', handler);
          dot.classList.add('clicked');
          resolve();
        }
      });
    });

    dot.remove();
  }

  setWebGazerPointerEvents(true);
  showValidationIntro();
}

function setWebGazerPointerEvents(enabled) {
  const ids = ['webgazerVideoFeed', 'webgazerFaceFeedbackBox', 'webgazerFaceOverlay'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.pointerEvents = enabled ? 'auto' : 'none';
  });
}

function showValidationIntro() {
  showScreen('screen-validation-intro');

  webgazer.showVideo(false);
  webgazer.showFaceOverlay(false);
  webgazer.showFaceFeedbackBox(false);

  const btn = document.getElementById('btn-start-validation');
  delayButton(btn);
  btn.onclick = () => {
    btn.onclick = null;
    runValidation();
  };
}

async function runValidation() {
  showScreen('screen-validation');

  document.querySelectorAll('.validation-dot').forEach(d => d.remove());

  let totalError = 0;
  let sampleCount = 0;

  for (let i = 0; i < VALIDATION_POINTS.length; i++) {
    const [xPct, yPct] = VALIDATION_POINTS[i];

    const dot = document.createElement('div');
    dot.className = 'validation-dot';
    dot.style.left = (xPct * 100) + '%';
    dot.style.top = (yPct * 100) + '%';
    document.getElementById('screen-validation').appendChild(dot);

    const targetX = xPct * window.innerWidth;
    const targetY = yPct * window.innerHeight;

    await new Promise(r => setTimeout(r, 500)); // let gaze settle
    validationSamples = [];
    validationActive = true;
    await new Promise(r => setTimeout(r, VALIDATION_DURATION));
    validationActive = false;

    for (const s of validationSamples) {
      const dx = s.x - targetX;
      const dy = s.y - targetY;
      totalError += Math.sqrt(dx * dx + dy * dy);
      sampleCount++;
    }

    dot.remove();
  }

  const meanError = sampleCount > 0 ? Math.round(totalError / sampleCount) : NaN;
  validationError = meanError;

  const terrible = isNaN(meanError) || meanError >= 350;
  const poor = !terrible && meanError >= 250;
  const acceptable = !terrible && !poor; // includes Good (<150) and Acceptable (150-250)

  const quality = isNaN(meanError) ? 'No gaze data collected (' + sampleCount + ' samples)' :
    meanError < 150 ? 'Good (' + meanError + 'px avg error, ' + sampleCount + ' samples)' :
    meanError < 250 ? 'Acceptable (' + meanError + 'px avg error, ' + sampleCount + ' samples)' :
    meanError < 350 ? 'Poor (' + meanError + 'px avg error, ' + sampleCount + ' samples)' :
    'Very poor (' + meanError + 'px avg error, ' + sampleCount + ' samples)';

  showScreen('screen-validation-result');
  document.getElementById('validation-result').textContent = quality;

  const btnContinue = document.getElementById('btn-accept-calibration');
  const btnRecal = document.getElementById('btn-recalibrate');

  btnContinue.style.background = '';
  btnRecal.style.background = '';

  if (terrible) {
    btnContinue.textContent = 'You need to recalibrate';
    btnContinue.disabled = true;
    btnContinue.onclick = null;
    btnRecal.style.background = '#4a90d9';
    btnContinue.style.background = '#888';
  } else if (poor) {
    btnContinue.textContent = 'Continue to experiment';
    btnContinue.disabled = false;
    btnContinue.style.background = '#666';
    btnRecal.style.background = '#4a90d9';
  } else {
    btnContinue.textContent = 'Continue to experiment';
    btnContinue.disabled = false;
    btnContinue.style.background = '#4a90d9';
    btnRecal.style.background = '#666';
  }

  if (!terrible) delayButton(btnContinue);
  delayButton(btnRecal);

  btnContinue.onclick = terrible ? null : () => {
    btnContinue.onclick = null;
    showInstructions();
  };
  btnRecal.onclick = () => {
    btnRecal.onclick = null;
    webgazer.clearData();
    showCalibrationIntro();
  };
}

function showInstructions() {
  showScreen('screen-instructions');
  webgazer.showPredictionPoints(false);

  const btn = document.getElementById('btn-start-trials');
  delayButton(btn);
  btn.onclick = () => {
    btn.onclick = null;
    runTrials();
  };
}

async function runTrials() {
  for (let t = 0; t < MAXTRIALS; t++) {
    currentTrial = t + 1;
    await runSingleTrial();
  }
  endExperiment();
}

async function runSingleTrial() {
  const edu = randChoice(EDUCATION);
  const exp = randInt(EXP_RANGE[0], EXP_RANGE[1]);
  const skl = randChoice(SKILLS);
  const rc = randChoice(RACE);
  const ag = randInt(AGE_RANGE[0], AGE_RANGE[1]);
  const gend = randChoice(GENDER);

  // shuffle box positions each trial, matching lab GetPosition()
  const firstOrder = shuffle(['Education', 'Experience', 'Skills']);
  const secondOrder = shuffle(['Race', 'Age', 'Gender']);
  const attrMap = { Education: edu, Experience: exp, Skills: skl, Race: rc, Age: ag, Gender: gend };

  const firstAttrs = (assignedProfile === 1) ? firstOrder : secondOrder;
  const secondAttrs = (assignedProfile === 1) ? secondOrder : firstOrder;

  const firstValues = firstAttrs.map(k => attrMap[k]);
  const secondValues = secondAttrs.map(k => attrMap[k]);

  await showFixation();

  startGazeRecording('first_card');
  showCard(firstValues, true);
  await waitForKey('Space', 'ArrowRight');

  currentPhase = 'see_more';
  const seeMoreText = (assignedProfile === 1)
    ? "Would you like to see candidate's personal information?\nPress SPACE for 'Yes' and RIGHT ARROW for 'No'"
    : "Would you like to see candidate's performance information?\nPress SPACE for 'Yes' and RIGHT ARROW for 'No'";

  showScreen('screen-see-more');
  document.getElementById('see-more-text').innerHTML = seeMoreText.replace('\n', '<br>');
  const choice = await waitForKey('Space', 'ArrowRight');

  let sawSecondCard = false;

  if (choice === 'Space') {
    currentPhase = 'fixation_2';
    await showFixation();

    currentPhase = 'second_card';
    showCard(secondValues, false);
    await waitForKey('Space', 'ArrowRight');
    sawSecondCard = true;
  }

  currentPhase = 'rating';
  const rating = await showRating();
  stopGazeRecording();

  trialData.push({
    session_id: sessionID,
    subject_id: participantInfo.id,
    subject_age: participantInfo.age,
    subject_gender: participantInfo.gender,
    trial: currentTrial,
    condition: assignedProfile,
    saw_second_card: sawSecondCard ? 1 : 0,
    aoi_1_type: firstAttrs[0],
    aoi_1_attr: firstValues[0],
    aoi_2_type: firstAttrs[1],
    aoi_2_attr: firstValues[1],
    aoi_3_type: firstAttrs[2],
    aoi_3_attr: firstValues[2],
    aoi_4_type: sawSecondCard ? secondAttrs[0] : null,
    aoi_4_attr: sawSecondCard ? secondValues[0] : null,
    aoi_5_type: sawSecondCard ? secondAttrs[1] : null,
    aoi_5_attr: sawSecondCard ? secondValues[1] : null,
    aoi_6_type: sawSecondCard ? secondAttrs[2] : null,
    aoi_6_attr: sawSecondCard ? secondValues[2] : null,
    assessment: rating,
    validation_error_px: validationError,
    screen_width: window.innerWidth,
    screen_height: window.innerHeight,
    ...getAOIRectFields(currentTrial),
  });
}

function showFixation() {
  return new Promise((resolve) => {
    showScreen('screen-fixation');
    const wait = 500 + Math.random() * 500; // 0.5-1s
    setTimeout(resolve, wait);
  });
}

function showCard(values, isFirstCard) {
  showScreen('screen-card');
  document.getElementById('box-top').textContent = formatAttribute(values[0], isFirstCard, assignedProfile);
  document.getElementById('box-mid').textContent = formatAttribute(values[1], isFirstCard, assignedProfile);
  document.getElementById('box-bot').textContent = formatAttribute(values[2], isFirstCard, assignedProfile);
  captureAOIRects(isFirstCard ? 'first_card' : 'second_card');
}

function showRating() {
  return new Promise((resolve) => {
    showScreen('screen-rating');
    let selected = 1;
    const display = document.getElementById('rating-value');
    display.textContent = selected;

    const handler = (e) => {
      const num = parseInt(e.key, 10);
      if (!isNaN(num)) {
        selected = (num === 0) ? 10 : num;
        display.textContent = selected;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        document.removeEventListener('keydown', handler);
        resolve(selected);
      }
    };
    document.addEventListener('keydown', handler);
  });
}

function waitForKey(...codes) {
  return new Promise((resolve) => {
    const handler = (e) => {
      if (codes.includes(e.code)) {
        e.preventDefault();
        document.removeEventListener('keydown', handler);
        resolve(e.code);
      }
    };
    document.addEventListener('keydown', handler);
  });
}

function toCSV(rows) {
  if (rows.length === 0) return '';
  const keys = Object.keys(rows[0]);
  const lines = [keys.join(',')];
  rows.forEach(row => {
    lines.push(keys.map(k => {
      const v = row[k];
      if (v === null || v === undefined) return '';
      const s = String(v);
      return s.includes(',') ? '"' + s + '"' : s;
    }).join(','));
  });
  return lines.join('\n');
}

function downloadCSV(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

// per-trial bounding rects for each card box
let aoiRects = {};

function captureAOIRects(phase) {
  if (!aoiRects[currentTrial]) aoiRects[currentTrial] = {};
  aoiRects[currentTrial][phase] = ['box-top', 'box-mid', 'box-bot'].map(id => {
    const rect = document.getElementById(id).getBoundingClientRect();
    return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
  });
}

function getAOIRectFields(trialNum) {
  const fields = {};
  const trialRects = aoiRects[trialNum] || {};
  ['first_card', 'second_card'].forEach(phase => {
    const rects = trialRects[phase];
    const offset = phase === 'first_card' ? 1 : 4;
    for (let i = 0; i < 3; i++) {
      const n = offset + i;
      if (rects && rects[i]) {
        fields['aoi_' + n + '_left'] = Math.round(rects[i].left);
        fields['aoi_' + n + '_top'] = Math.round(rects[i].top);
        fields['aoi_' + n + '_right'] = Math.round(rects[i].right);
        fields['aoi_' + n + '_bottom'] = Math.round(rects[i].bottom);
      } else {
        fields['aoi_' + n + '_left'] = '';
        fields['aoi_' + n + '_top'] = '';
        fields['aoi_' + n + '_right'] = '';
        fields['aoi_' + n + '_bottom'] = '';
      }
    }
  });
  return fields;
}

function classifyGaze(x, y, trialNum, phase) {
  const trialRects = aoiRects[trialNum];
  if (!trialRects) return '';
  const rects = trialRects[phase];
  if (!rects) return '';
  const offset = phase === 'first_card' ? 1 : 4;
  for (let i = 0; i < rects.length; i++) {
    if (gazeInRect(x, y, rects[i])) return offset + i;
  }
  return '';
}

function gazeInRect(x, y, rect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function computeAOISummaries() {
  trialData.forEach((trial, i) => {
    const trialNum = i + 1;
    ['first_card', 'second_card'].forEach(phase => {
      const trialRects = aoiRects[trialNum] || {};
      const rects = trialRects[phase];
      const samples = gazeData.filter(g => g.trial === trialNum && g.phase === phase);
      const offset = phase === 'first_card' ? 1 : 4;
      for (let bi = 0; bi < 3; bi++) {
        const aoiNum = offset + bi;
        if (!rects) {
          trial['aoi_' + aoiNum + '_gaze_count'] = 0;
          trial['aoi_' + aoiNum + '_gaze_pct'] = 0;
          continue;
        }
        const hits = samples.filter(s => gazeInRect(s.x, s.y, rects[bi]));
        trial['aoi_' + aoiNum + '_gaze_count'] = hits.length;
        trial['aoi_' + aoiNum + '_gaze_pct'] = samples.length > 0
          ? Math.round((hits.length / samples.length) * 100) : 0;
      }
    });
  });
}

function endExperiment() {
  showScreen('screen-end');
  webgazer.end();

  computeAOISummaries();

  const prefix = sessionID + '_' + participantInfo.id;

  const behavioralCSV = toCSV(trialData);
  downloadCSV(prefix + '_behavioral.csv', behavioralCSV);

  // delay second download so browser doesn't block it
  const gazeCSV = toCSV(gazeData);
  setTimeout(() => downloadCSV(prefix + '_gaze.csv', gazeCSV), 1000);

  document.getElementById('end-status').textContent = 'Your data has been saved.';
  document.getElementById('end-detail').textContent =
    trialData.length + ' trials completed, ' + gazeData.length + ' gaze samples recorded.';
}

function setupFullscreenMonitor() {
  const overlay = document.getElementById('fullscreen-warning');
  const btn = document.getElementById('btn-restore-fullscreen');

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && webgazerStarted) {
      webgazer.pause();
      overlay.classList.add('active');
    }
  });

  btn.addEventListener('click', async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (e) {}
    overlay.classList.remove('active');
    if (webgazerStarted) webgazer.resume();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupConsent();
  setupEntryForm();
  setupFullscreenMonitor();
  runChecks();
});

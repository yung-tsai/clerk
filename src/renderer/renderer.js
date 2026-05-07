// ── Element refs ───────────────────────────────────────────────────────────

const loginScreen    = document.getElementById('login-screen');
const closeBtn       = document.getElementById('close-btn');
const minimizeBtn    = document.getElementById('minimize-btn');
const emailInput     = document.getElementById('email-input');
const passwordInput  = document.getElementById('password-input');
const signinBtn      = document.getElementById('signin-btn');
const googleBtn      = document.getElementById('google-btn');
const loginStatus    = document.getElementById('login-status');

const wesMode        = document.getElementById('wes-mode');
const wes            = document.getElementById('wes');
const taskPanel      = document.getElementById('task-panel');
const taskList       = document.getElementById('task-list');
const badge          = document.getElementById('badge');
const miniWes        = document.getElementById('mini-wes');
const wesContainer   = document.getElementById('wes-container');
const speechBubble   = document.getElementById('speech-bubble');
const speechText     = document.getElementById('speech-text');
const addBtn         = document.getElementById('add-btn');
const addForm        = document.getElementById('add-form');
const addInput       = document.getElementById('add-input');

// ── Constants ──────────────────────────────────────────────────────────────

const BASE_H         = 140;
const PANEL_H        = 230;
const BUBBLE_H       = 72;
const ADD_H          = 110;
const DRAG_THRESHOLD = 4;
const REFRESH_MS     = 60_000;

const QUIPS = {
  greeting: [
    "Here's your day.",
    "What needs doing?",
    "Still here.",
    "Ready when you are.",
  ],
  greetingEmpty: [
    "Today is clear.",
    "Nothing on Today. Nice.",
    "Clean slate.",
  ],
  panelOpen: [
    "Here's the list.",
    "Your move.",
    "Today's plan.",
    "Take a look.",
  ],
  complete: [
    "Done. Next.",
    "One down.",
    "Good.",
    "That one's gone.",
    "Handled.",
    "Sorted.",
  ],
  allDone: [
    "Today is clear. Nice.",
    "Nothing left. Go outside.",
    "Clean slate. Don't waste it.",
    "All done. Seriously.",
    "Cleared. Impressive.",
  ],
  restore: [
    "Still here.",
    "Missed me?",
    "Back.",
  ],
  addedToday: [
    "On today's list.",
    "Added. Don't ignore it.",
    "Sorted. Your move.",
  ],
  addedTomorrow: [
    "Tomorrow it is.",
    "On the list for tomorrow.",
    "Not today's problem.",
  ],
  addedSoon: [
    "Coming up.",
    "On the list.",
    "Not urgent. Noted.",
  ],
  addedSomeday: [
    'Filed under "eventually".',
    "Someday. Where dreams live.",
    "It'll get there.",
  ],
};

// ── State ──────────────────────────────────────────────────────────────────

let panelOpen     = false;
let refreshTimer  = null;
let bubbleVisible = false;
let bubbleTimer   = null;
let addFormOpen   = false;
let selectedCol   = 'today';

// ── Window sizing ──────────────────────────────────────────────────────────

function syncWindowSize() {
  let h = BASE_H;
  if (panelOpen)     h += PANEL_H;
  if (bubbleVisible) h += BUBBLE_H;
  if (addFormOpen)   h += ADD_H;
  window.wesAPI.resizeWindow(h);
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function showBubble(text, duration = 3500) {
  if (bubbleTimer) clearTimeout(bubbleTimer);
  speechText.textContent = text;
  bubbleVisible = true;
  speechBubble.classList.remove('hidden');
  speechBubble.style.animation = 'none';
  speechBubble.offsetHeight; // force reflow to restart animation
  speechBubble.style.animation = '';
  syncWindowSize();
  bubbleTimer = setTimeout(hideBubble, duration);
}

function hideBubble() {
  if (bubbleTimer) clearTimeout(bubbleTimer);
  bubbleTimer   = null;
  bubbleVisible = false;
  speechBubble.classList.add('hidden');
  syncWindowSize();
}

// ── Task rendering ─────────────────────────────────────────────────────────

async function loadTasks() {
  const { tasks, error } = await window.wesAPI.fetchTodayTasks();
  if (error) return; // fail silently on refresh; user will see stale data

  // Badge
  if (tasks.length > 0) {
    badge.textContent = tasks.length;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }

  // List
  taskList.innerHTML = '';
  if (tasks.length === 0) {
    const li = document.createElement('li');
    li.className = 'task-empty';
    li.textContent = 'Nothing on Today. Nice.';
    taskList.appendChild(li);
    return;
  }
  tasks.forEach((task) => {
    const li = document.createElement('li');

    const check = document.createElement('button');
    check.type = 'button';
    check.className = 'task-check';
    check.setAttribute('aria-label', 'Complete task');
    li.appendChild(check);

    const text = document.createElement('div');
    text.className = 'task-text';

    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = task.title;
    text.appendChild(title);

    if (task.reason) {
      const reason = document.createElement('span');
      reason.className = 'task-reason';
      reason.textContent = task.reason;
      text.appendChild(reason);
    }

    li.appendChild(text);
    taskList.appendChild(li);

    check.addEventListener('click', () => completeTask(task.id, li));
  });
}

// ── Mode transitions ───────────────────────────────────────────────────────

function enterWesMode() {
  loginScreen.classList.add('hidden');
  wesMode.classList.remove('hidden');
  window.wesAPI.setWindowMode('wes');

  panelOpen = false;
  taskPanel.classList.add('hidden');
  syncWindowSize();

  loadTasks().then(() => {
    const hasTasks = !badge.classList.contains('hidden');
    setTimeout(() => showBubble(pick(hasTasks ? QUIPS.greeting : QUIPS.greetingEmpty)), 400);
  });
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(loadTasks, REFRESH_MS);
}

function enterLoginMode() {
  hideBubble();
  wesMode.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  window.wesAPI.setWindowMode('login');

  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
  badge.classList.add('hidden');
  loginStatus.textContent = '';
  loginStatus.className   = '';
  emailInput.value    = '';
  passwordInput.value = '';
  signinBtn.disabled    = false;
  signinBtn.textContent = 'Sign In';
  resetGoogleBtn();
}

// ── Auth ───────────────────────────────────────────────────────────────────

async function init() {
  const { hasSession } = await window.wesAPI.getSession();
  if (hasSession) {
    enterWesMode();
  } else {
    enterLoginMode();
  }
}

// ── Email / password ───────────────────────────────────────────────────────

async function doEmailSignIn() {
  const email    = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    loginStatus.className   = 'error';
    loginStatus.textContent = 'Please enter your email and password.';
    return;
  }

  signinBtn.disabled    = true;
  signinBtn.textContent = 'Signing in…';
  loginStatus.className = '';
  loginStatus.textContent = '';

  const { success, error } = await window.wesAPI.signIn(email, password);

  if (success) {
    enterWesMode();
  } else {
    loginStatus.className   = 'error';
    loginStatus.textContent = error || 'Sign-in failed. Check your credentials.';
    signinBtn.disabled    = false;
    signinBtn.textContent = 'Sign In';
  }
}

signinBtn.addEventListener('click', doEmailSignIn);
passwordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doEmailSignIn(); });

// ── Google ─────────────────────────────────────────────────────────────────

const GOOGLE_BTN_HTML = `<svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
  <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 6.294C4.672 4.167 6.656 3.58 9 3.58z" fill="#EA4335"/>
</svg> Sign in with Google`;

function resetGoogleBtn() {
  googleBtn.disabled = false;
  googleBtn.innerHTML = GOOGLE_BTN_HTML;
}

googleBtn.addEventListener('click', async () => {
  googleBtn.disabled    = true;
  googleBtn.textContent = 'Opening browser…';
  loginStatus.className = '';
  loginStatus.textContent = 'Complete sign-in in your browser, then come back.';

  // invoke awaits the full loopback flow — resolves only after code is exchanged
  const { success, error } = await window.wesAPI.signInWithGoogle();

  if (success) {
    enterWesMode();
  } else {
    loginStatus.className   = 'error';
    loginStatus.textContent = error || 'Sign-in failed. Please try again.';
    resetGoogleBtn();
  }
});

// ── Login card drag ────────────────────────────────────────────────────────

const loginCard = document.getElementById('login-card');
let loginDragging = false;
let loginLastX = 0;
let loginLastY = 0;

loginCard.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'A') return;
  loginDragging = true;
  loginLastX = e.screenX;
  loginLastY = e.screenY;
  e.preventDefault();
});

window.addEventListener('mousemove', (e) => {
  if (!loginDragging) return;
  window.wesAPI.moveWindowBy(e.screenX - loginLastX, e.screenY - loginLastY);
  loginLastX = e.screenX;
  loginLastY = e.screenY;
});

window.addEventListener('mouseup', (e) => {
  if (loginDragging && e.button === 0) loginDragging = false;
});

// ── Quick-add form ─────────────────────────────────────────────────────────

function closeAddForm() {
  addFormOpen = false;
  addForm.classList.add('hidden');
  addBtn.classList.remove('open');
  addInput.value = '';
  selectedCol = 'today';
  document.querySelectorAll('.col-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.col-btn[data-col="today"]').classList.add('active');
  syncWindowSize();
}

addBtn.addEventListener('click', () => {
  addFormOpen = !addFormOpen;
  addForm.classList.toggle('hidden', !addFormOpen);
  addBtn.classList.toggle('open', addFormOpen);
  syncWindowSize();
  if (addFormOpen) setTimeout(() => addInput.focus(), 50);
});

document.querySelectorAll('.col-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.col-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedCol = btn.dataset.col;
  });
});

addInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Escape') { closeAddForm(); return; }
  if (e.key !== 'Enter') return;
  const title = addInput.value.trim();
  if (!title) return;

  addInput.disabled = true;
  addBtn.disabled   = true;
  const activeColBtn = document.querySelector('#col-picker .col-btn.active');
  const col = activeColBtn ? activeColBtn.dataset.col : selectedCol;
  const { success } = await window.wesAPI.addTask({ title, col });
  addInput.disabled = false;
  addBtn.disabled   = false;

  if (success) {
    closeAddForm();
    const quipKey = col === 'today' ? 'addedToday' : col === 'tomorrow' ? 'addedTomorrow' : col === 'upcoming' ? 'addedSoon' : 'addedSomeday';
    showBubble(pick(QUIPS[quipKey]), 3000);
    if (col === 'today') loadTasks();
  } else {
    addInput.style.borderColor = '#ff3b30';
    setTimeout(() => { addInput.style.borderColor = ''; }, 1500);
  }
});

// ── Task completion ────────────────────────────────────────────────────────

function updateBadgeAndEmpty() {
  const remaining = taskList.querySelectorAll('li:not(.fade-out):not(.task-empty)').length;
  if (remaining > 0) {
    badge.textContent = remaining;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
    const li = document.createElement('li');
    li.className = 'task-empty';
    li.textContent = 'Nothing on Today. Nice.';
    taskList.appendChild(li);
  }
}

function completeTask(taskId, li) {
  const remaining = taskList.querySelectorAll('li:not(.fade-out):not(.task-empty)').length;
  const isLast    = remaining <= 1;
  showBubble(pick(isLast ? QUIPS.allDone : QUIPS.complete), isLast ? 5000 : 3000);

  li.classList.add('completing');
  setTimeout(() => {
    li.classList.add('fade-out');
    li.addEventListener('animationend', () => {
      li.remove();
      updateBadgeAndEmpty();
    }, { once: true });
  }, 400);
  window.wesAPI.completeTask(taskId);
}

closeBtn.addEventListener('click',    () => window.wesAPI.hideWindow());
minimizeBtn.addEventListener('click', () => window.wesAPI.minimizeWindow());

// Sign out from context menu
window.wesAPI.onSignedOut(() => enterLoginMode());

// ── Drag + click on Wes ────────────────────────────────────────────────────

let dragging  = false;
let hasDragged = false;
let lastX = 0;
let lastY = 0;

wes.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  dragging   = true;
  hasDragged = false;
  lastX = e.screenX;
  lastY = e.screenY;
  wes.style.cursor             = 'grabbing';
  wes.style.animationPlayState = 'paused';
  e.preventDefault();
});

window.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  const dx = e.screenX - lastX;
  const dy = e.screenY - lastY;
  if (!hasDragged && Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD) hasDragged = true;
  if (hasDragged) window.wesAPI.moveWindowBy(dx, dy);
  lastX = e.screenX;
  lastY = e.screenY;
});

window.addEventListener('mouseup', (e) => {
  if (!dragging || e.button !== 0) return;
  dragging = false;
  wes.style.cursor             = '';
  wes.style.animationPlayState = '';

  if (!hasDragged) {
    panelOpen = !panelOpen;
    taskPanel.classList.toggle('hidden', !panelOpen);
    if (panelOpen) {
      showBubble(pick(QUIPS.panelOpen), 3000);
    } else {
      if (addFormOpen) closeAddForm();
      else syncWindowSize();
    }
  }
});

// ── Right-click context menu ───────────────────────────────────────────────

wes.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  window.wesAPI.showContextMenu();
});

// ── Hide / show (from main or keyboard shortcut) ───────────────────────────

window.wesAPI.onHideWes(() => {
  if (bubbleTimer) clearTimeout(bubbleTimer);
  bubbleTimer   = null;
  bubbleVisible = false;
  speechBubble.classList.add('hidden');
  panelOpen = false;
  taskPanel.classList.add('hidden');
  addFormOpen = false;
  addForm.classList.add('hidden');
  addBtn.classList.remove('open');
  wesContainer.style.display = 'none';
  miniWes.classList.remove('hidden');
  syncWindowSize();
});

window.wesAPI.onShowWes(() => {
  wesContainer.style.display = '';
  miniWes.classList.add('hidden');
  panelOpen = false;
  taskPanel.classList.add('hidden');
  syncWindowSize();
  setTimeout(() => showBubble(pick(QUIPS.restore), 2500), 200);
});

// ── Mini Wes restore ───────────────────────────────────────────────────────

miniWes.addEventListener('click', () => window.wesAPI.restoreWes());

// ── Boot ───────────────────────────────────────────────────────────────────

init();

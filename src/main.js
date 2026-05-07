const { app, BrowserWindow, Menu, globalShortcut, ipcMain, screen, shell, safeStorage } = require('electron');
const path           = require('path');
const fs             = require('fs');
const http           = require('http');
const { randomUUID } = require('crypto');

let wesWindow = null;
let isHidden  = false;
let supabase  = null;

const WES_W      = 200;
const WES_H_BASE = 140;
const LOGIN_W    = 300;
const LOGIN_H    = 430;
const MARGIN     = 24;

// ── Position helpers ───────────────────────────────────────────────────────

function wesPosition(h = WES_H_BASE) {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  return { x: width - WES_W - MARGIN, y: height - h - MARGIN };
}

function loginPosition() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  return { x: Math.round((width - LOGIN_W) / 2), y: Math.round((height - LOGIN_H) / 2) };
}

// ── Browser-handoff auth server ────────────────────────────────────────────
// Opens getclerks.com/wes-auth in the system browser. The page POSTs
// { state, access_token, refresh_token } back to /handoff on this server.
// Returns { port, state, tokenPromise } — tokenPromise resolves with tokens.

function startHandoffServer() {
  const state = randomUUID();

  return new Promise((resolve, reject) => {
    let resolveTokens;
    const tokenPromise = new Promise((res) => { resolveTokens = res; });

    const CORS = { 'Access-Control-Allow-Origin': 'https://getclerks.com' };

    const server = http.createServer((req, res) => {
      // CORS preflight from getclerks.com
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          ...CORS,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age':       '600',
        });
        return res.end();
      }

      if (req.method !== 'POST' || req.url !== '/handoff') {
        res.writeHead(404); return res.end();
      }

      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        try {
          const { state: s, access_token, refresh_token } = JSON.parse(body);
          if (s !== state) { res.writeHead(400, CORS); return res.end('state mismatch'); }
          res.writeHead(200, { ...CORS, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
          server.close();
          resolveTokens({ access_token, refresh_token });
        } catch (err) {
          res.writeHead(400, CORS);
          res.end(String(err));
        }
      });
    });

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      resolve({ port: server.address().port, state, tokenPromise });
    });
  });
}

// ── Supabase ───────────────────────────────────────────────────────────────

function initSupabase() {
  const { createClient } = require('@supabase/supabase-js');

  // Prefer OS-keychain encryption via safeStorage; plain JSON as last-resort fallback.
  const canEncrypt = safeStorage.isEncryptionAvailable();
  const SESSION_FILE = path.join(
    app.getPath('userData'),
    canEncrypt ? 'wes-session.enc' : 'wes-session.json',
  );

  function readStore() {
    try {
      const raw = fs.readFileSync(SESSION_FILE);
      const json = canEncrypt ? safeStorage.decryptString(raw) : raw.toString('utf8');
      return JSON.parse(json);
    } catch { return {}; }
  }

  function writeStore(data) {
    const json = JSON.stringify(data);
    const out  = canEncrypt ? safeStorage.encryptString(json) : Buffer.from(json, 'utf8');
    fs.writeFileSync(SESSION_FILE, out);
  }

  const sessionStorage = {
    getItem:    (k)    => readStore()[k] ?? null,
    setItem:    (k, v) => { const s = readStore(); s[k] = v; writeStore(s); },
    removeItem: (k)    => { const s = readStore(); delete s[k]; writeStore(s); },
  };

  supabase = createClient(
    'https://jnhziusozbixowfvhloy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuaHppdXNvemJpeG93ZnZobG95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODM2NjIsImV4cCI6MjA5MzA1OTY2Mn0.fuDMTuO_-4fzvLS806XDrKdeJ8yeMVXaEmd5hH3OkmE',
    { auth: { persistSession: true, storage: sessionStorage, autoRefreshToken: true } },
  );
}

// ── Window ─────────────────────────────────────────────────────────────────

function createWesWindow() {
  const { x, y } = wesPosition();
  wesWindow = new BrowserWindow({
    width: WES_W, height: WES_H_BASE, x, y,
    show: false,
    transparent: true, frame: false, alwaysOnTop: true,
    skipTaskbar: true, resizable: false, hasShadow: false, focusable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  wesWindow.setAlwaysOnTop(true, 'screen-saver');
  wesWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  wesWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

function toggleVisibility() {
  if (!wesWindow) return;
  if (!wesWindow.isVisible()) {
    wesWindow.show();
    return;
  }
  isHidden ? wesWindow.webContents.send('show-wes') : wesWindow.webContents.send('hide-wes');
  isHidden = !isHidden;
}

// ── App lifecycle ──────────────────────────────────────────────────────────

app.whenReady().then(() => {
  if (app.dock) app.dock.hide();
  initSupabase();
  createWesWindow();
  globalShortcut.register('CommandOrControl+Shift+W', toggleVisibility);
});

app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', (e) => e.preventDefault());

// ── Auth IPC ───────────────────────────────────────────────────────────────

ipcMain.handle('auth-get-session', async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { hasSession: !!session, error: error?.message };
});

ipcMain.handle('auth-sign-in', async (_, { email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { success: !!data?.session, error: error?.message };
});

ipcMain.handle('auth-sign-in-google', async () => {
  try {
    const { port, state, tokenPromise } = await startHandoffServer();

    shell.openExternal(`https://getclerks.com/wes-auth?port=${port}&state=${state}`);

    // Wait for getclerks.com/wes-auth to POST tokens back (3-minute timeout)
    const { access_token, refresh_token } = await Promise.race([
      tokenPromise,
      new Promise((_, rej) => setTimeout(() => rej(new Error('Sign-in timed out')), 180_000)),
    ]);

    const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
    return { success: !!data?.session, error: error?.message };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('auth-sign-out', async () => {
  await supabase.auth.signOut({ scope: 'local' });
});

// ── Data IPC ───────────────────────────────────────────────────────────────

ipcMain.handle('add-task', async (_, { title, col }) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not signed in' };

  const { data: top } = await supabase
    .from('tasks')
    .select('position')
    .eq('col', col)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = (top?.position ?? -1) + 1;

  const { error } = await supabase
    .from('tasks')
    .insert({ title, col, position, user_id: user.id });

  return { success: !error, error: error?.message };
});

ipcMain.handle('complete-task', async (_, { taskId }) => {
  // Fetch the full row so we can copy it to completed_tasks
  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  // Best-effort move — ignore insert error (schema may differ)
  if (task) await supabase.from('completed_tasks').insert(task);

  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  return { success: !error, error: error?.message };
});

ipcMain.handle('fetch-today-tasks', async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, reason, position')
    .eq('col', 'today')
    .order('position', { ascending: true });
  return { tasks: data ?? [], error: error?.message };
});

// ── Window mode IPC ────────────────────────────────────────────────────────

ipcMain.on('set-window-mode', (_, mode) => {
  if (!wesWindow) return;
  if (mode === 'login') {
    const { x, y } = loginPosition();
    wesWindow.setBounds({ x, y, width: LOGIN_W, height: LOGIN_H });
  } else {
    const { x, y } = wesPosition();
    wesWindow.setBounds({ x, y, width: WES_W, height: WES_H_BASE });
  }
  wesWindow.show();
});

// ── Existing IPC ───────────────────────────────────────────────────────────

ipcMain.on('context-menu', () => {
  const menu = Menu.buildFromTemplate([
    { label: isHidden ? 'Show Wes' : 'Hide Wes', click: toggleVisibility },
    { type: 'separator' },
    {
      label: 'Sign Out',
      click: async () => {
        await supabase.auth.signOut({ scope: 'local' });
        wesWindow.webContents.send('signed-out');
      },
    },
    { type: 'separator' },
    { label: 'Quit', click: () => { globalShortcut.unregisterAll(); app.exit(0); } },
  ]);
  menu.popup({ window: wesWindow });
});

ipcMain.on('hide-window',     () => wesWindow?.hide());
ipcMain.on('minimize-window', () => wesWindow?.minimize());
ipcMain.on('restore-wes', () => { if (isHidden) toggleVisibility(); });

ipcMain.on('move-window-by', (_, { dx, dy }) => {
  if (!wesWindow) return;
  const [x, y] = wesWindow.getPosition();
  wesWindow.setPosition(x + dx, y + dy);
});

ipcMain.on('resize-window', (_, { height }) => {
  if (!wesWindow) return;
  const { x, y, height: curH } = wesWindow.getBounds();
  wesWindow.setBounds({ x, y: y + curH - height, width: WES_W, height });
});

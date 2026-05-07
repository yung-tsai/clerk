const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('wesAPI', {
  // Auth
  getSession:      ()           => ipcRenderer.invoke('auth-get-session'),
  signIn:          (email, pw)  => ipcRenderer.invoke('auth-sign-in', { email, password: pw }),
  signInWithGoogle:()           => ipcRenderer.invoke('auth-sign-in-google'),
  signOut:         ()        => ipcRenderer.invoke('auth-sign-out'),
  onSignedOut:     (cb)      => ipcRenderer.on('signed-out', cb),

  // Data
  fetchTodayTasks: ()        => ipcRenderer.invoke('fetch-today-tasks'),
  addTask:         (task)    => ipcRenderer.invoke('add-task', task),
  completeTask:    (taskId)  => ipcRenderer.invoke('complete-task', { taskId }),

  // Window
  hideWindow:      ()        => ipcRenderer.send('hide-window'),
  minimizeWindow:  ()        => ipcRenderer.send('minimize-window'),
  setWindowMode:   (mode)    => ipcRenderer.send('set-window-mode', mode),
  resizeWindow:    (h)       => ipcRenderer.send('resize-window', { height: h }),
  moveWindowBy:    (dx, dy)  => ipcRenderer.send('move-window-by', { dx, dy }),
  showContextMenu: ()        => ipcRenderer.send('context-menu'),
  restoreWes:      ()        => ipcRenderer.send('restore-wes'),

  // Events
  onShowWes:       (cb)      => ipcRenderer.on('show-wes', cb),
  onHideWes:       (cb)      => ipcRenderer.on('hide-wes', cb),
});

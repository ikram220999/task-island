// main.js
const {
  app,
  BrowserWindow,
  screen,
  globalShortcut,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
} = require("electron");
const path = require("path");

// Enable auto-reload for development
require('electron-reload')(path.join(__dirname, 'src'), {
  electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
});

let win = null;
let tray = null;
let isClickThrough = false;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } =
    primaryDisplay.workAreaSize;

  const windowWidth = 500;
  const windowHeight = 80;

  win = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    transparent: true,
    backgroundColor: "#00000000",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const x = Math.floor((screenWidth - windowWidth) / 2);
  const y = 0;
  win.setPosition(x, y);
  win.loadFile("src/index.html");

  // Register global shortcut
  globalShortcut.register("Alt+Space", () => {
    toggleClickThrough();
  });

  screen.on("display-metrics-changed", () => {
    const { width: newWidth } = screen.getPrimaryDisplay().workAreaSize;
    win.setPosition(Math.floor((newWidth - windowWidth) / 2), y);
  });

  createTray();
}

function createTray() {
  // Create a default tray icon (you should replace this with your own icon)
  // Path to your PNG icon
  const iconPath = path.join(__dirname, "src", "taskland.png");
  const icon = nativeImage.createFromPath(iconPath);

  // Create the tray
  tray = new Tray(icon);
  tray.setToolTip("Task Land");

  // Create context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Toggle Click-Through",
      click: () => toggleClickThrough(),
    },
    {
      type: "separator",
    },
    {
      label: "Show Window",
      click: () => {
        win.show();
        win.setAlwaysOnTop(true);
      },
    },
    {
      type: "separator",
    },
    {
      label: "Exit",
      click: () => {
        app.quit();
      },
    },
  ]);

  // Set the context menu
  tray.setContextMenu(contextMenu);

  // Optional: Double click to show window
  tray.on("double-click", () => {
    win.show();
    win.setAlwaysOnTop(true);
  });
}

function toggleClickThrough() {
  isClickThrough = !isClickThrough;
  win.setIgnoreMouseEvents(isClickThrough);

  // Send event to renderer to update UI
  win.webContents.send("click-through-changed", isClickThrough);

  // Update tray tooltip
  tray.setToolTip(
    `Sticky Window (${
      isClickThrough ? "Click-Through Enabled" : "Normal Mode"
    })`
  );
}

// Prevent app from closing when window is closed
app.on("window-all-closed", (e) => {
  if (process.platform !== "darwin") {
    // Don't quit the app, just hide the window
    e.preventDefault();
    win.hide();
  }
});

app.whenReady().then(createWindow);

app.on("will-quit", () => {
  // Clean up
  globalShortcut.unregisterAll();
  if (tray) {
    tray.destroy();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

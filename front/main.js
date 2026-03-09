const { app, BrowserWindow, nativeTheme, Menu } = require('electron');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "RTC Strikes Back",
    // On met un fond neutre au chargement
    backgroundColor: '#ffffff', 
    webPreferences: {
      nodeIntegration: true
    }
  });

  // --- CRÉATION DU MENU PERSONNALISÉ ---
  const menuTemplate = [
    {
      label: 'Affichage',
      submenu: [
        {
          label: 'Mode Sombre',
          click: () => { nativeTheme.themeSource = 'dark'; }
        },
        {
          label: 'Mode Clair',
          click: () => { nativeTheme.themeSource = 'light'; }
        },
        {
          label: 'Thème du Système',
          click: () => { nativeTheme.themeSource = 'system'; }
        }
      ]
    },
    {
      label: 'Débogage',
      submenu: [
        { role: 'reload', label: 'Recharger la page' },
        { role: 'toggleDevTools', label: 'Inspecter (Console)' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
  // -------------------------------------

  // Chargement de ton site Next.js
  mainWindow.loadURL('http://localhost:3000');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
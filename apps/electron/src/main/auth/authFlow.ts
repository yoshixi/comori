import { shell, app, BrowserWindow } from 'electron'

// Custom protocol for OAuth callback
const PROTOCOL = 'shuchu'
const CALLBACK_PATH = 'auth/callback'

// Reference to main window for sending IPC messages
let mainWindow: BrowserWindow | null = null

/**
 * Set the main window reference for IPC communication.
 */
export function setMainWindow(window: BrowserWindow | null): void {
  mainWindow = window
}

/**
 * Register the custom protocol handler.
 * Must be called before app is ready.
 */
export function registerProtocolHandler(): void {
  if (process.defaultApp) {
    // Development mode
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [process.argv[1]])
    }
  } else {
    // Production mode
    app.setAsDefaultProtocolClient(PROTOCOL)
  }
}

/**
 * Handle the OAuth callback URL.
 * Forwards the URL to the renderer process for Clerk SDK to handle.
 * Returns true if the URL was handled.
 */
export async function handleOAuthCallback(url: string): Promise<boolean> {
  if (!url.startsWith(`${PROTOCOL}://${CALLBACK_PATH}`)) {
    return false
  }

  // Forward the callback URL to renderer for Clerk SDK to process
  mainWindow?.webContents.send('auth:callback-url', url)
  return true
}

/**
 * Open a URL in the system browser.
 * Used for OAuth authorization flow.
 */
export async function openAuthUrl(url: string): Promise<void> {
  await shell.openExternal(url)
}

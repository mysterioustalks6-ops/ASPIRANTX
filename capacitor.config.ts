import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aspirantx.app',
  appName: 'AspirantX',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false
  },
  backgroundColor: '#020617', // Slate-950: Prevents white flash before web view mounts
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false // Disable for production release
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#020617',
      showSpinner: false,
      androidSplashResourceName: 'splash'
    }
  }
};

export default config;

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aspirantx.app',
  appName: 'AspirantX',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
};

export default config;

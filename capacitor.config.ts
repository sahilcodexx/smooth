import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smooth.app',
  appName: 'smooth',
  webDir: 'dist',
  server: {
    url: 'https://unmindful.vercel.app',
    cleartext: true
  }
};

export default config;

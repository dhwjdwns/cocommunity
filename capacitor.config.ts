import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'cococommunity',
  webDir: 'out',
  server: {
    url: 'https://cococommunity.vercel.app',
    cleartext: true
  }
};

export default config;

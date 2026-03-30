import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kindredpaws.app',
  appName: 'KindredPaws',
  webDir: 'dist',
  server: {
    url: 'http://192.168.2.6:3000',
    cleartext: true,
    androidScheme: 'http'
  }
};

export default config;

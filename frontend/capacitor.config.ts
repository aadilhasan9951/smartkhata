import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smartkhata.app',
  appName: 'SmartKhata',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  }
};

export default config;

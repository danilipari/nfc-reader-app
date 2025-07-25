import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Dontouch Tags Reader',
  webDir: 'dist',
  server: {
    allowNavigation: [
      'https://*.eaccess.glutz.com',
      'https://eaccess.glutz.com'
    ]
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;

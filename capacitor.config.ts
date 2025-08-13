import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Dontouch Tags Reader',
  webDir: 'dist',
  server: {
    allowNavigation: [
      'http://st-guess-who.test.k8s.dontouch.group'
    ]
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;

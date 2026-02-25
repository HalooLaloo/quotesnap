import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.brickquote',
  appName: 'BrickQuote',
  webDir: 'public',
  server: {
    url: 'https://brickquote.app',
    cleartext: false,
    androidScheme: 'https',
    allowNavigation: [
      'brickquote.app',
      '*.brickquote.app',
      '*.stripe.com',
    ],
  },
  android: {
    allowMixedContent: false,
    captureInput: false,
    webContentsDebuggingEnabled: false,
    appendUserAgent: 'BrickQuoteApp',
  },
  ios: {
    allowsLinkPreview: false,
    appendUserAgent: 'BrickQuoteApp',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f172a',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;

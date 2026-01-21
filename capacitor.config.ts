import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.brickquote',
  appName: 'BrickQuote',
  webDir: 'public',
  server: {
    url: 'https://brickquote.app',
    cleartext: false,
    androidScheme: 'https',
    allowNavigation: ['brickquote.app', '*.supabase.co', '*.supabase.com'],
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true, // Do debugowania
    appendUserAgent: 'BrickQuoteApp',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f172a', // slate-900
      showSpinner: false,
    },
  },
};

export default config;

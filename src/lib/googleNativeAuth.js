import { Capacitor, registerPlugin } from '@capacitor/core';

const GoogleAuth = registerPlugin('GoogleAuth');

let initialized = false;

export const isNativePlatform = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

export const initGoogleNativeAuth = (clientId) => {
  if (!isNativePlatform() || initialized) return;
  try {
    GoogleAuth.initialize({
      clientId,
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
    });
    initialized = true;
    console.log('Native GoogleAuth initialized with clientId:', clientId);
  } catch (e) {
    console.warn('Failed to initialize native GoogleAuth', e);
  }
};

export const signInWithGoogleNative = async () => {
  if (!isNativePlatform()) {
    throw new Error('Native Google sign-in attempted on non-native platform');
  }

  if (!GoogleAuth) {
    throw new Error('Native GoogleAuth plugin not found. Make sure it is installed and synced.');
  }

  const result = await GoogleAuth.signIn();
  return result;
};



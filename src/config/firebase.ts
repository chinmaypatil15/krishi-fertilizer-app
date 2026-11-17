/**
 * Google Firebase Configuration
 * -------------------------------------------------------------
 * Connected to live Firebase project: krishi-fertilizer-planning
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyClGsiC3n2Lx2rNx_BBC-GbHsgzfPkaqJE',
  authDomain: 'krishi-fertilizer-planning.firebaseapp.com',
  projectId: 'krishi-fertilizer-planning',
  storageBucket: 'krishi-fertilizer-planning.firebasestorage.app',
  messagingSenderId: '695261524240',
  appId: '1:695261524240:web:13548c90303ce4ef2e3595',
  measurementId: 'G-PTB8R1RGC1',
};

/**
 * Checks whether user has plugged in their live Firebase project credentials.
 */
export const isLiveFirebaseConfigured = (): boolean => {
  return (
    typeof firebaseConfig.apiKey === 'string' &&
    firebaseConfig.apiKey.startsWith('AIzaSy') &&
    firebaseConfig.projectId === 'krishi-fertilizer-planning'
  );
};

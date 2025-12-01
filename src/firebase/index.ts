
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from './config';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

function initializeFirebase() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  // NOTE: The conditional statement below is for connecting to the
  // local Firebase Emulator Suite. You can remove this block if you
  // are not using the emulators.
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && !auth.emulatorConfig) {
    // Point to the emulators.
    // This is required for local development.
    // connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    // connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
  }


  return { app, auth, firestore };
}

export { initializeFirebase };

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';

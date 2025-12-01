
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from './config';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

function initializeFirebase() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  return { app, auth, firestore };
}

export { initializeFirebase };

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';

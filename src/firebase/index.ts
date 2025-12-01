
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { firebaseConfig } from './config';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// A single object to hold the initialized Firebase services
let firebaseServices: { app: FirebaseApp; auth: Auth; firestore: Firestore; } | null = null;

/**
 * Initializes and returns Firebase services, ensuring it only happens once.
 * This function connects to your LIVE Firebase project.
 */
function initializeFirebase() {
  if (firebaseServices) {
    return firebaseServices;
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  
  firebaseServices = { app, auth, firestore };

  return firebaseServices;
}

export { initializeFirebase };

// Export all the necessary hooks and providers for use in the application
export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';

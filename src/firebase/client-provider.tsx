
'use client';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';
import { FirebaseProvider } from './provider';

// This is a singleton to ensure Firebase is initialized only once on the client.
let firebaseApp: FirebaseApp | null = null;
let firestore: Firestore | null = null;
let auth: Auth | null = null;

function getFirebaseInstances() {
  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig);
    firestore = getFirestore(firebaseApp);
    auth = getAuth(firebaseApp);
  }
  return { firebaseApp, firestore, auth };
}


export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // We get the instances directly. They are initialized only on the first call
  // thanks to the singleton pattern.
  const { firebaseApp, firestore, auth } = getFirebaseInstances();

  // The provider now renders immediately with the guaranteed instances.
  // The singleton pattern above ensures we don't re-initialize on every render,
  // preventing the "client is offline" race condition.
  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      firestore={firestore}
      auth={auth}
    >
      {children}
    </FirebaseProvider>
  );
}

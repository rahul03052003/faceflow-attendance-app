'use client';
import { useState, useEffect } from 'react';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';
import { FirebaseProvider } from './provider';

interface FirebaseInstances {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Singleton to ensure we only initialize once
let firebaseInstances: FirebaseInstances | null = null;

function initializeFirebaseInstances(): FirebaseInstances {
  if (typeof window !== 'undefined') {
    if (!firebaseInstances) {
      const firebaseApp = initializeApp(firebaseConfig);
      const firestore = getFirestore(firebaseApp);
      const auth = getAuth(firebaseApp);
      firebaseInstances = { firebaseApp, firestore, auth };
    }
    return firebaseInstances;
  }
  // This should not happen in the client-side provider
  throw new Error("Firebase cannot be initialized on the server in ClientProvider.");
}

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [instances, setInstances] = useState<FirebaseInstances | null>(null);

  useEffect(() => {
    // This effect runs only on the client, after the initial render.
    const newInstances = initializeFirebaseInstances();
    setInstances(newInstances);
  }, []);

  if (!instances) {
    // Return null on the server and during the initial client render
    // to prevent hydration mismatches and race conditions.
    return null;
  }

  // Once initialized, we provide the instances to the rest of the app.
  return (
    <FirebaseProvider
      firebaseApp={instances.firebaseApp}
      firestore={instances.firestore}
      auth={instances.auth}
    >
      {children}
    </FirebaseProvider>
  );
}

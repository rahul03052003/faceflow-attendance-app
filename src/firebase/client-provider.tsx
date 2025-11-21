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
  if (!firebaseInstances) {
    const firebaseApp = initializeApp(firebaseConfig);
    const firestore = getFirestore(firebaseApp);
    const auth = getAuth(firebaseApp);
    firebaseInstances = { firebaseApp, firestore, auth };
  }
  return firebaseInstances;
}

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [instances, setInstances] = useState<FirebaseInstances | null>(null);

  useEffect(() => {
    // Initialize on the client and set the state.
    // This effect runs only once after the component mounts.
    const instances = initializeFirebaseInstances();
    setInstances(instances);
  }, []);

  // While initializing, we render nothing. This prevents child components
  // from trying to access Firebase before it's ready.
  if (!instances) {
    return null;
  }

  // Once initialized, we render the provider with the guaranteed instances.
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

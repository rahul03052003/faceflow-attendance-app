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

// Singleton to ensure we only initialize once per client session
let firebaseInstances: FirebaseInstances | null = null;

function initializeFirebaseInstances(): FirebaseInstances {
  // This function will only execute its logic if firebaseInstances is null
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
  // We use state to hold the instances. This ensures that React's lifecycle
  // is respected, and we can prevent children from rendering until we are ready.
  const [instances, setInstances] = useState<FirebaseInstances | null>(null);

  useEffect(() => {
    // This effect runs only once on the client after the component mounts.
    // We call our initializer and set the state.
    const newInstances = initializeFirebaseInstances();
    setInstances(newInstances);
  }, []); // The empty dependency array is crucial.

  // By returning null here, we prevent any child components from rendering
  // on the server or on the initial client render before Firebase is ready.
  // This is the key to solving the race condition.
  if (!instances) {
    return null;
  }

  // Once the instances are available in our state, we render the provider
  // and the rest of the application.
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

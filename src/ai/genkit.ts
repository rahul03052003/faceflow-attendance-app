import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {config} from 'dotenv';
import {initializeApp, App, getApps} from 'firebase-admin/app';
import {getFirestore, Firestore} from 'firebase-admin/firestore';

config();

// Initialize Firebase Admin SDK, but only if it hasn't been initialized already.
let app: App;
if (getApps().length === 0) {
  app = initializeApp();
} else {
  app = getApps()[0];
}

export const firestore: Firestore = getFirestore(app);

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});

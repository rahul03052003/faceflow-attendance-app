import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {config} from 'dotenv';
import {initializeApp, getApps, App, credential} from 'firebase-admin/app';
import {getFirestore, Firestore} from 'firebase-admin/firestore';

config();

let adminApp: App;
if (!getApps().length) {
  adminApp = initializeApp();
} else {
  adminApp = getApps()[0];
}

export const firestore: Firestore = getFirestore(adminApp);

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import { config } from 'dotenv';
import {initializeApp, getApps, App, getApp} from 'firebase-admin/app';

config();

function getFirebaseAdminApp(): App {
    if (getApps().length > 0) {
      return getApp();
    }
    // This will use the default credentials provided by the environment.
    return initializeApp();
}

// Initialize Firebase Admin on server startup.
getFirebaseAdminApp();

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});

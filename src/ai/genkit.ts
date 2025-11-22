import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import { config } from 'dotenv';
import {initializeApp, getApps, App, getApp} from 'firebase-admin/app';

config();

function getFirebaseAdminApp(): App {
    if (getApps().length > 0) {
      return getApp();
    }
    return initializeApp();
}

getFirebaseAdminApp();

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});

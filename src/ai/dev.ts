import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-attendance-reports.ts';
import '@/ai/flows/process-voice-commands.ts';
import '@/ai/flows/text-to-speech.ts';

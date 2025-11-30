// This is an auto-generated file from Firebase Studio.

'use server';

/**
 * @fileOverview Processes voice commands to interact with the attendance system.
 *
 * - processVoiceCommand - Processes the given voice command and returns the action to be performed.
 * - ProcessVoiceCommandInput - The input type for the processVoiceCommand function.
 * - ProcessVoiceCommandOutput - The return type for the processVoiceCommand function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ProcessVoiceCommandInputSchema = z.object({
  command: z.string().describe('The voice command to process.'),
});
export type ProcessVoiceCommandInput = z.infer<typeof ProcessVoiceCommandInputSchema>;

const ProcessVoiceCommandOutputSchema = z.object({
  action: z.string().describe('The action to be performed. Should be one of: "navigate", "addUser", "markPresent", "showReport", "unknown".'),
  parameters: z.union([
    z.object({ page: z.string().describe("The page to navigate to (e.g., '/', '/reports').") }),
    z.object({ name: z.string().describe("The user's full name."), email: z.string().email().optional().describe("The user's email address.") }),
    z.object({ name: z.string().describe("The name of the user to mark as present.") }),
    z.object({ date: z.string().describe("The date for the report (e.g., 'today').") }),
    z.string(),
  ]).optional().describe('Parameters for the action, if any. For navigation, include a "page" parameter. For adding a user, include "name" and "email".'),
});
export type ProcessVoiceCommandOutput = z.infer<typeof ProcessVoiceCommandOutputSchema>;

export async function processVoiceCommand(input: ProcessVoiceCommandInput): Promise<ProcessVoiceCommandOutput> {
  return processVoiceCommandFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processVoiceCommandPrompt',
  input: {schema: ProcessVoiceCommandInputSchema},
  output: {schema: ProcessVoiceCommandOutputSchema},
  prompt: `You are an AI assistant that processes voice commands for an attendance system.

  Based on the user's voice command, determine the appropriate action to be performed and any necessary parameters.
  The available pages are: Dashboard ('/'), Capture Attendance ('/capture'), Attendance Reports ('/reports'), and User Management ('/users').

  Here are some example voice commands and their corresponding actions and parameters:

  - "Mark John as present": { "action": "markPresent", "parameters": { "name": "John" } }
  - "Show attendance report for today": { "action": "showReport", "parameters": { "date": "today" } }
  - "Go to the dashboard": { "action": "navigate", "parameters": { "page": "/" } }
  - "Open the user management page": { "action": "navigate", "parameters": { "page": "/users" } }
  - "Add new user Jane Doe with email jane.doe@example.com": { "action": "addUser", "parameters": { "name": "Jane Doe", "email": "jane.doe@example.com" } }
  - "Create a new user named Bob": { "action": "addUser", "parameters": { "name": "Bob" } }

  If the command is unclear, use the "unknown" action.

  Voice Command: {{{command}}}

  Output in JSON format:
  `,
});

const processVoiceCommandFlow = ai.defineFlow(
  {
    name: 'processVoiceCommandFlow',
    inputSchema: ProcessVoiceCommandInputSchema,
    outputSchema: ProcessVoiceCommandOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

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
import {z} from 'genkit';

const ProcessVoiceCommandInputSchema = z.object({
  command: z.string().describe('The voice command to process.'),
});
export type ProcessVoiceCommandInput = z.infer<typeof ProcessVoiceCommandInputSchema>;

const ProcessVoiceCommandOutputSchema = z.object({
  action: z.string().describe('The action to be performed based on the voice command.'),
  parameters: z.record(z.any()).describe('Parameters for the action, if any.'),
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

  Here are some example voice commands and their corresponding actions and parameters:

  - "Mark John as present": { "action": "markPresent", "parameters": { "name": "John" } }
  - "Show attendance report for today": { "action": "showReport", "parameters": { "date": "today" } }
  - "Add new user Jane Doe": { "action": "addUser", "parameters": { "name": "Jane Doe" } }

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

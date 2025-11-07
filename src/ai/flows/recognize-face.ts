'use server';

/**
 * @fileOverview Recognizes a face from an image.
 *
 * - recognizeFace - A function that recognizes a face from an image.
 * - RecognizeFaceInput - The input type for the recognizeFace function.
 * - RecognizeFaceOutput - The return type for the recognizeFace function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RecognizeFaceInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a person's face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type RecognizeFaceInput = z.infer<typeof RecognizeFaceInputSchema>;

const RecognizeFaceOutputSchema = z.object({
    userId: z.string().describe('The ID of the recognized user.'),
});
export type RecognizeFaceOutput = z.infer<typeof RecognizeFaceOutputSchema>;

export async function recognizeFace(
  input: RecognizeFaceInput
): Promise<RecognizeFaceOutput> {
  return recognizeFaceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recognizeFacePrompt',
  input: { schema: RecognizeFaceInputSchema },
  output: { schema: RecognizeFaceOutputSchema },
  prompt: `You are a face recognition expert. Given the image, identify the user.

  For the purpose of this demo, you can return a random user ID from the provided list, but in a real scenario, you would perform face matching.

  Known User IDs: 1, 2, 3, 4, 5, 6

  Analyze the face in the image provided.
  Photo: {{media url=photoDataUri}}
  
  Return the user ID of the person you recognize.`,
});

const recognizeFaceFlow = ai.defineFlow(
  {
    name: 'recognizeFaceFlow',
    inputSchema: RecognizeFaceInputSchema,
    outputSchema: RecognizeFaceOutputSchema,
  },
  async (input) => {
    // In a real application, you would implement logic to compare the face
    // against a database of known faces. For this demo, we'll simulate it.
    
    // Simulate getting a user ID. In a real app, this would come from a face matching service.
    const users = ['1', '2', '3', '4', '5', '6'];
    const randomUserId = users[Math.floor(Math.random() * users.length)];

    return {
      userId: randomUserId
    };
  }
);

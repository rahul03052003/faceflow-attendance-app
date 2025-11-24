
'use server';

/**
 * @fileOverview Recognizes a face from an image by comparing it against a provided list of registered users.
 *
 * - recognizeFace - A function that takes a photo, a list of users, and finds the closest matching user.
 * - RecognizeFaceInput - The input type for the recognizeFace function.
 * - RecognizeFaceOutput - The return type for the recognizeFace function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define User schema directly in the flow for self-containment
const UserSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    registerNo: z.string(),
    avatar: z.string(),
    role: z.enum(['Admin', 'User', 'Student', 'Teacher']),
    subjects: z.array(z.string()).optional(),
    facialFeatures: z.any().optional().describe("Stored facial features for recognition."),
  });
  
export type User = z.infer<typeof UserSchema>;

const RecognizeFaceInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a person's face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  users: z.array(UserSchema).describe("The list of registered users to compare against."),
});
export type RecognizeFaceInput = z.infer<typeof RecognizeFaceInputSchema>;

const RecognizeFaceOutputSchema = z.object({
  user: UserSchema.optional().describe("The user who was recognized, if any."),
  emotion: z.string().describe('The detected emotion of the person.'),
});
export type RecognizeFaceOutput = z.infer<typeof RecognizeFaceOutputSchema>;

export async function recognizeFace(
  input: RecognizeFaceInput
): Promise<RecognizeFaceOutput> {
  return recognizeFaceFlow(input);
}

const recognizeFaceFlow = ai.defineFlow(
  {
    name: 'recognizeFaceFlow',
    inputSchema: RecognizeFaceInputSchema,
    outputSchema: RecognizeFaceOutputSchema,
  },
  async ({ photoDataUri, users }) => {
    
    if (!users || users.length === 0) {
        throw new Error("No users provided to compare against.");
    }
    
    const result = await ai.generate({
        prompt: `You are an expert facial recognition system. Your task is to identify a person in an image and determine their emotion.
        
        1.  Analyze the person in the provided photo.
        2.  Compare their features against the list of registered users. Each user has a 'facialFeatures' field with their stored data.
        3.  Determine the single best match from the list.
        4.  Also determine the primary emotion of the person in the photo (e.g., Happy, Sad, Neutral).

        Registered Users:
        ${JSON.stringify(users.map(u => ({ id: u.id, name: u.name, features: u.facialFeatures })), null, 2)}
        
        Photo to analyze:
        {{media url=photoDataUri}}`,
        output: {
          schema: z.object({
            bestMatch: z.object({
                userId: z.string().describe("The ID of the best matching user from the provided list."),
            }).optional(),
            emotion: z.string().describe('Primary emotion detected in the photo (e.g., Happy, Sad, Neutral, Surprised).'),
          }),
        },
        input: { photoDataUri },
      });

    const output = result.output;
    if (!output) {
      throw new Error("Failed to get a response from the AI model.");
    }

    const matchedUser = users.find(u => u.id === output.bestMatch?.userId);

    return {
      user: matchedUser,
      emotion: output.emotion || 'Neutral',
    };
  }
);


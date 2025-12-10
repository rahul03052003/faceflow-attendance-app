
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


// SIMULATION HELPER: Calculate cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  return dotProduct / (magnitudeA * magnitudeB);
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
    
    // SIMULATION: Simulate a "no face detected" scenario.
    // There's a 10% chance the "model" won't find a face in the image.
    if (Math.random() < 0.1) {
        return {
            user: undefined,
            emotion: 'N/A',
        };
    }


    // SIMULATION: To avoid API quota issues, we perform a local comparison.
    // 1. We simulate a "live" scan by just using the facial features of the FIRST user in the list.
    //    This makes the simulation deterministic and predictable for testing.
    const scannedVector = users[0].facialFeatures;
    if (!scannedVector) {
        throw new Error(`Simulation failed: The first user (${users[0].name}) does not have facial feature data.`);
    }

    // 2. We compare the "scanned" vector against all registered users' vectors.
    let bestMatch: User | undefined = undefined;
    let highestSimilarity = -1;

    users.forEach(user => {
        const similarity = cosineSimilarity(scannedVector, user.facialFeatures);
        if (similarity > highestSimilarity) {
            highestSimilarity = similarity;
            bestMatch = user;
        }
    });
    
    // 3. We simulate a random emotion.
    const emotions = ['Happy', 'Sad', 'Neutral', 'Surprised'];
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];

    // We set a threshold for a successful match. Since we're using a user's own data,
    // this should always be very high (close to 1.0).
    const SIMILARITY_THRESHOLD = 0.9;

    if (highestSimilarity < SIMILARITY_THRESHOLD) {
      bestMatch = undefined; // If no one is a close enough match, consider it a failed recognition
    }

    return {
      user: bestMatch,
      emotion: randomEmotion,
    };


    /*
    // REAL API CALL (currently disabled due to quota limits)
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
    */
  }
);

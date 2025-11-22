'use server';

/**
 * @fileOverview Recognizes a face from an image and generates a voice greeting.
 *
 * - recognizeFace - A function that recognizes a face, finds the user, and returns their info along with a voice greeting.
 * - RecognizeFaceInput - The input type for the recognizeFace function.
 * - RecognizeFaceOutput - The return type for the recognizeFace function.
 */

import { ai, firestore } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
import { User } from '@/lib/types';


const RecognizeFaceInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a person's face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  userName: z.string().optional().describe("The name of the user to match. This is for simulation purposes."),
});
export type RecognizeFaceInput = z.infer<typeof RecognizeFaceInputSchema>;

const RecognizeFaceOutputSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    avatar: z.string(),
    role: z.string(),
    registerNo: z.string(),
  }),
  emotion: z.string().describe('The detected emotion of the person.'),
  audio: z
    .string()
    .optional()
    .describe(
      'The base64-encoded WAV audio data URI of the greeting.'
    ),
});
export type RecognizeFaceOutput = z.infer<typeof RecognizeFaceOutputSchema>;

export async function recognizeFace(
  input: RecognizeFaceInput
): Promise<RecognizeFaceOutput> {
  return recognizeFaceFlow(input);
}

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => {
      bufs.push(d);
    });
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const findClosestMatchTool = ai.defineTool(
  {
    name: 'findClosestMatch',
    description:
      'Finds the closest matching user from the Firestore database given a photo. This tool simulates matching by finding a user by name, or selecting the first user if no name is provided.',
    inputSchema: z.object({
      userName: z.string().optional(),
    }),
    outputSchema: z.custom<User>(),
  },
  async ({ userName }) => {
    console.log(`Simulating user match from Firestore 'users' collection for: ${userName || 'any user'}`);
    
    const usersCollection = firestore.collection('users');
    let query = usersCollection.limit(1);

    if (userName) {
      // In a real app, this would be a vector search on face embeddings.
      // Here, we simulate by querying for the user's name.
      query = usersCollection.where('name', '==', userName).limit(1);
    }
    
    const usersSnapshot = await query.get();
    
    if (usersSnapshot.empty) {
       // If no user is found by name, fall back to the first user in the DB
       const fallbackSnapshot = await usersCollection.limit(1).get();
       if (fallbackSnapshot.empty) {
         throw new Error("No users found in the database. Please add a user first.");
       }
       const doc = fallbackSnapshot.docs[0];
       const matchedUser = { id: doc.id, ...doc.data() } as User;
       console.log(`Simulated match (fallback): ${matchedUser.name}`);
       return matchedUser;
    }
    
    const doc = usersSnapshot.docs[0];
    const matchedUser = { id: doc.id, ...doc.data() } as User;

    console.log(`Simulated match found: ${matchedUser.name}`);
    return matchedUser;
  }
);


const recognizeFaceFlow = ai.defineFlow(
  {
    name: 'recognizeFaceFlow',
    inputSchema: RecognizeFaceInputSchema,
    outputSchema: RecognizeFaceOutputSchema,
  },
  async (input) => {
    // Step 1: Call the tool to find a matching user from the database.
    const matchedUser = await findClosestMatchTool({ userName: input.userName });

    if (!matchedUser) {
      throw new Error("Could not find a matching user in the database.");
    }

    // Step 2: Now that we have a user, get their emotion in a separate, simple call.
    const { output: emotionOutput } = await ai.generate({
      prompt: `A person named ${matchedUser.name} is in this photo. Analyze their face to determine their primary emotion. Choose from: Happy, Sad, Neutral, Surprised.
                
                Photo: {{media url=photoDataUri}}`,
      model: 'googleai/gemini-2.5-flash',
      output: {
        schema: z.object({
          emotion: z
            .string()
            .describe('The detected emotion of the person in the photo.'),
        }),
      },
      input: { photoDataUri: input.photoDataUri },
    });

    if (!emotionOutput) {
      throw new Error(
        'The AI model failed to determine the emotion from the photo.'
      );
    }
    const { emotion } = emotionOutput;

    // Step 3: Generate the audio greeting in a final, separate call.
    let audioDataUri: string | undefined = undefined;
    try {
      const greeting = `Hello, ${matchedUser.name}. You have been marked present.`;
      const { media } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-preview-tts',
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Algenib' },
            },
          },
        },
        prompt: greeting,
      });

      if (media) {
        const audioBuffer = Buffer.from(
          media.url.substring(media.url.indexOf(',') + 1),
          'base64'
        );
        const wavBase64 = await toWav(audioBuffer);
        audioDataUri = `data:audio/wav;base64,${wavBase64}`;
      }
    } catch (e) {
      console.error(
        'TTS generation failed, likely due to rate limits. Proceeding without audio.',
        e
      );
      // Fail gracefully, audio is optional
    }

    return {
      user: matchedUser,
      emotion: emotion || 'Neutral',
      audio: audioDataUri,
    };
  }
);

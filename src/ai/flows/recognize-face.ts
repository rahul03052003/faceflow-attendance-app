'use server';

/**
 * @fileOverview Recognizes a face from an image and generates a voice greeting.
 *
 * - recognizeFace - A function that recognizes a face, finds the user, and returns their info along with a voice greeting.
 * - RecognizeFaceInput - The input type for the recognizeFace function.
 * - RecognizeFaceOutput - The return type for the recognizeFace function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
import { User } from '@/lib/types';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

// In a real production app, this would come from a secure config or service
// However, we will use the client SDK to fetch users now.

const RecognizeFaceInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a person's face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type RecognizeFaceInput = z.infer<typeof RecognizeFaceInputSchema>;

const RecognizeFaceOutputSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    avatar: z.string(),
    role: z.string(),
  }),
  emotion: z.string().describe('The detected emotion of the person.'),
  audio: z.string().optional().describe('The base64-encoded WAV audio data URI of the greeting.'),
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

// Initialize a dedicated Firebase app instance for this server-side flow.
const flowApp = initializeApp(firebaseConfig, 'genkit-flow-app');
const flowDb = getFirestore(flowApp);

const findClosestMatchTool = ai.defineTool(
  {
    name: 'findClosestMatch',
    description: 'Finds the closest matching user from the database given a photo.',
    inputSchema: z.object({
      photoDataUri: z.string().describe("The photo of the user to identify, as a data URI.")
    }),
    outputSchema: z.custom<User>()
  },
  async (input) => {
    // In a real application, this tool would contain complex logic to:
    // 1. Extract facial features (embeddings) from the input photo.
    // 2. Query a vector database (like Firestore Vector Search) to find the embedding with the closest cosine similarity.
    // 3. Return the user associated with that embedding.

    // For this simulation, we'll fetch all users from Firestore and prioritize "v rahul" if he exists,
    // otherwise, we will return a random user to simulate a match.
    console.log("Fetching users from Firestore to find a match...");
    try {
      const usersCollection = collection(flowDb, 'users');
      const usersSnapshot = await getDocs(usersCollection);

      if (usersSnapshot.empty) {
        throw new Error("No users found in the database.");
      }
      
      const allUsers: User[] = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      
      const targetUser = allUsers.find(u => u.name.toLowerCase() === 'v rahul');

      if (targetUser) {
        console.log("Match found for 'v rahul'.");
        return targetUser;
      } else {
        console.log("'v rahul' not found, returning a random user as a simulated match.");
        const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
        return randomUser;
      }

    } catch(e) {
      console.error("Failed to fetch users from Firestore.", e);
      // This is a critical failure for the flow, so we throw an error.
      throw new Error("Could not find a user match. The database might be empty or inaccessible.");
    }
  }
);


const recognizeFaceFlow = ai.defineFlow(
  {
    name: 'recognizeFaceFlow',
    inputSchema: RecognizeFaceInputSchema,
    outputSchema: RecognizeFaceOutputSchema,
  },
  async (input) => {
     // Step 1: Force the model to use the tool to find a user.
    const toolResponse = await ai.generate({
      prompt: `Find the user in this photo: {{media url=photoDataUri}}`,
      model: 'googleai/gemini-2.5-flash',
      tools: [findClosestMatchTool],
      toolChoice: 'required',
    });

    const matchedUser = toolResponse.toolRequest?.output as User | undefined;

    if (!matchedUser) {
      throw new Error("Could not identify a user in the photo. The 'findClosestMatch' tool did not return a valid user.");
    }
    
    // Step 2: Now that we have a user, get their emotion.
    const { output } = await ai.generate({
       prompt: `A person named ${matchedUser.name} is in this photo. Analyze their face to determine their primary emotion. Choose from: Happy, Sad, Neutral, Surprised.
                
                Photo: {{media url=photoDataUri}}`,
      model: 'googleai/gemini-2.5-flash',
      output: {
        schema: z.object({
          emotion: z.string().describe('The detected emotion of the person in the photo.')
        })
      }
    });
    
    if (!output) {
      throw new Error("The AI model failed to determine the emotion from the photo.");
    }
    const { emotion } = output;

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
    } catch(e) {
        console.error("TTS generation failed, likely due to rate limits. Proceeding without audio.", e);
        // Fail gracefully, audio is optional
    }


    return {
      user: matchedUser,
      emotion: emotion || 'Neutral',
      audio: audioDataUri,
    };
  }
);


'use server';

/**
 * @fileOverview Recognizes a face from an image by comparing it against registered user profiles.
 *
 * - recognizeFace - A function that takes a photo, finds the closest matching user from the database, and returns their info along with a voice greeting.
 * - RecognizeFaceInput - The input type for the recognizeFace function.
 * - RecognizeFaceOutput - The return type for the recognizeFace function.
 */

import { ai } from '@/ai/genkit';
import { firestore } from '@/firebase/admin';
import { z } from 'genkit';
import wav from 'wav';

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
  
type User = z.infer<typeof UserSchema>;

const RecognizeFaceInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a person's face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type RecognizeFaceInput = z.infer<typeof RecognizeFaceInputSchema>;

const RecognizeFaceOutputSchema = z.object({
  user: UserSchema.optional().describe("The user who was recognized, if any."),
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

// Helper to convert PCM audio from the TTS model to WAV format
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


const recognizeFaceFlow = ai.defineFlow(
  {
    name: 'recognizeFaceFlow',
    inputSchema: RecognizeFaceInputSchema,
    outputSchema: RecognizeFaceOutputSchema,
  },
  async (input) => {
    // Step 1: Fetch all users from Firestore. A real-world app would optimize this.
    const usersSnapshot = await firestore.collection('users').get();
    const users: User[] = [];
    usersSnapshot.forEach(doc => {
      // Validate with Zod schema
      const parseResult = UserSchema.safeParse({ id: doc.id, ...doc.data() });
      if (parseResult.success) {
        users.push(parseResult.data);
      }
    });

    if (users.length === 0) {
      throw new Error("No users are registered in the system to compare against.");
    }
    
    // Step 2: Analyze the input image to get its features and emotion.
    const liveImageAnalysisResult = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        prompt: `Describe the facial features of the person in this photo in a detailed JSON format. Include descriptions of eyes, nose, mouth, face shape, and any distinguishing marks. Also, determine their primary emotion.
        
        Photo: {{media url=photoDataUri}}`,
        output: {
          schema: z.object({
            features: z.object({
              eyes: z.string(),
              nose: z.string(),
              mouth: z.string(),
              faceShape: z.string(),
            }),
            emotion: z.string().describe('Primary emotion: Happy, Sad, Neutral, Surprised.'),
          }),
        },
        input: { photoDataUri: input.photoDataUri },
      });

    const liveImageAnalysis = liveImageAnalysisResult.output;
    if (!liveImageAnalysis) {
      throw new Error("Failed to analyze the live camera image.");
    }
    
    // Step 3: Find the best match by comparing the live image features to all user features.
    const usersWithFeatures = users.filter(u => u.facialFeatures);
    
    if (usersWithFeatures.length === 0) {
        throw new Error("No users have facial feature data stored. Please re-register users with a photo.");
    }

    const comparisonPrompt = `You are a facial recognition expert. Based on the detailed descriptions of a live photo and several user profile photos, determine which user is the best match.

    LIVE PHOTO DESCRIPTION:
    ${JSON.stringify(liveImageAnalysis.features, null, 2)}

    REGISTERED USER DESCRIPTIONS:
    ${usersWithFeatures.map((user) => `
    USER ID: ${user.id}
    USER NAME: ${user.name}
    DESCRIPTION:
    ${JSON.stringify(user.facialFeatures, null, 2)}
    ---`).join('\n')}

    Based on your comparison, respond with the ID of the best-matching user. If no user is a confident match, respond with "unknown".`;
    
    const { text: matchedUserId } = await ai.generate({ prompt: comparisonPrompt });

    const matchedUser = users.find(u => u.id === matchedUserId.trim());

    // Step 4: If a user was matched, generate a personalized audio greeting.
    let audioDataUri: string | undefined = undefined;
    if (matchedUser) {
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
        // Fail gracefully, as audio is optional.
      }
    }

    return {
      user: matchedUser,
      emotion: liveImageAnalysis.emotion || 'Neutral',
      audio: audioDataUri,
    };
  }
);

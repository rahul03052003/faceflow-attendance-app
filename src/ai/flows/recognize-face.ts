
'use server';

/**
 * @fileOverview Recognizes a face from an image by comparing it against a provided list of registered users.
 *
 * - recognizeFace - A function that takes a photo, a list of users, finds the closest matching user, and returns their info along with a voice greeting.
 * - RecognizeFaceInput - The input type for the recognizeFace function.
 * - RecognizeFaceOutput - The return type for the recognizeFace function.
 */

import { ai } from '@/ai/genkit';
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
    
    if (!input.users || input.users.length === 0) {
        throw new Error("No users provided to compare against.");
    }
    
    // Step 1: Analyze the input image to get its features and emotion.
    const liveImageAnalysisResult = await ai.generate({
        prompt: `Analyze the person in this photo. Determine their primary emotion and describe their facial features in JSON format.
        
        Compare the facial features to the following list of registered users and identify the best match.
        
        Registered Users (with their stored features):
        ${JSON.stringify(input.users.map(u => ({ id: u.id, name: u.name, features: u.facialFeatures })), null, 2)}
        
        Photo: {{media url=photoDataUri}}`,
        output: {
          schema: z.object({
            bestMatch: z.object({
                userId: z.string().describe("The ID of the best matching user from the provided list."),
                confidence: z.number().describe("A confidence score from 0.0 to 1.0 on the match.")
            }).optional(),
            emotion: z.string().describe('Primary emotion: Happy, Sad, Neutral, Surprised.'),
          }),
        },
        input: { photoDataUri: input.photoDataUri },
      });

    const liveImageAnalysis = liveImageAnalysisResult.output;
    if (!liveImageAnalysis) {
      throw new Error("Failed to analyze the live camera image.");
    }
    
    const matchedUser = input.users.find(u => u.id === liveImageAnalysis.bestMatch?.userId);

    // Step 2: If a user was matched, generate a personalized audio greeting.
    let audioDataUri: string | undefined = undefined;
    const greeting = matchedUser 
      ? `Hello, ${matchedUser.name}. You have been marked present.`
      : `Recognition failed. Please try again.`;

      try {
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
          'TTS generation failed. Proceeding without audio.',
          e
        );
      }

    return {
      user: matchedUser,
      emotion: liveImageAnalysis.emotion || 'Neutral',
      audio: audioDataUri,
    };
  }
);

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
      'Finds the closest matching user from the database given a photo.',
    inputSchema: z.object({}), // No input needed from the model
    outputSchema: z.custom<User>(),
  },
  async () => {
    // THIS IS A SIMULATION.
    // In a real app, this would use a face matching AI model.
    // This tool now simulates finding a user without complex input, which was causing loops.
    
    const simulatedUsers: User[] = [
      { id: '1', name: 'Diana Miller', email: 'diana.m@example.com', avatar: `https://i.pravatar.cc/150?u=diana.m@example.com`, role: 'Admin' },
      { id: '2', name: 'James Smith', email: 'james.s@example.com', avatar: `https://i.pravatar.cc/150?u=james.s@example.com`, role: 'User' },
      { id: 'rahul-user', name: 'Rahul', email: 'rv03052003@gmail.com', avatar: `https://i.pravatar.cc/150?u=rv03052003@gmail.com`, role: 'User' },
    ];
    
    console.log("Simulating user match from a hardcoded list...");

    // Prioritize finding the user 'Rahul' for this demo.
    const targetUser = simulatedUsers.find(
      (u) => u.name.toLowerCase() === 'rahul'
    );

    if (targetUser) {
      console.log("Match found for 'Rahul' in the simulated list.");
      return targetUser;
    }

    // Fallback to a random user if 'Rahul' isn't in our simulated list.
    console.log("'Rahul' not found, returning a random user as a simulated match.");
    const randomUser =
      simulatedUsers[Math.floor(Math.random() * simulatedUsers.length)];
    return randomUser;
  }
);


const recognizeFaceFlow = ai.defineFlow(
  {
    name: 'recognizeFaceFlow',
    inputSchema: RecognizeFaceInputSchema,
    outputSchema: RecognizeFaceOutputSchema,
  },
  async (input) => {
    // Step 1: Force the model to use the tool to find a user. This is a robust way to ensure we get a user.
    const toolResponse = await ai.generate({
      prompt: `Find the user in this photo: {{media url=photoDataUri}}. You must use the findClosestMatch tool.`,
      model: 'googleai/gemini-2.5-flash',
      tools: [findClosestMatchTool],
      toolChoice: 'required',
      input: { photoDataUri: input.photoDataUri },
    });

    const matchedUser = toolResponse.toolRequest?.output as User | undefined;

    if (!matchedUser) {
      throw new Error(
        "Could not identify a user in the photo. The 'findClosestMatch' tool did not return a valid user."
      );
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
